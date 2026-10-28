import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as aiApi from "../../../src/api/ai";
import * as blocksApi from "../../../src/api/blocks";
import type { AiStreamEvent } from "../../../src/api/ai";
import { makeBlock, renderWithProviders } from "../../utils";
import CodeBlock from "../../../src/components/blocks/CodeBlock";

vi.mock("../../../src/api/ai");
vi.mock("../../../src/api/blocks");

const code = (overrides = {}) =>
  makeBlock({
    id: "block_1",
    type: "code",
    content: "const a = 1;",
    language: "typescript",
    ...overrides,
  });

const renderCode = (block = code()) =>
  renderWithProviders(<CodeBlock pageId="page_1" block={block} />);

/** Drives the mocked stream through a fixed sequence of events. */
const scriptStream = (events: AiStreamEvent[]) => {
  vi.mocked(aiApi.streamAi).mockImplementation(async (_id, _action, onEvent) => {
    for (const event of events) onEvent(event);
  });
};

beforeEach(() => {
  vi.mocked(blocksApi.updateBlock).mockResolvedValue(code());
  vi.mocked(blocksApi.deleteBlock).mockResolvedValue(undefined);
  scriptStream([]);
});

describe("CodeBlock — editing", () => {
  it("shows the block's language in the picker", () => {
    renderCode();

    expect(screen.getByRole("combobox")).toHaveValue("typescript");
  });

  it("falls back to plaintext when the block has no language", () => {
    renderCode(code({ language: null }));

    expect(screen.getByRole("combobox")).toHaveValue("plaintext");
  });

  it("persists a language change immediately", async () => {
    renderCode();

    await userEvent.selectOptions(screen.getByRole("combobox"), "python");

    expect(blocksApi.updateBlock).toHaveBeenCalledExactlyOnceWith("block_1", {
      language: "python",
    });
  });
});

describe("CodeBlock — AI actions", () => {
  it.each([
    ["✦ Explain", "explain", "Explanation"],
    ["Refactor", "refactor", "Refactor"],
    ["Test", "test", "Tests"],
  ])("runs the %s action and titles the panel", async (label, action, title) => {
    scriptStream([{ kind: "done" }]);
    renderCode();

    await userEvent.click(screen.getByRole("button", { name: label }));

    expect(aiApi.streamAi).toHaveBeenCalledWith(
      "block_1",
      action,
      expect.any(Function),
      expect.any(AbortSignal),
    );
    // `selector` disambiguates the panel heading from the action button, which
    // shares its label for "Refactor".
    expect(await screen.findByText(title, { selector: "span" })).toBeInTheDocument();
  });

  it("accumulates streamed chunks into the output panel", async () => {
    scriptStream([
      { kind: "text", text: "This code " },
      { kind: "text", text: "adds one." },
      { kind: "done" },
    ]);
    renderCode();

    await userEvent.click(screen.getByRole("button", { name: "✦ Explain" }));

    expect(await screen.findByText("This code adds one.")).toBeInTheDocument();
  });

  it("surfaces a stream error inline alongside whatever arrived first", async () => {
    scriptStream([
      { kind: "text", text: "partial output" },
      { kind: "error", message: "overloaded" },
    ]);
    renderCode();

    await userEvent.click(screen.getByRole("button", { name: "✦ Explain" }));

    expect(await screen.findByText(/partial output/)).toHaveTextContent("[Error: overloaded]");
  });

  it("dismisses the panel on CLOSE", async () => {
    scriptStream([{ kind: "text", text: "some explanation" }, { kind: "done" }]);
    renderCode();

    await userEvent.click(screen.getByRole("button", { name: "✦ Explain" }));
    await screen.findByText("some explanation");

    await userEvent.click(screen.getByRole("button", { name: "CLOSE" }));

    expect(screen.queryByText("some explanation")).not.toBeInTheDocument();
    expect(screen.queryByText("Explanation")).not.toBeInTheDocument();
  });

  it("clears previous output when a second action is run", async () => {
    scriptStream([{ kind: "text", text: "first answer" }, { kind: "done" }]);
    renderCode();

    await userEvent.click(screen.getByRole("button", { name: "✦ Explain" }));
    await screen.findByText("first answer");

    scriptStream([{ kind: "text", text: "second answer" }, { kind: "done" }]);
    await userEvent.click(screen.getByRole("button", { name: "Refactor" }));

    expect(await screen.findByText("second answer")).toBeInTheDocument();
    expect(screen.queryByText("first answer")).not.toBeInTheDocument();
  });

  it("aborts an in-flight stream when the block unmounts", async () => {
    let captured: AbortSignal | undefined;
    vi.mocked(aiApi.streamAi).mockImplementation(async (_id, _action, _onEvent, signal) => {
      captured = signal;
      await new Promise(() => {}); // never settles
    });
    const { unmount } = renderCode();

    await userEvent.click(screen.getByRole("button", { name: "✦ Explain" }));
    await waitFor(() => expect(captured).toBeDefined());
    unmount();

    expect(captured?.aborted).toBe(true);
  });
});
