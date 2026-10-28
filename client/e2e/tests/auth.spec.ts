import { expect, test } from "../fixtures";

test.describe("authentication", () => {
  test("sends a signed-out visitor to the login page", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("button", { name: "Log in", exact: true }).last()).toBeVisible();
  });

  test("signs up, lands on the dashboard, then signs out and back in", async ({
    page,
    credentials,
  }) => {
    await page.goto("/login");

    await page.getByRole("button", { name: "Sign up", exact: true }).click();
    await page.getByLabel("Name").fill(credentials.name);
    await page.getByLabel("Email").fill(credentials.email);
    await page.getByLabel("Password").fill(credentials.password);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText(`Signed in as ${credentials.name}`)).toBeVisible();

    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel("Email").fill(credentials.email);
    await page.getByLabel("Password").fill(credentials.password);
    await page.getByRole("button", { name: "Log in", exact: true }).last().click();

    await expect(page.getByText(`Signed in as ${credentials.name}`)).toBeVisible();
  });

  test("keeps the session across a reload", async ({ signedIn, credentials }) => {
    await signedIn.reload();

    await expect(signedIn.getByText(`Signed in as ${credentials.name}`)).toBeVisible();
  });

  test("rejects a wrong password", async ({ page, credentials }) => {
    await page.request.post("/api/auth/register", { data: credentials });
    await page.goto("/login");

    await page.getByLabel("Email").fill(credentials.email);
    await page.getByLabel("Password").fill("definitely-not-the-password");
    await page.getByRole("button", { name: "Log in", exact: true }).last().click();

    await expect(page.getByText("Invalid credentials")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
