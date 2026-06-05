import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBlock, deleteBlock, updateBlock } from "../api/blocks";
import type { CreateBlockInput, UpdateBlockInput } from "../api/blocks";
import type { Block, PageDetail } from "../api/types";
import { pageKey } from "./usePage";

export const useCreateBlock = (pageId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBlockInput) => createBlock(pageId, input),
    onSuccess: (block) => {
      qc.setQueryData<PageDetail>(pageKey(pageId), (prev) =>
        prev ? { ...prev, blocks: [...prev.blocks, block] } : prev,
      );
    },
  });
};

export const useUpdateBlock = (pageId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBlockInput }) => updateBlock(id, input),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: pageKey(pageId) });
      const prev = qc.getQueryData<PageDetail>(pageKey(pageId));
      if (prev) {
        qc.setQueryData<PageDetail>(pageKey(pageId), {
          ...prev,
          blocks: prev.blocks.map((b) => (b.id === id ? ({ ...b, ...input } as Block) : b)),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(pageKey(pageId), ctx.prev);
    },
  });
};

export const useDeleteBlock = (pageId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBlock(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: pageKey(pageId) });
      const prev = qc.getQueryData<PageDetail>(pageKey(pageId));
      if (prev) {
        qc.setQueryData<PageDetail>(pageKey(pageId), {
          ...prev,
          blocks: prev.blocks.filter((b) => b.id !== id),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(pageKey(pageId), ctx.prev);
    },
  });
};
