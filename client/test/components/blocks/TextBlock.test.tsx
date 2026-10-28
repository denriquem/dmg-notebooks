import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as blocksApi from "../../../src/api/blocks";
import { makeBlock, renderWithProviders } from "../../utils";
import TextBlock from "../../../src/components/blocks/TextBlock";

vi.mock("../../../src/api/blocks");

const text = (overrides = {}) =>
  makeBlock({ id: "block_1", type: "text", content: "Hello there", ...overrides });

const renderText = (block = text()) =>
  renderWithProviders(<TextBlock pageId="page_1" block={block} />);

beforeEach(() => {
  vi.mocked(blocksApi.updateBlock).mockResolvedValue(text());
  vi.mocked(blocksApi.deleteBlock).mockResolvedValue(undefined);
});

describe("TextBlock — read mode", () => {
  it("shows existing content as prose, not an input", () => {
    renderText();

    expect(screen.getByText("Hello there")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Write something…")).not.toBeInTheDocument();
  });

  it("shows a write prompt once an empty block leaves edit mode", async () => {
    renderText(text({ content: "" }));

    await userEvent.click(screen.getByRole("button", { name: "DONE" }));

    expect(screen.getByText("Click to write…")).toBeInTheDocument();
  });

  it("opens the editor when the prose is clicked", async () => {
    renderText();

    await userEvent.click(screen.getByText("Hello there"));

    expect(screen.getByPlaceholderText("Write something…")).toBeInTheDocument();
  });
});

describe("TextBlock — edit mode", () => {
  it("starts in edit mode for a brand-new empty block", () => {
    renderText(text({ content: "" }));

    expect(screen.getByPlaceholderText("Write something…")).toBeInTheDocument();
  });

  it("saves typed content once the debounce settles", async () => {
    renderText(text({ content: "" }));

    await userEvent.type(screen.getByPlaceholderText("Write something…"), "New note");

    await waitFor(
      () =>
        expect(blocksApi.updateBlock).toHaveBeenCalledExactlyOnceWith("block_1", {
          content: "New note",
        }),
      { timeout: 2000 },
    );
  });

  it("leaves edit mode via the DONE button", async () => {
    renderText(text({ content: "" }));

    await userEvent.click(screen.getByRole("button", { name: "DONE" }));

    expect(screen.queryByPlaceholderText("Write something…")).not.toBeInTheDocument();
  });
});

describe("TextBlock — styling", () => {
  const enterEditMode = async () => {
    renderText();
    await userEvent.click(screen.getByText("Hello there"));
  };

  it.each([
    ["Display", "display"],
    ["Mono", "mono"],
  ])("persists the %s font immediately", async (label, font) => {
    await enterEditMode();

    await userEvent.click(screen.getByTitle(label));

    expect(blocksApi.updateBlock).toHaveBeenCalledWith("block_1", {
      style: { font, color: "ink", size: "md" },
    });
  });

  it("persists a size change", async () => {
    await enterEditMode();

    await userEvent.click(screen.getByTitle("Size L"));

    expect(blocksApi.updateBlock).toHaveBeenCalledWith("block_1", {
      style: { font: "sans", color: "ink", size: "lg" },
    });
  });

  it("persists a colour change", async () => {
    await enterEditMode();

    await userEvent.click(screen.getByTitle("Terracotta"));

    expect(blocksApi.updateBlock).toHaveBeenCalledWith("block_1", {
      style: { font: "sans", color: "terracotta", size: "md" },
    });
  });

  it("accumulates successive style changes rather than resetting them", async () => {
    await enterEditMode();

    await userEvent.click(screen.getByTitle("Mono"));
    await userEvent.click(screen.getByTitle("Size S"));

    expect(blocksApi.updateBlock).toHaveBeenLastCalledWith("block_1", {
      style: { font: "mono", color: "ink", size: "sm" },
    });
  });

  it("starts from the block's saved style, not the defaults", async () => {
    renderText(text({ style: { font: "mono", color: "teal", size: "lg" } }));

    await userEvent.click(screen.getByText("Hello there"));
    await userEvent.click(screen.getByTitle("Size S"));

    expect(blocksApi.updateBlock).toHaveBeenCalledWith("block_1", {
      style: { font: "mono", color: "teal", size: "sm" },
    });
  });
});

describe("TextBlock — deletion", () => {
  it("deletes the block from the chrome's delete control", async () => {
    renderText();

    await userEvent.click(screen.getByRole("button", { name: "Delete block" }));

    expect(blocksApi.deleteBlock).toHaveBeenCalledExactlyOnceWith("block_1");
  });
});
