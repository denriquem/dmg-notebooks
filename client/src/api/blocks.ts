import api from "./client";
import type { Block, BlockType, TextStyle } from "./types";

export type CreateBlockInput = {
  type: BlockType;
  content?: string;
  language?: string;
  style?: TextStyle;
  orderIndex: number;
};

export type UpdateBlockInput = Partial<{
  content: string;
  language: string;
  style: TextStyle;
  orderIndex: number;
  checked: boolean;
}>;

export const createBlock = async (pageId: string, input: CreateBlockInput): Promise<Block> => {
  const { data } = await api.post<{ block: Block }>(`/pages/${pageId}/blocks`, input);
  return data.block;
};

export const updateBlock = async (id: string, input: UpdateBlockInput): Promise<Block> => {
  const { data } = await api.patch<{ block: Block }>(`/blocks/${id}`, input);
  return data.block;
};

export const deleteBlock = async (id: string): Promise<void> => {
  await api.delete(`/blocks/${id}`);
};
