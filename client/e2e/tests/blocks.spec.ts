import { addBlock, createPage, expect, test } from "../fixtures";

/** Waits for the debounced block save to reach the server. */
const waitForBlockSave = (page: Parameters<typeof addBlock>[0]) =>
  page.waitForResponse(
    (res) => res.request().method() === "PATCH" && /\/api\/blocks\//.test(res.url()),
  );

test.describe("blocks", () => {
  test("writes a text block that survives a reload", async ({ signedIn: page }) => {
    await createPage(page);

    await addBlock(page, "Text");
    const editor = page.getByPlaceholder("Write something…");
    await expect(editor).toBeVisible();

    await editor.fill("Notes from the meeting");
    await waitForBlockSave(page);

    await page.reload();
    await expect(page.getByText("Notes from the meeting")).toBeVisible();
  });

  test("ticks a to-do and keeps it ticked after a reload", async ({ signedIn: page }) => {
    await createPage(page);

    await addBlock(page, "To-do");
    const todo = page.getByPlaceholder("To-do");
    await expect(todo).toBeVisible();

    await todo.fill("Buy milk");
    await waitForBlockSave(page);

    await page.getByRole("button", { name: "Mark done" }).click();
    await waitForBlockSave(page);
    await expect(page.getByRole("button", { name: "Mark not done" })).toBeVisible();
    await expect(page.getByText("1 / 1 done")).toBeVisible();

    await page.reload();
    await expect(page.getByRole("button", { name: "Mark not done" })).toBeVisible();
    await expect(page.getByPlaceholder("To-do")).toHaveValue("Buy milk");
  });

  test("deletes a block", async ({ signedIn: page }) => {
    await createPage(page);

    await addBlock(page, "To-do");
    const todo = page.getByPlaceholder("To-do");
    await todo.fill("Temporary");
    await waitForBlockSave(page);

    await todo.hover();
    await page.getByRole("button", { name: "Delete block" }).click();

    await expect(page.getByPlaceholder("To-do")).toHaveCount(0);
    await page.reload();
    await expect(page.getByPlaceholder("To-do")).toHaveCount(0);
  });

  test("adds a code block with a language picker", async ({ signedIn: page }) => {
    await createPage(page);

    await addBlock(page, "Code");

    const language = page.getByRole("combobox");
    await expect(language).toHaveValue("typescript");

    await language.selectOption("python");
    await waitForBlockSave(page);

    await page.reload();
    await expect(page.getByRole("combobox")).toHaveValue("python");
  });
});
