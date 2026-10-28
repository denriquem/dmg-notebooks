import { createPage, expect, test } from "../fixtures";

test.describe("pages", () => {
  test("creates a page, renames it, and shows the new title on the dashboard", async ({
    signedIn: page,
  }) => {
    await createPage(page);

    await page.getByPlaceholder("Untitled").fill("Quarterly plan");
    // The title save is debounced, so wait for the request it eventually makes.
    await page.waitForResponse(
      (res) => res.request().method() === "PATCH" && /\/api\/pages\//.test(res.url()),
    );

    await page.getByRole("link", { name: /Loose pages/ }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText("Quarterly plan")).toBeVisible();
  });

  test("reopens a page from the dashboard with its content intact", async ({ signedIn: page }) => {
    await createPage(page);
    await page.getByPlaceholder("Untitled").fill("Reading list");
    await page.waitForResponse(
      (res) => res.request().method() === "PATCH" && /\/api\/pages\//.test(res.url()),
    );
    const editorUrl = page.url();

    await page.goto("/");
    await page.getByText("Reading list").click();

    await expect(page).toHaveURL(editorUrl);
    await expect(page.getByPlaceholder("Untitled")).toHaveValue("Reading list");
  });

  test("creates a subpage that links back to its parent", async ({ signedIn: page }) => {
    await createPage(page);
    await page.getByPlaceholder("Untitled").fill("Parent page");
    await page.waitForResponse(
      (res) => res.request().method() === "PATCH" && /\/api\/pages\//.test(res.url()),
    );
    const parentUrl = page.url();

    await page.getByRole("button", { name: "＋ Subpage" }).click();

    await expect(page).not.toHaveURL(parentUrl);
    await expect(page.getByText("SUBPAGE /")).toBeVisible();

    await page.getByRole("link", { name: "← Parent page" }).click();
    await expect(page).toHaveURL(parentUrl);
    await expect(page.getByText("Untitled").first()).toBeVisible();
  });

  test("deletes a page from the dashboard", async ({ signedIn: page }) => {
    await createPage(page);
    await page.getByPlaceholder("Untitled").fill("Throwaway");
    await page.waitForResponse(
      (res) => res.request().method() === "PATCH" && /\/api\/pages\//.test(res.url()),
    );

    await page.goto("/");
    const row = page.locator("div").filter({ hasText: /^01/ }).last();
    await row.hover();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete page" }).first().click();

    await expect(page.getByText("Throwaway")).toHaveCount(0);
  });
});
