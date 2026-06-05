import api from "./client";
import type { PageDetail, PageSummary } from "./types";

export const listPages = async (): Promise<PageSummary[]> => {
  const { data } = await api.get<{ pages: PageSummary[] }>("/pages");
  return data.pages;
};

export const createPage = async (
  title: string,
  opts?: { folderId?: string; parentId?: string },
): Promise<PageSummary> => {
  const { data } = await api.post<{ page: PageSummary }>("/pages", { title, ...opts });
  return data.page;
};

export const getPage = async (id: string): Promise<PageDetail> => {
  const { data } = await api.get<{ page: PageDetail }>(`/pages/${id}`);
  return data.page;
};

export const updatePage = async (
  id: string,
  patch: { title?: string; folderId?: string | null; parentId?: string | null },
): Promise<PageSummary> => {
  const { data } = await api.patch<{ page: PageSummary }>(`/pages/${id}`, patch);
  return data.page;
};

export const deletePage = async (id: string): Promise<void> => {
  await api.delete(`/pages/${id}`);
};
