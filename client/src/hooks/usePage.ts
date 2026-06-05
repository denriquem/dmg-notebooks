import { useQuery } from "@tanstack/react-query";
import { getPage } from "../api/pages";

export const pageKey = (id: string) => ["page", id] as const;

export const usePage = (id: string) =>
  useQuery({ queryKey: pageKey(id), queryFn: () => getPage(id), enabled: !!id });
