import { test as base, expect, type Page } from "@playwright/test";

export type Credentials = { email: string; password: string; name: string };

type Fixtures = {
  /** A fresh, unregistered account unique to this test. */
  credentials: Credentials;
  /** A page already carrying a session cookie for `credentials`, on the dashboard. */
  signedIn: Page;
};

let seq = 0;

export const test = base.extend<Fixtures>({
  credentials: async ({}, use) => {
    seq += 1;
    await use({
      email: `e2e-${Date.now()}-${process.pid}-${seq}@example.test`,
      password: "e2e-password-123",
      name: "E2E User",
    });
  },

  signedIn: async ({ page, credentials }, use) => {
    // Registering over the API rather than the sign-up form keeps every other
    // spec independent of the auth UI — auth.spec.ts covers that path.
    const res = await page.request.post("/api/auth/register", { data: credentials });
    expect(res.status(), await res.text()).toBe(201);

    await page.goto("/");
    await expect(page.getByText(`Signed in as ${credentials.name}`)).toBeVisible();

    await use(page);
  },
});

export { expect };

/** Creates a page from the dashboard and waits for the editor to open. */
export const createPage = async (page: Page): Promise<void> => {
  await page.getByRole("button", { name: "＋ New page" }).first().click();
  await expect(page).toHaveURL(/\/pages\/[\w-]+$/);
  await expect(page.getByPlaceholder("Untitled")).toBeVisible();
};

/** Adds a block of the given kind via the editor's add-block menu. */
export const addBlock = async (page: Page, kind: "Text" | "To-do" | "Code"): Promise<void> => {
  await page.getByRole("button", { name: /Add block/ }).click();
  await page.getByRole("button", { name: new RegExp(`^${kind}`) }).click();
};
