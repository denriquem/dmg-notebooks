import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";

const CreatePageSchema = z.object({
  title: z.string().min(1),
  folderId: z.string().optional(),
  parentId: z.string().optional(),
});

const UpdatePageSchema = z.object({
  title: z.string().min(1).optional(),
  folderId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
});

export const listPages = async (req: Request, res: Response): Promise<void> => {
  const pages = await prisma.page.findMany({
    where: { userId: req.userId, parentId: null },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      folderId: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { children: true } },
    },
  });
  res.json({ pages });
};

export const createPage = async (req: Request, res: Response): Promise<void> => {
  const parsed = CreatePageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  if (parsed.data.folderId) {
    const folder = await prisma.folder.findFirst({
      where: { id: parsed.data.folderId, userId: req.userId },
    });
    if (!folder) {
      res.status(400).json({ error: "Folder not found" });
      return;
    }
  }

  if (parsed.data.parentId) {
    const parent = await prisma.page.findFirst({
      where: { id: parsed.data.parentId, userId: req.userId },
    });
    if (!parent) {
      res.status(400).json({ error: "Parent page not found" });
      return;
    }
  }

  const page = await prisma.page.create({
    data: {
      title: parsed.data.title,
      userId: req.userId,
      folderId: parsed.data.folderId ?? null,
      parentId: parsed.data.parentId ?? null,
    },
    select: {
      id: true,
      title: true,
      folderId: true,
      parentId: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { children: true } },
    },
  });
  res.status(201).json({ page });
};

export const getPage = async (req: Request, res: Response): Promise<void> => {
  const page = await prisma.page.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: {
      blocks: { orderBy: { orderIndex: "asc" } },
      children: {
        select: { id: true, title: true, updatedAt: true, _count: { select: { children: true } } },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
  if (!page) {
    res.status(404).json({ error: "Page not found" });
    return;
  }
  res.json({ page });
};

export const updatePage = async (req: Request, res: Response): Promise<void> => {
  const parsed = UpdatePageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const existing = await prisma.page.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) {
    res.status(404).json({ error: "Page not found" });
    return;
  }
  const page = await prisma.page.update({
    where: { id: req.params.id },
    data: {
      ...(parsed.data.title !== undefined && { title: parsed.data.title }),
      ...(parsed.data.folderId !== undefined && { folderId: parsed.data.folderId }),
      ...(parsed.data.parentId !== undefined && { parentId: parsed.data.parentId }),
    },
    select: {
      id: true,
      title: true,
      folderId: true,
      parentId: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { children: true } },
    },
  });
  res.json({ page });
};

export const deletePage = async (req: Request, res: Response): Promise<void> => {
  const existing = await prisma.page.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) {
    res.status(404).json({ error: "Page not found" });
    return;
  }
  await prisma.page.delete({ where: { id: req.params.id } });
  res.status(204).send();
};
