export type BlockType = "text" | "todo" | "code";

export type User = { id: string; email: string; name: string };

export type Block = {
  id: string;
  pageId: string;
  type: BlockType;
  content: string;
  language: string | null;
  orderIndex: number;
  checked: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PageSummary = {
  id: string;
  title: string;
  folderId: string | null;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { children: number };
};

export type SubpageSummary = {
  id: string;
  title: string;
  updatedAt: string;
  _count: { children: number };
};

export type PageDetail = PageSummary & {
  blocks: Block[];
  children: SubpageSummary[];
};

export type FolderPageSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export type Folder = {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  pages: FolderPageSummary[];
};
