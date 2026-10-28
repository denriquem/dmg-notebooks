import type { Express } from "express";
import { createApp } from "../src/app";
import { signToken } from "../src/lib/jwt";

export const TEST_USER_ID = "user_1";

/** A `Cookie` header value that `requireAuth` will accept for the given user. */
export const authCookie = (userId: string = TEST_USER_ID): string =>
    `token=${signToken({ userId })}`;

/** Fresh app per test file so rate-limit counters never leak between files. */
export const testApp = (): Express => createApp();

type BlockOverrides = Partial<{
    id: string;
    pageId: string;
    type: "text" | "todo" | "code";
    content: string;
    language: string | null;
    style: unknown;
    orderIndex: number;
    checked: boolean;
}>;

export const fakeBlock = (overrides: BlockOverrides = {}) => ({
    id: "block_1",
    pageId: "page_1",
    type: "text" as const,
    content: "",
    language: null,
    style: null,
    orderIndex: 0,
    checked: false,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
});

export const fakePage = (overrides: Record<string, unknown> = {}) => ({
    id: "page_1",
    title: "Test page",
    userId: TEST_USER_ID,
    folderId: null,
    parentId: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
});

export const fakeFolder = (overrides: Record<string, unknown> = {}) => ({
    id: "folder_1",
    name: "Test folder",
    userId: TEST_USER_ID,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
});
