import type { PrismaClient } from "@prisma/client";
import { beforeEach, vi } from "vitest";
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended";

/**
 * The handlers all import the same `src/lib/prisma` singleton, so swapping that
 * one module for a deep mock gives every test full control over the database
 * layer without needing a real Postgres.
 */
export const prismaMock: DeepMockProxy<PrismaClient> = mockDeep<PrismaClient>();

vi.mock("../src/lib/prisma", () => ({ default: prismaMock }));

beforeEach(() => {
    mockReset(prismaMock);
});
