import { ChakraProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement, ReactNode } from "react";
import { theme } from "../src/theme";
import type { Block, PageDetail } from "../src/api/types";

/** Retries and background refetches only make tests slow and flaky. */
export const makeQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      // `gcTime: Infinity` keeps data seeded via `setQueryData` alive even
      // when no component is observing that key.
      queries: { retry: false, gcTime: Infinity, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });

type Options = RenderOptions & {
  queryClient?: QueryClient;
  route?: string;
};

export const renderWithProviders = (
  ui: ReactElement,
  { queryClient = makeQueryClient(), route = "/", ...options }: Options = {},
): RenderResult & { queryClient: QueryClient } => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <ChakraProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </QueryClientProvider>
    </ChakraProvider>
  );

  return { ...render(ui, { wrapper: Wrapper, ...options }), queryClient };
};

export const makeBlock = (overrides: Partial<Block> = {}): Block => ({
  id: "block_1",
  pageId: "page_1",
  type: "text",
  content: "",
  language: null,
  style: null,
  orderIndex: 0,
  checked: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

export const makePageDetail = (overrides: Partial<PageDetail> = {}): PageDetail => ({
  id: "page_1",
  title: "Test page",
  folderId: null,
  parentId: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  blocks: [],
  children: [],
  ...overrides,
});
