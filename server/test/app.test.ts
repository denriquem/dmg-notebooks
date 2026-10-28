import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { prismaMock } from "./prisma-mock";
import { authCookie, fakePage, testApp } from "./helpers";

const app = testApp();

describe("GET /health", () => {
    it("is public and reports ok", async () => {
        const res = await request(app).get("/health");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ ok: true });
    });
});

describe("security middleware", () => {
    it("sets helmet's hardening headers", async () => {
        const res = await request(app).get("/health");

        expect(res.headers["x-content-type-options"]).toBe("nosniff");
        expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
        expect(res.headers["x-powered-by"]).toBeUndefined();
    });
});

describe("CORS", () => {
    const originalOrigin = process.env.CLIENT_ORIGIN;

    afterEach(() => {
        if (originalOrigin === undefined) delete process.env.CLIENT_ORIGIN;
        else process.env.CLIENT_ORIGIN = originalOrigin;
    });

    it("allows credentialed requests from CLIENT_ORIGIN", async () => {
        process.env.CLIENT_ORIGIN = "https://notebook.example.com";

        const res = await request(createApp())
            .get("/health")
            .set("Origin", "https://notebook.example.com");

        expect(res.headers["access-control-allow-origin"]).toBe("https://notebook.example.com");
        expect(res.headers["access-control-allow-credentials"]).toBe("true");
    });

    it("does not echo an allow-origin header for other origins", async () => {
        process.env.CLIENT_ORIGIN = "https://notebook.example.com";

        const res = await request(createApp()).get("/health").set("Origin", "https://evil.example");

        expect(res.headers["access-control-allow-origin"]).not.toBe("https://evil.example");
    });

    it("defaults to the Vite dev server when CLIENT_ORIGIN is unset", async () => {
        delete process.env.CLIENT_ORIGIN;

        const res = await request(createApp()).get("/health").set("Origin", "http://localhost:5173");

        expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    });
});

describe("authentication guards", () => {
    it.each([
        ["get", "/api/pages"],
        ["post", "/api/pages"],
        ["get", "/api/pages/page_1"],
        ["patch", "/api/pages/page_1"],
        ["delete", "/api/pages/page_1"],
        ["get", "/api/folders"],
        ["post", "/api/folders"],
        ["patch", "/api/folders/folder_1"],
        ["delete", "/api/folders/folder_1"],
        ["post", "/api/pages/page_1/blocks"],
        ["patch", "/api/blocks/block_1"],
        ["delete", "/api/blocks/block_1"],
        ["post", "/api/ai"],
    ] as const)("%s %s requires a session", async (method, path) => {
        const res = await request(app)[method](path).send({});

        expect(res.status).toBe(401);
    });
});

describe("rate limiting", () => {
    const originalMax = process.env.RATE_LIMIT_MAX;
    const originalAiMax = process.env.AI_RATE_LIMIT_MAX;

    afterEach(() => {
        process.env.RATE_LIMIT_MAX = originalMax;
        process.env.AI_RATE_LIMIT_MAX = originalAiMax;
    });

    it("429s once the global window is exhausted", async () => {
        process.env.RATE_LIMIT_MAX = "2";
        const limited = createApp();

        expect((await request(limited).get("/health")).status).toBe(200);
        expect((await request(limited).get("/health")).status).toBe(200);

        const third = await request(limited).get("/health");
        expect(third.status).toBe(429);
    });

    it("advertises the remaining budget via standard headers", async () => {
        process.env.RATE_LIMIT_MAX = "5";
        const limited = createApp();

        const res = await request(limited).get("/health");

        expect(res.headers["ratelimit-limit"]).toBe("5");
        expect(res.headers["ratelimit-remaining"]).toBe("4");
    });

    it("applies a tighter, separate budget to the AI route", async () => {
        process.env.RATE_LIMIT_MAX = "100";
        process.env.AI_RATE_LIMIT_MAX = "1";
        const limited = createApp();
        prismaMock.page.findMany.mockResolvedValue([fakePage()] as never);
        prismaMock.block.findFirst.mockResolvedValue(null);

        const first = await request(limited)
            .post("/api/ai")
            .set("Cookie", authCookie())
            .send({ blockId: "block_1", action: "explain" });
        expect(first.status).toBe(404);

        const second = await request(limited)
            .post("/api/ai")
            .set("Cookie", authCookie())
            .send({ blockId: "block_1", action: "explain" });
        expect(second.status).toBe(429);
        expect(second.body).toEqual({ error: "Too many AI requests, please try again later" });

        // Other routes are unaffected by the AI budget.
        const pages = await request(limited).get("/api/pages").set("Cookie", authCookie());
        expect(pages.status).toBe(200);
    });
});
