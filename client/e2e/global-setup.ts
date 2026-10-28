import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// `client/package.json` sets `"type": "module"`, so this file compiles as
// ESM and `__dirname` isn't available — derive it from `import.meta.url`.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// This file lives at client/e2e/, so the repo root is two levels up.
const ROOT = path.resolve(__dirname, "..", "..");
const SERVER_DIR = path.join(ROOT, "server");

/** Reads a single key out of an untouched `.env` file, without loading it. */
const readEnvValue = (file: string, key: string): string | undefined => {
  if (!existsSync(file)) return undefined;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const match = line.match(new RegExp(`^\\s*${key}\\s*=\\s*(.*?)\\s*$`));
    if (match) return match[1].replace(/^["']|["']$/g, "");
  }
  return undefined;
};

/** The database name, i.e. the last path segment before any query string. */
const databaseName = (url: string): string => {
  try {
    return new URL(url).pathname.replace(/^\//, "");
  } catch {
    return "";
  }
};

export default function globalSetup(): void {
  const testDatabaseUrl = process.env.TEST_DATABASE_URL;

  if (!testDatabaseUrl) {
    throw new Error(
      "TEST_DATABASE_URL is not set.\n" +
        "End-to-end tests create and delete rows in the database they point at,\n" +
        "so they need a throwaway Postgres — never your development one.\n" +
        "See client/e2e/README.md for a one-line local setup.",
    );
  }

  // Fail closed: the naming rule holds even if the checks below can't find a
  // development URL to compare against. The dev database is named `postgres`,
  // so it can never satisfy this.
  const name = databaseName(testDatabaseUrl);
  if (!/test/i.test(name)) {
    throw new Error(
      `Refusing to run: TEST_DATABASE_URL points at a database named "${name}".\n` +
        'End-to-end databases must have "test" in the name, as a guard against\n' +
        "pointing the suite at real data. Try `dmnotebook_e2e_test`.",
    );
  }

  const devDatabaseUrl =
    process.env.DATABASE_URL ?? readEnvValue(path.join(SERVER_DIR, ".env"), "DATABASE_URL");

  if (devDatabaseUrl && testDatabaseUrl === devDatabaseUrl) {
    throw new Error(
      "Refusing to run: TEST_DATABASE_URL is the same as the development DATABASE_URL.",
    );
  }

  // `migrate deploy` only applies committed migrations — it never prompts and
  // never resets, so it is safe to run on every invocation.
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    cwd: SERVER_DIR,
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseUrl,
      DIRECT_URL: process.env.TEST_DIRECT_URL ?? testDatabaseUrl,
    },
  });
}
