import bcrypt from "bcryptjs";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock } from "../prisma-mock";
import { authCookie, testApp } from "../helpers";
import { signToken } from "../../src/lib/jwt";

const app = testApp();

const dbUser = {
    id: "user_1",
    email: "ada@example.com",
    name: "Ada",
    password: "$2a$12$hashed",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

const cookieHeader = (res: request.Response): string[] =>
    (res.headers["set-cookie"] as unknown as string[]) ?? [];

beforeEach(() => {
    vi.restoreAllMocks();
});

describe("POST /api/auth/register", () => {
    const valid = { email: "ada@example.com", password: "correcthorse", name: "Ada" };

    it("creates the user, hashes the password and sets an auth cookie", async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);
        prismaMock.user.create.mockResolvedValue({
            id: "user_1",
            email: valid.email,
            name: valid.name,
        } as never);

        const res = await request(app).post("/api/auth/register").send(valid);

        expect(res.status).toBe(201);
        expect(res.body).toEqual({ user: { id: "user_1", email: valid.email, name: "Ada" } });

        const created = prismaMock.user.create.mock.calls[0][0] as {
            data: { password: string; email: string };
        };
        expect(created.data.password).not.toBe(valid.password);
        expect(await bcrypt.compare(valid.password, created.data.password)).toBe(true);

        const [cookie] = cookieHeader(res);
        expect(cookie).toMatch(/^token=/);
        expect(cookie).toContain("HttpOnly");
    });

    it("never returns the password hash", async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);
        prismaMock.user.create.mockResolvedValue({
            id: "user_1",
            email: valid.email,
            name: valid.name,
        } as never);

        const res = await request(app).post("/api/auth/register").send(valid);

        expect(JSON.stringify(res.body)).not.toContain("password");
        // The handler must scope the select so Prisma can't leak it either.
        const created = prismaMock.user.create.mock.calls[0][0] as {
            select: Record<string, boolean>;
        };
        expect(created.select).toEqual({ id: true, email: true, name: true });
    });

    it.each([
        ["a malformed email", { ...valid, email: "not-an-email" }],
        ["a password under 8 characters", { ...valid, password: "short" }],
        ["an empty name", { ...valid, name: "" }],
        ["a missing email", { password: valid.password, name: valid.name }],
    ])("rejects %s with 400", async (_label, body) => {
        const res = await request(app).post("/api/auth/register").send(body);

        expect(res.status).toBe(400);
        expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it("409s when the email is already registered", async () => {
        prismaMock.user.findUnique.mockResolvedValue(dbUser as never);

        const res = await request(app).post("/api/auth/register").send(valid);

        expect(res.status).toBe(409);
        expect(res.body).toEqual({ error: "Email already registered" });
        expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it("500s without leaking internals when the database throws", async () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        prismaMock.user.findUnique.mockRejectedValue(new Error("connection refused"));

        const res = await request(app).post("/api/auth/register").send(valid);

        expect(res.status).toBe(500);
        expect(res.body).toEqual({ error: "Internal server error" });
    });
});

describe("POST /api/auth/login", () => {
    it("sets an auth cookie for correct credentials", async () => {
        const password = "correcthorse";
        prismaMock.user.findUnique.mockResolvedValue({
            ...dbUser,
            password: await bcrypt.hash(password, 4),
        } as never);

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: dbUser.email, password });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            user: { id: dbUser.id, email: dbUser.email, name: dbUser.name },
        });
        expect(cookieHeader(res)[0]).toMatch(/^token=/);
    });

    it("401s with a generic message for an unknown email", async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "nobody@example.com", password: "whatever1" });

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: "Invalid credentials" });
    });

    it("401s for a wrong password, with the same message as an unknown email", async () => {
        prismaMock.user.findUnique.mockResolvedValue({
            ...dbUser,
            password: await bcrypt.hash("the-real-password", 4),
        } as never);

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: dbUser.email, password: "wrong-password" });

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: "Invalid credentials" });
        expect(cookieHeader(res)).toHaveLength(0);
    });

    it("400s on a malformed body before touching the database", async () => {
        const res = await request(app).post("/api/auth/login").send({ email: "nope" });

        expect(res.status).toBe(400);
        expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });
});

describe("POST /api/auth/logout", () => {
    it("clears the auth cookie", async () => {
        const res = await request(app).post("/api/auth/logout");

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ ok: true });
        expect(cookieHeader(res)[0]).toMatch(/^token=;/);
    });
});

describe("GET /api/auth/me", () => {
    it("returns the current user for a valid cookie", async () => {
        prismaMock.user.findUnique.mockResolvedValue({
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
        } as never);

        const res = await request(app).get("/api/auth/me").set("Cookie", authCookie("user_1"));

        expect(res.status).toBe(200);
        expect(res.body.user).toEqual({ id: dbUser.id, email: dbUser.email, name: dbUser.name });
        expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
            where: { id: "user_1" },
            select: { id: true, email: true, name: true },
        });
    });

    it("401s when no cookie is sent", async () => {
        const res = await request(app).get("/api/auth/me");

        expect(res.status).toBe(401);
        expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it("401s for an unverifiable token", async () => {
        const res = await request(app).get("/api/auth/me").set("Cookie", "token=garbage");

        expect(res.status).toBe(401);
    });

    it("401s when the token is valid but the user no longer exists", async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);

        const res = await request(app)
            .get("/api/auth/me")
            .set("Cookie", `token=${signToken({ userId: "deleted_user" })}`);

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: "Unauthorised" });
    });
});
