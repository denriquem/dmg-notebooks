import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as blocksApi from "../../../src/api/blocks";
import { makeBlock, renderWithProviders } from "../../utils";
import TodoBlock from "../../../src/components/blocks/TodoBlock";

vi.mock("../../../src/api/blocks");

const todo = (overrides = {}) =>
  makeBlock({ id: "block_1", type: "todo", content: "Buy milk", ...overrides });

const renderTodo = (block = todo()) =>
  renderWithProviders(<TodoBlock pageId="page_1" block={block} />);

beforeEach(() => {
  vi.mocked(blocksApi.updateBlock).mockResolvedValue(todo());
  vi.mocked(blocksApi.deleteBlock).mockResolvedValue(undefined);
});

describe("TodoBlock", () => {
  it("renders the todo's text", () => {
    renderTodo();

    expect(screen.getByDisplayValue("Buy milk")).toBeInTheDocument();
  });

  it("offers to mark an unchecked todo as done", async () => {
    renderTodo();

    await userEvent.click(screen.getByRole("button", { name: "Mark done" }));

    expect(blocksApi.updateBlock).toHaveBeenCalledExactlyOnceWith("block_1", { checked: true });
  });

  it("offers to un-check a completed todo", async () => {
    renderTodo(todo({ checked: true }));

    await userEvent.click(screen.getByRole("button", { name: "Mark not done" }));

    expect(blocksApi.updateBlock).toHaveBeenCalledExactlyOnceWith("block_1", { checked: false });
  });

  it("strikes through a completed todo", () => {
    renderTodo(todo({ checked: true }));

    expect(screen.getByDisplayValue("Buy milk")).toHaveStyle({ textDecoration: "line-through" });
  });

  it("saves typed text once, after the debounce settles", async () => {
    renderTodo(todo({ content: "" }));

    await userEvent.type(screen.getByPlaceholderText("To-do"), "Walk dog");
    expect(blocksApi.updateBlock).not.toHaveBeenCalled();

    // One call for the whole burst, not one per keystroke.
    await waitFor(
      () =>
        expect(blocksApi.updateBlock).toHaveBeenCalledExactlyOnceWith("block_1", {
          content: "Walk dog",
        }),
      { timeout: 2000 },
    );
  });

  it("does not save when the text is edited back to its original value", async () => {
    renderTodo();

    const input = screen.getByDisplayValue("Buy milk");
    await userEvent.type(input, "!");
    await userEvent.type(input, "{backspace}");

    await new Promise((resolve) => setTimeout(resolve, 800));
    expect(blocksApi.updateBlock).not.toHaveBeenCalled();
  });

  it("deletes the block from the chrome's delete control", async () => {
    renderTodo();

    await userEvent.click(screen.getByRole("button", { name: "Delete block" }));

    expect(blocksApi.deleteBlock).toHaveBeenCalledExactlyOnceWith("block_1");
  });
});
