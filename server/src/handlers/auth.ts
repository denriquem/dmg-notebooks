import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../lib/prisma";
import { signToken, verifyToken } from "../lib/jwt";

const RegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1),
});

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

const isProd = process.env.NODE_ENV === "production";
const COOKIE_OPTS = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? ("none" as const) : ("lax" as const),
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const parsed = RegisterSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ error: parsed.error.flatten() });
            return;
        }
        const { email, password, name } = parsed.data;

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ error: "Email already registered" });
            return;
        }

        const hashed = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: { email, password: hashed, name },
            select: { id: true, email: true, name: true },
        });

        const token = signToken({ userId: user.id });
        res.cookie("token", token, COOKIE_OPTS).status(201).json({ user });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
    }

    const token = signToken({ userId: user.id });
    res.cookie("token", token, COOKIE_OPTS).json({
        user: { id: user.id, email: user.email, name: user.name },
    });
};

export const logout = (_req: Request, res: Response): void => {
    res.clearCookie("token").json({ ok: true });
};

export const me = async (req: Request, res: Response): Promise<void> => {
    const token = req.cookies?.token as string | undefined;
    if (!token) {
        res.status(401).json({ error: "Unauthorised" });
        return;
    }
    try {
        const { userId } = verifyToken(token);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true },
        });
        if (!user) {
            res.status(401).json({ error: "Unauthorised" });
            return;
        }
        res.json({ user });
    } catch {
        res.status(401).json({ error: "Unauthorised" });
    }
};
