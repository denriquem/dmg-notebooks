import request from "supertest";
import { describe, expect, it } from "vitest";
import { prismaMock } from "../prisma-mock";
import { TEST_USER_ID, authCookie, fakeFolder, fakePage, testApp } from "../helpers";

const app = testApp();
const cookie = authCookie();

describe("GET /api/pages", () => {
    it("returns only the caller's top-level pages, newest first", async () => {
        prismaMock.page.findMany.mockResolvedValue([fakePage()] as never);

        const res = await request(app).get("/api/pages").set("Cookie", cookie);

        expect(res.status).toBe(200);
        expect(res.body.pages).toHaveLength(1);
        expect(prismaMock.page.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { userId: TEST_USER_ID, parentId: null },
                orderBy: { updatedAt: "desc" },
            }),
        );
    });

    it("401s without a cookie", async () => {
        const res = await request(app).get("/api/pages");

        expect(res.status).toBe(401);
        expect(prismaMock.page.findMany).not.toHaveBeenCalled();
    });
});

describe("POST /api/pages", () => {
    it("creates a loose page owned by the caller", async () => {
        prismaMock.page.create.mockResolvedValue(fakePage() as never);

        const res = await request(app)
            .post("/api/pages")
            .set("Cookie", cookie)
            .send({ title: "Notes" });

        expect(res.status).toBe(201);
        expect(prismaMock.page.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: { title: "Notes", userId: TEST_USER_ID, folderId: null, parentId: null },
            }),
        );
    });

    it("400s on an empty title", async () => {
        const res = await request(app).post("/api/pages").set("Cookie", cookie).send({ title: "" });

        expect(res.status).toBe(400);
        expect(prismaMock.page.create).not.toHaveBeenCalled();
    });

    it("files the page into a folder the caller owns", async () => {
        prismaMock.folder.findFirst.mockResolvedValue(fakeFolder() as never);
        prismaMock.page.create.mockResolvedValue(fakePage({ folderId: "folder_1" }) as never);

        const res = await request(app)
            .post("/api/pages")
            .set("Cookie", cookie)
            .send({ title: "Notes", folderId: "folder_1" });

        expect(res.status).toBe(201);
        expect(prismaMock.folder.findFirst).toHaveBeenCalledWith({
            where: { id: "folder_1", userId: TEST_USER_ID },
        });
    });

    it("refuses a folder belonging to someone else", async () => {
        prismaMock.folder.findFirst.mockResolvedValue(null);

        const res = await request(app)
            .post("/api/pages")
            .set("Cookie", cookie)
            .send({ title: "Notes", folderId: "someone_elses_folder" });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: "Folder not found" });
        expect(prismaMock.page.create).not.toHaveBeenCalled();
    });

    it("creates a subpage under a parent the caller owns", async () => {
        prismaMock.page.findFirst.mockResolvedValue(fakePage() as never);
        prismaMock.page.create.mockResolvedValue(fakePage({ parentId: "page_1" }) as never);

        const res = await request(app)
            .post("/api/pages")
            .set("Cookie", cookie)
            .send({ title: "Child", parentId: "page_1" });

        expect(res.status).toBe(201);
        expect(prismaMock.page.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ parentId: "page_1" }),
            }),
        );
    });

    it("refuses a parent belonging to someone else", async () => {
        prismaMock.page.findFirst.mockResolvedValue(null);

        const res = await request(app)
            .post("/api/pages")
            .set("Cookie", cookie)
            .send({ title: "Child", parentId: "someone_elses_page" });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: "Parent page not found" });
        expect(prismaMock.page.create).not.toHaveBeenCalled();
    });
});

describe("GET /api/pages/:id", () => {
    it("returns the page with blocks ordered by orderIndex", async () => {
        prismaMock.page.findFirst.mockResolvedValue({
            ...fakePage(),
            blocks: [],
            children: [],
        } as never);

        const res = await request(app).get("/api/pages/page_1").set("Cookie", cookie);

        expect(res.status).toBe(200);
        expect(prismaMock.page.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: "page_1", userId: TEST_USER_ID },
                include: expect.objectContaining({
                    blocks: { orderBy: { orderIndex: "asc" } },
                }),
            }),
        );
    });

    it("404s for a page owned by another user", async () => {
        prismaMock.page.findFirst.mockResolvedValue(null);

        const res = await request(app).get("/api/pages/page_1").set("Cookie", cookie);

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: "Page not found" });
    });
});

describe("PATCH /api/pages/:id", () => {
    it("updates the title", async () => {
        prismaMock.page.findFirst.mockResolvedValue(fakePage() as never);
        prismaMock.page.update.mockResolvedValue(fakePage({ title: "Renamed" }) as never);

        const res = await request(app)
            .patch("/api/pages/page_1")
            .set("Cookie", cookie)
            .send({ title: "Renamed" });

        expect(res.status).toBe(200);
        expect(prismaMock.page.update).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: "page_1" }, data: { title: "Renamed" } }),
        );
    });

    it("unfiles a page when folderId is explicitly null", async () => {
        prismaMock.page.findFirst.mockResolvedValue(fakePage({ folderId: "folder_1" }) as never);
        prismaMock.page.update.mockResolvedValue(fakePage() as never);

        const res = await request(app)
            .patch("/api/pages/page_1")
            .set("Cookie", cookie)
            .send({ folderId: null });

        expect(res.status).toBe(200);
        expect(prismaMock.page.update).toHaveBeenCalledWith(
            expect.objectContaining({ data: { folderId: null } }),
        );
    });

    it("leaves untouched fields out of the update entirely", async () => {
        prismaMock.page.findFirst.mockResolvedValue(fakePage() as never);
        prismaMock.page.update.mockResolvedValue(fakePage() as never);

        await request(app)
            .patch("/api/pages/page_1")
            .set("Cookie", cookie)
            .send({ title: "Renamed" });

        const { data } = prismaMock.page.update.mock.calls[0][0] as { data: object };
        expect(Object.keys(data)).toEqual(["title"]);
    });

    it("404s for a page the caller doesn't own", async () => {
        prismaMock.page.findFirst.mockResolvedValue(null);

        const res = await request(app)
            .patch("/api/pages/page_1")
            .set("Cookie", cookie)
            .send({ title: "Renamed" });

        expect(res.status).toBe(404);
        expect(prismaMock.page.update).not.toHaveBeenCalled();
    });

    it("400s on an empty title", async () => {
        const res = await request(app)
            .patch("/api/pages/page_1")
            .set("Cookie", cookie)
            .send({ title: "" });

        expect(res.status).toBe(400);
        expect(prismaMock.page.findFirst).not.toHaveBeenCalled();
    });
});

describe("DELETE /api/pages/:id", () => {
    it("deletes an owned page and returns 204", async () => {
        prismaMock.page.findFirst.mockResolvedValue(fakePage() as never);
        prismaMock.page.delete.mockResolvedValue(fakePage() as never);

        const res = await request(app).delete("/api/pages/page_1").set("Cookie", cookie);

        expect(res.status).toBe(204);
        expect(prismaMock.page.delete).toHaveBeenCalledWith({ where: { id: "page_1" } });
    });

    it("404s — and deletes nothing — for a page the caller doesn't own", async () => {
        prismaMock.page.findFirst.mockResolvedValue(null);

        const res = await request(app).delete("/api/pages/page_1").set("Cookie", cookie);

        expect(res.status).toBe(404);
        expect(prismaMock.page.delete).not.toHaveBeenCalled();
    });
});
