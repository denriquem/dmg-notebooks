import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { makeBlock, renderWithProviders } from "../../utils";
import BlockList from "../../../src/components/blocks/BlockList";

vi.mock("../../api/blocks");

describe("BlockList", () => {
  it("renders each block type with its matching component", () => {
    renderWithProviders(
      <BlockList
        pageId="page_1"
        blocks={[
          makeBlock({ id: "b1", type: "text", content: "Some prose", orderIndex: 0 }),
          makeBlock({ id: "b2", type: "todo", content: "Buy milk", orderIndex: 1 }),
          makeBlock({ id: "b3", type: "code", content: "const a = 1;", orderIndex: 2 }),
        ]}
      />,
    );

    expect(screen.getByText("Some prose")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Buy milk")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument(); // the code block's language picker
  });

  it("orders blocks by orderIndex regardless of array order", () => {
    renderWithProviders(
      <BlockList
        pageId="page_1"
        blocks={[
          makeBlock({ id: "b3", type: "todo", content: "third", orderIndex: 2 }),
          makeBlock({ id: "b1", type: "todo", content: "first", orderIndex: 0 }),
          makeBlock({ id: "b2", type: "todo", content: "second", orderIndex: 1 }),
        ]}
      />,
    );

    const values = screen
      .getAllByRole("textbox")
      .map((el) => (el as HTMLInputElement).value);
    expect(values).toEqual(["first", "second", "third"]);
  });

  it("does not mutate the blocks array it is given", () => {
    const blocks = [
      makeBlock({ id: "b2", type: "todo", orderIndex: 1 }),
      makeBlock({ id: "b1", type: "todo", orderIndex: 0 }),
    ];

    renderWithProviders(<BlockList pageId="page_1" blocks={blocks} />);

    expect(blocks.map((b) => b.id)).toEqual(["b2", "b1"]);
  });

  it("renders nothing for an empty page", () => {
    renderWithProviders(<BlockList pageId="page_1" blocks={[]} />);

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
