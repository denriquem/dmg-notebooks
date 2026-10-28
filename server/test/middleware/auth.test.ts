import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { requireAuth } from "../../src/middleware/auth";
import { signToken } from "../../src/lib/jwt";

const mockRes = () => {
    const res = {
        status: vi.fn(() => res),
        json: vi.fn(() => res),
    } as unknown as Response & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };
    return res;
};

const run = (cookies: Record<string, string> | undefined) => {
    const req = { cookies } as unknown as Request;
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;
    requireAuth(req, res, next);
    return { req, res, next };
};

describe("requireAuth", () => {
    it("attaches userId and calls next for a valid token", () => {
        const { req, res, next } = run({ token: signToken({ userId: "user_42" }) });
        expect(next).toHaveBeenCalledOnce();
        expect(req.userId).toBe("user_42");
        expect(res.status).not.toHaveBeenCalled();
    });

    it("401s when no cookie is present at all", () => {
        const { res, next } = run(undefined);
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: "Unauthorised" });
    });

    it("401s when the token cookie is missing", () => {
        const { res, next } = run({ other: "value" });
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it("401s for a token signed with the wrong secret", () => {
        const { res, next } = run({ token: jwt.sign({ userId: "user_42" }, "wrong") });
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it("401s for a malformed token rather than throwing", () => {
        const { res, next } = run({ token: "not-a-jwt" });
        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });
});
