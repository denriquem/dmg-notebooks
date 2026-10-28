import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../utils";
import AddBlockMenu from "../../../src/components/blocks/AddBlockMenu";

const openMenu = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /add block/i }));
  return user;
};

describe("AddBlockMenu", () => {
  it("hides the block choices until opened", () => {
    renderWithProviders(<AddBlockMenu onAdd={vi.fn()} />);

    expect(screen.queryByRole("button", { name: /text/i })).not.toBeInTheDocument();
  });

  it("reveals all three block types when opened", async () => {
    renderWithProviders(<AddBlockMenu onAdd={vi.fn()} />);

    await openMenu();

    expect(screen.getByRole("button", { name: /text.*styled prose/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /to-do.*checkable task/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /code.*snippet/i })).toBeInTheDocument();
  });

  it.each([
    [/text.*styled prose/i, "text"],
    [/to-do.*checkable task/i, "todo"],
    [/code.*snippet/i, "code"],
  ])("reports the chosen block type for %s", async (label, expected) => {
    const onAdd = vi.fn();
    renderWithProviders(<AddBlockMenu onAdd={onAdd} />);

    const user = await openMenu();
    await user.click(screen.getByRole("button", { name: label }));

    expect(onAdd).toHaveBeenCalledExactlyOnceWith(expected);
  });

  it("closes itself after a choice is made", async () => {
    renderWithProviders(<AddBlockMenu onAdd={vi.fn()} />);

    const user = await openMenu();
    await user.click(screen.getByRole("button", { name: /text.*styled prose/i }));

    expect(screen.queryByRole("button", { name: /styled prose/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add block/i })).toBeInTheDocument();
  });

  it("toggles shut when the trigger is clicked again", async () => {
    renderWithProviders(<AddBlockMenu onAdd={vi.fn()} />);

    const user = await openMenu();
    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(screen.queryByRole("button", { name: /styled prose/i })).not.toBeInTheDocument();
  });
});
