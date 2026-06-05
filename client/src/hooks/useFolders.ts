import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFolder, deleteFolder, listFolders, updateFolder } from "../api/folders";
import { foldersKey, pagesKey } from "./queryKeys";

export { foldersKey };

export const useFolders = () =>
  useQuery({ queryKey: foldersKey, queryFn: listFolders });

export const useCreateFolder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createFolder(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: foldersKey }),
  });
};

export const useUpdateFolder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateFolder(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: foldersKey }),
  });
};

export const useDeleteFolder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFolder(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: foldersKey });
      qc.invalidateQueries({ queryKey: pagesKey });
    },
  });
};
