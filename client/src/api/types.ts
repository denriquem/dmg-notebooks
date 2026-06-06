export type BlockType = "text" | "todo" | "code";

export type User = { id: string; email: string; name: string };

export type TextFont = "sans" | "display" | "mono";
export type TextColor = "ink" | "terracotta" | "ochre" | "teal" | "oxblood";
export type TextSize = "sm" | "md" | "lg";

export type TextStyle = {
  font?: TextFont;
  color?: TextColor;
  size?: TextSize;
};

export type Block = {
  id: string;
  pageId: string;
  type: BlockType;
  content: string;
  language: string | null;
  style: TextStyle | null;
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
