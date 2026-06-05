import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";

const BlockTypeEnum = z.enum(["text", "todo", "code"]);

const CreateBlockSchema = z.object({
  type: BlockTypeEnum,
  content: z.string().default(""),
  language: z.string().optional(),
  orderIndex: z.number().int(),
  checked: z.boolean().optional(),
});

const UpdateBlockSchema = z.object({
  type: BlockTypeEnum.optional(),
  content: z.string().optional(),
  language: z.string().optional(),
  orderIndex: z.number().int().optional(),
  checked: z.boolean().optional(),
});

const pageOwnedByUser = async (pageId: string, userId: string): Promise<boolean> => {
  const page = await prisma.page.findFirst({ where: { id: pageId, userId } });
  return !!page;
};

const blockOwnedByUser = async (blockId: string, userId: string): Promise<boolean> => {
  const block = await prisma.block.findFirst({
    where: { id: blockId, page: { userId } },
  });
  return !!block;
};

export const createBlock = async (req: Request, res: Response): Promise<void> => {
  const pageId = req.params.pageId;

  if (!(await pageOwnedByUser(pageId, req.userId))) {
    res.status(404).json({ error: "Page not found" });
    return;
  }

  const parsed = CreateBlockSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const block = await prisma.block.create({
    data: { ...parsed.data, pageId },
  });
  res.status(201).json({ block });
};

export const updateBlock = async (req: Request, res: Response): Promise<void> => {
  if (!(await blockOwnedByUser(req.params.id, req.userId))) {
    res.status(404).json({ error: "Block not found" });
    return;
  }

  const parsed = UpdateBlockSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const block = await prisma.block.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json({ block });
};

export const deleteBlock = async (req: Request, res: Response): Promise<void> => {
  if (!(await blockOwnedByUser(req.params.id, req.userId))) {
    res.status(404).json({ error: "Block not found" });
    return;
  }

  await prisma.block.delete({ where: { id: req.params.id } });
  res.status(204).send();
};
