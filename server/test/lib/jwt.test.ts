import jwt from "jsonwebtoken";
import { afterEach, describe, expect, it } from "vitest";
import { signToken, verifyToken } from "../../src/lib/jwt";

describe("jwt", () => {
    const originalSecret = process.env.JWT_SECRET;

    afterEach(() => {
        process.env.JWT_SECRET = originalSecret;
    });

    it("round-trips a payload", () => {
        const token = signToken({ userId: "user_1" });
        expect(verifyToken(token).userId).toBe("user_1");
    });

    it("issues tokens that expire in 7 days", () => {
        const token = signToken({ userId: "user_1" });
        const decoded = jwt.decode(token) as { iat: number; exp: number };
        expect(decoded.exp - decoded.iat).toBe(7 * 24 * 60 * 60);
    });

    it("rejects a token signed with a different secret", () => {
        const foreign = jwt.sign({ userId: "user_1" }, "someone-elses-secret");
        expect(() => verifyToken(foreign)).toThrow();
    });

    it("rejects a tampered token", () => {
        const token = signToken({ userId: "user_1" });
        expect(() => verifyToken(`${token}x`)).toThrow();
    });

    it("rejects an already-expired token", () => {
        const expired = jwt.sign({ userId: "user_1" }, process.env.JWT_SECRET!, {
            expiresIn: "-1s",
        });
        expect(() => verifyToken(expired)).toThrow(jwt.TokenExpiredError);
    });

    it("refuses to sign when JWT_SECRET is missing", () => {
        delete process.env.JWT_SECRET;
        expect(() => signToken({ userId: "user_1" })).toThrow("JWT_SECRET is not set");
    });
});
