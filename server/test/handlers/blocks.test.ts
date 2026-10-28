import request from "supertest";
import { describe, expect, it } from "vitest";
import { prismaMock } from "../prisma-mock";
import { TEST_USER_ID, authCookie, fakeBlock, fakePage, testApp } from "../helpers";

const app = testApp();
const cookie = authCookie();

describe("POST /api/pages/:pageId/blocks", () => {
    it("creates a block on a page the caller owns", async () => {
        prismaMock.page.findFirst.mockResolvedValue(fakePage() as never);
        prismaMock.block.create.mockResolvedValue(fakeBlock() as never);

        const res = await request(app)
            .post("/api/pages/page_1/blocks")
            .set("Cookie", cookie)
            .send({ type: "text", content: "Hello", orderIndex: 0 });

        expect(res.status).toBe(201);
        expect(prismaMock.page.findFirst).toHaveBeenCalledWith({
            where: { id: "page_1", userId: TEST_USER_ID },
        });
        expect(prismaMock.block.create).toHaveBeenCalledWith({
            data: { type: "text", content: "Hello", orderIndex: 0, pageId: "page_1" },
        });
    });

    it("defaults content to an empty string", async () => {
        prismaMock.page.findFirst.mockResolvedValue(fakePage() as never);
        prismaMock.block.create.mockResolvedValue(fakeBlock() as never);

        await request(app)
            .post("/api/pages/page_1/blocks")
            .set("Cookie", cookie)
            .send({ type: "todo", orderIndex: 2 });

        const { data } = prismaMock.block.create.mock.calls[0][0] as { data: { content: string } };
        expect(data.content).toBe("");
    });

    it("404s before validating the body when the page isn't the caller's", async () => {
        prismaMock.page.findFirst.mockResolvedValue(null);

        const res = await request(app)
            .post("/api/pages/page_1/blocks")
            .set("Cookie", cookie)
            .send({ type: "text", orderIndex: 0 });

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: "Page not found" });
        expect(prismaMock.block.create).not.toHaveBeenCalled();
    });

    it.each([
        ["an unknown block type", { type: "video", orderIndex: 0 }],
        ["a missing orderIndex", { type: "text" }],
        ["a non-integer orderIndex", { type: "text", orderIndex: 1.5 }],
        ["an unknown style font", { type: "text", orderIndex: 0, style: { font: "comic" } }],
        ["an unknown style colour", { type: "text", orderIndex: 0, style: { color: "puce" } }],
    ])("400s on %s", async (_label, body) => {
        prismaMock.page.findFirst.mockResolvedValue(fakePage() as never);

        const res = await request(app)
            .post("/api/pages/page_1/blocks")
            .set("Cookie", cookie)
            .send(body);

        expect(res.status).toBe(400);
        expect(prismaMock.block.create).not.toHaveBeenCalled();
    });

    it("accepts a full text style", async () => {
        prismaMock.page.findFirst.mockResolvedValue(fakePage() as never);
        prismaMock.block.create.mockResolvedValue(fakeBlock() as never);

        const style = { font: "display", color: "teal", size: "lg" };
        const res = await request(app)
            .post("/api/pages/page_1/blocks")
            .set("Cookie", cookie)
            .send({ type: "text", orderIndex: 0, style });

        expect(res.status).toBe(201);
        const { data } = prismaMock.block.create.mock.calls[0][0] as { data: { style: unknown } };
        expect(data.style).toEqual(style);
    });
});

describe("PATCH /api/blocks/:id", () => {
    it("toggles a todo's checked flag", async () => {
        prismaMock.block.findFirst.mockResolvedValue(fakeBlock({ type: "todo" }) as never);
        prismaMock.block.update.mockResolvedValue(
            fakeBlock({ type: "todo", checked: true }) as never,
        );

        const res = await request(app)
            .patch("/api/blocks/block_1")
            .set("Cookie", cookie)
            .send({ checked: true });

        expect(res.status).toBe(200);
        expect(res.body.block.checked).toBe(true);
        expect(prismaMock.block.update).toHaveBeenCalledWith({
            where: { id: "block_1" },
            data: { checked: true },
        });
    });

    it("scopes the ownership check through the parent page", async () => {
        prismaMock.block.findFirst.mockResolvedValue(fakeBlock() as never);
        prismaMock.block.update.mockResolvedValue(fakeBlock() as never);

        await request(app)
            .patch("/api/blocks/block_1")
            .set("Cookie", cookie)
            .send({ content: "updated" });

        expect(prismaMock.block.findFirst).toHaveBeenCalledWith({
            where: { id: "block_1", page: { userId: TEST_USER_ID } },
        });
    });

    it("404s for a block on someone else's page", async () => {
        prismaMock.block.findFirst.mockResolvedValue(null);

        const res = await request(app)
            .patch("/api/blocks/block_1")
            .set("Cookie", cookie)
            .send({ content: "updated" });

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: "Block not found" });
        expect(prismaMock.block.update).not.toHaveBeenCalled();
    });

    it("400s on an invalid partial update", async () => {
        prismaMock.block.findFirst.mockResolvedValue(fakeBlock() as never);

        const res = await request(app)
            .patch("/api/blocks/block_1")
            .set("Cookie", cookie)
            .send({ checked: "yes" });

        expect(res.status).toBe(400);
        expect(prismaMock.block.update).not.toHaveBeenCalled();
    });

    it("ignores unknown fields rather than writing them", async () => {
        prismaMock.block.findFirst.mockResolvedValue(fakeBlock() as never);
        prismaMock.block.update.mockResolvedValue(fakeBlock() as never);

        await request(app)
            .patch("/api/blocks/block_1")
            .set("Cookie", cookie)
            .send({ content: "updated", pageId: "someone_elses_page" });

        const { data } = prismaMock.block.update.mock.calls[0][0] as { data: object };
        expect(data).toEqual({ content: "updated" });
    });
});

describe("DELETE /api/blocks/:id", () => {
    it("deletes an owned block and returns 204", async () => {
        prismaMock.block.findFirst.mockResolvedValue(fakeBlock() as never);
        prismaMock.block.delete.mockResolvedValue(fakeBlock() as never);

        const res = await request(app).delete("/api/blocks/block_1").set("Cookie", cookie);

        expect(res.status).toBe(204);
        expect(prismaMock.block.delete).toHaveBeenCalledWith({ where: { id: "block_1" } });
    });

    it("404s — and deletes nothing — for a block the caller doesn't own", async () => {
        prismaMock.block.findFirst.mockResolvedValue(null);

        const res = await request(app).delete("/api/blocks/block_1").set("Cookie", cookie);

        expect(res.status).toBe(404);
        expect(prismaMock.block.delete).not.toHaveBeenCalled();
    });
});
