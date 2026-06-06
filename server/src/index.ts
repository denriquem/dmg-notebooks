import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import { requireAuth } from "./middleware/auth";
import { register, login, logout, me } from "./handlers/auth";
import {
    listPages,
    createPage,
    getPage,
    updatePage,
    deletePage,
} from "./handlers/pages";
import {
    listFolders,
    createFolder,
    updateFolder,
    deleteFolder,
} from "./handlers/folders";
import { createBlock, updateBlock, deleteBlock } from "./handlers/blocks";
import { runAiAction } from "./handlers/ai";
import { httpLogger } from "./logger";

const app = express();
const PORT = process.env.PORT ?? 3001;

const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
if (process.env.NODE_ENV === "production" && !process.env.CLIENT_ORIGIN) {
    console.warn(
        "[cors] CLIENT_ORIGIN is not set in production — falling back to localhost. Cross-origin requests from the deployed client will be blocked.",
    );
}

app.use(helmet());
app.use(httpLogger);
app.use(
    cors({
        origin: clientOrigin,
        credentials: true,
    }),
);
app.use(express.json());
app.use(cookieParser());

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
});

const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many AI requests, please try again later" },
});

app.use(globalLimiter);

// Auth
app.post("/api/auth/register", register);
app.post("/api/auth/login", login);
app.post("/api/auth/logout", logout);
app.get("/api/auth/me", me);

// Pages
app.get("/api/pages", requireAuth, listPages);
app.post("/api/pages", requireAuth, createPage);
app.get("/api/pages/:id", requireAuth, getPage);
app.patch("/api/pages/:id", requireAuth, updatePage);
app.delete("/api/pages/:id", requireAuth, deletePage);

// Folders
app.get("/api/folders", requireAuth, listFolders);
app.post("/api/folders", requireAuth, createFolder);
app.patch("/api/folders/:id", requireAuth, updateFolder);
app.delete("/api/folders/:id", requireAuth, deleteFolder);

// Blocks
app.post("/api/pages/:pageId/blocks", requireAuth, createBlock);
app.patch("/api/blocks/:id", requireAuth, updateBlock);
app.delete("/api/blocks/:id", requireAuth, deleteBlock);

// AI
app.post("/api/ai", requireAuth, aiLimiter, runAiAction);

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
