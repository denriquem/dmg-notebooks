import api from "./client";
import type { Folder } from "./types";

export const listFolders = async (): Promise<Folder[]> => {
  const { data } = await api.get<{ folders: Folder[] }>("/folders");
  return data.folders;
};

export const createFolder = async (name: string): Promise<Folder> => {
  const { data } = await api.post<{ folder: Folder }>("/folders", { name });
  return data.folder;
};

export const updateFolder = async (id: string, name: string): Promise<Folder> => {
  const { data } = await api.patch<{ folder: Folder }>(`/folders/${id}`, { name });
  return data.folder;
};

export const deleteFolder = async (id: string): Promise<void> => {
  await api.delete(`/folders/${id}`);
};
