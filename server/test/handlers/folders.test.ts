import request from "supertest";
import { describe, expect, it } from "vitest";
import { prismaMock } from "../prisma-mock";
import { TEST_USER_ID, authCookie, fakeFolder, testApp } from "../helpers";

const app = testApp();
const cookie = authCookie();

describe("GET /api/folders", () => {
    it("returns the caller's folders with their top-level pages", async () => {
        prismaMock.folder.findMany.mockResolvedValue([{ ...fakeFolder(), pages: [] }] as never);

        const res = await request(app).get("/api/folders").set("Cookie", cookie);

        expect(res.status).toBe(200);
        expect(res.body.folders).toHaveLength(1);
        expect(prismaMock.folder.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { userId: TEST_USER_ID },
                include: expect.objectContaining({
                    pages: expect.objectContaining({ where: { parentId: null } }),
                }),
            }),
        );
    });

    it("401s without a cookie", async () => {
        const res = await request(app).get("/api/folders");

        expect(res.status).toBe(401);
    });
});

describe("POST /api/folders", () => {
    it("creates a folder owned by the caller", async () => {
        prismaMock.folder.create.mockResolvedValue({ ...fakeFolder(), pages: [] } as never);

        const res = await request(app)
            .post("/api/folders")
            .set("Cookie", cookie)
            .send({ name: "Recipes" });

        expect(res.status).toBe(201);
        expect(prismaMock.folder.create).toHaveBeenCalledWith(
            expect.objectContaining({ data: { name: "Recipes", userId: TEST_USER_ID } }),
        );
    });

    it.each([
        ["an empty name", ""],
        ["a name over 100 characters", "x".repeat(101)],
    ])("400s on %s", async (_label, name) => {
        const res = await request(app).post("/api/folders").set("Cookie", cookie).send({ name });

        expect(res.status).toBe(400);
        expect(prismaMock.folder.create).not.toHaveBeenCalled();
    });

    it("accepts a name of exactly 100 characters", async () => {
        prismaMock.folder.create.mockResolvedValue({ ...fakeFolder(), pages: [] } as never);

        const res = await request(app)
            .post("/api/folders")
            .set("Cookie", cookie)
            .send({ name: "x".repeat(100) });

        expect(res.status).toBe(201);
    });
});

describe("PATCH /api/folders/:id", () => {
    it("renames an owned folder", async () => {
        prismaMock.folder.findFirst.mockResolvedValue(fakeFolder() as never);
        prismaMock.folder.update.mockResolvedValue({
            ...fakeFolder({ name: "Renamed" }),
            pages: [],
        } as never);

        const res = await request(app)
            .patch("/api/folders/folder_1")
            .set("Cookie", cookie)
            .send({ name: "Renamed" });

        expect(res.status).toBe(200);
        expect(prismaMock.folder.update).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: "folder_1" }, data: { name: "Renamed" } }),
        );
    });

    it("404s for a folder the caller doesn't own", async () => {
        prismaMock.folder.findFirst.mockResolvedValue(null);

        const res = await request(app)
            .patch("/api/folders/folder_1")
            .set("Cookie", cookie)
            .send({ name: "Renamed" });

        expect(res.status).toBe(404);
        expect(prismaMock.folder.update).not.toHaveBeenCalled();
    });
});

describe("DELETE /api/folders/:id", () => {
    it("deletes an owned folder and returns 204", async () => {
        prismaMock.folder.findFirst.mockResolvedValue(fakeFolder() as never);
        prismaMock.folder.delete.mockResolvedValue(fakeFolder() as never);

        const res = await request(app).delete("/api/folders/folder_1").set("Cookie", cookie);

        expect(res.status).toBe(204);
        expect(prismaMock.folder.delete).toHaveBeenCalledWith({ where: { id: "folder_1" } });
    });

    it("404s — and deletes nothing — for a folder the caller doesn't own", async () => {
        prismaMock.folder.findFirst.mockResolvedValue(null);

        const res = await request(app).delete("/api/folders/folder_1").set("Cookie", cookie);

        expect(res.status).toBe(404);
        expect(prismaMock.folder.delete).not.toHaveBeenCalled();
    });
});
