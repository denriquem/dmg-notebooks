import jwt from "jsonwebtoken";

const EXPIRES_IN = "7d";

export interface JwtPayload {
    userId: string;
}

function getSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not set");
    return secret;
}

export function signToken(payload: JwtPayload): string {
    return jwt.sign(payload, getSecret(), { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
    return jwt.verify(token, getSecret()) as JwtPayload;
}
