import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";

const FolderNameSchema = z.object({ name: z.string().min(1).max(100) });

export const listFolders = async (req: Request, res: Response): Promise<void> => {
  const folders = await prisma.folder.findMany({
    where: { userId: req.userId },
    orderBy: { updatedAt: "desc" },
    include: {
      pages: {
        where: { parentId: null },
        select: { id: true, title: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
  res.json({ folders });
};

export const createFolder = async (req: Request, res: Response): Promise<void> => {
  const parsed = FolderNameSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const folder = await prisma.folder.create({
    data: { name: parsed.data.name, userId: req.userId },
    include: { pages: true },
  });
  res.status(201).json({ folder });
};

export const updateFolder = async (req: Request, res: Response): Promise<void> => {
  const parsed = FolderNameSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.folder.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) {
    res.status(404).json({ error: "Folder not found" });
    return;
  }
  const folder = await prisma.folder.update({
    where: { id: req.params.id },
    data: { name: parsed.data.name },
    include: { pages: { select: { id: true, title: true, updatedAt: true } } },
  });
  res.json({ folder });
};

export const deleteFolder = async (req: Request, res: Response): Promise<void> => {
  const existing = await prisma.folder.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) {
    res.status(404).json({ error: "Folder not found" });
    return;
  }
  await prisma.folder.delete({ where: { id: req.params.id } });
  res.status(204).send();
};
