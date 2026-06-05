import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPage, deletePage, listPages, updatePage } from "../api/pages";
import { foldersKey, pagesKey } from "./queryKeys";

export { pagesKey };

export const usePages = () =>
  useQuery({ queryKey: pagesKey, queryFn: listPages });

export const useCreatePage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { title: string; folderId?: string; parentId?: string } | string) => {
      if (typeof args === "string") return createPage(args);
      return createPage(args.title, { folderId: args.folderId, parentId: args.parentId });
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: pagesKey });
      if (typeof variables !== "string" && variables.parentId) {
        qc.invalidateQueries({ queryKey: ["page", variables.parentId] });
      }
      qc.invalidateQueries({ queryKey: foldersKey });
    },
  });
};

export const useUpdatePage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...patch
    }: { id: string; title?: string; folderId?: string | null; parentId?: string | null }) =>
      updatePage(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pagesKey });
      qc.invalidateQueries({ queryKey: foldersKey });
    },
  });
};

export const useDeletePage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: pagesKey });
      qc.invalidateQueries({ queryKey: foldersKey });
    },
  });
};
