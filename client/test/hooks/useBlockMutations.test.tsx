import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import * as blocksApi from "../../src/api/blocks";
import type { PageDetail } from "../../src/api/types";
import { makeBlock, makePageDetail, makeQueryClient } from "../utils";
import { useCreateBlock, useDeleteBlock, useUpdateBlock } from "../../src/hooks/useBlockMutations";
import { pageKey } from "../../src/hooks/usePage";

vi.mock("../../src/api/blocks");

const PAGE_ID = "page_1";

const setup = (blocks = [makeBlock({ id: "block_1", content: "original" })]) => {
  const queryClient = makeQueryClient();
  queryClient.setQueryData<PageDetail>(pageKey(PAGE_ID), makePageDetail({ blocks }));

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const cached = () => queryClient.getQueryData<PageDetail>(pageKey(PAGE_ID))!;
  return { queryClient, wrapper, cached };
};

beforeEach(() => {
  vi.mocked(blocksApi.createBlock).mockReset();
  vi.mocked(blocksApi.updateBlock).mockReset();
  vi.mocked(blocksApi.deleteBlock).mockReset();
});

describe("useCreateBlock", () => {
  it("appends the server's block to the cached page", async () => {
    const { wrapper, cached } = setup();
    const created = makeBlock({ id: "block_2", type: "todo", orderIndex: 1 });
    vi.mocked(blocksApi.createBlock).mockResolvedValue(created);

    const { result } = renderHook(() => useCreateBlock(PAGE_ID), { wrapper });
    result.current.mutate({ type: "todo", orderIndex: 1 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(blocksApi.createBlock).toHaveBeenCalledWith(PAGE_ID, { type: "todo", orderIndex: 1 });
    expect(cached().blocks.map((b) => b.id)).toEqual(["block_1", "block_2"]);
  });

  it("leaves the cache untouched when the request fails", async () => {
    const { wrapper, cached } = setup();
    vi.mocked(blocksApi.createBlock).mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useCreateBlock(PAGE_ID), { wrapper });
    result.current.mutate({ type: "text", orderIndex: 1 });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(cached().blocks).toHaveLength(1);
  });
});

describe("useUpdateBlock", () => {
  it("applies the patch optimistically, before the request resolves", async () => {
    const { wrapper, cached } = setup();
    let resolve!: (b: ReturnType<typeof makeBlock>) => void;
    vi.mocked(blocksApi.updateBlock).mockReturnValue(new Promise((r) => (resolve = r)));

    const { result } = renderHook(() => useUpdateBlock(PAGE_ID), { wrapper });
    result.current.mutate({ id: "block_1", input: { content: "typed" } });

    await waitFor(() => expect(cached().blocks[0].content).toBe("typed"));
    expect(blocksApi.updateBlock).toHaveBeenCalledWith("block_1", { content: "typed" });

    resolve(makeBlock({ id: "block_1", content: "typed" }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls the cache back when the request fails", async () => {
    const { wrapper, cached } = setup();
    vi.mocked(blocksApi.updateBlock).mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useUpdateBlock(PAGE_ID), { wrapper });
    result.current.mutate({ id: "block_1", input: { content: "typed" } });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(cached().blocks[0].content).toBe("original");
  });

  it("only touches the block being updated", async () => {
    const { wrapper, cached } = setup([
      makeBlock({ id: "block_1", content: "one" }),
      makeBlock({ id: "block_2", content: "two" }),
    ]);
    vi.mocked(blocksApi.updateBlock).mockResolvedValue(makeBlock({ id: "block_2" }));

    const { result } = renderHook(() => useUpdateBlock(PAGE_ID), { wrapper });
    result.current.mutate({ id: "block_2", input: { checked: true } });

    await waitFor(() => expect(cached().blocks[1].checked).toBe(true));
    expect(cached().blocks[0]).toMatchObject({ content: "one", checked: false });
  });
});

describe("useDeleteBlock", () => {
  it("removes the block optimistically", async () => {
    const { wrapper, cached } = setup([
      makeBlock({ id: "block_1" }),
      makeBlock({ id: "block_2" }),
    ]);
    vi.mocked(blocksApi.deleteBlock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteBlock(PAGE_ID), { wrapper });
    result.current.mutate("block_1");

    await waitFor(() => expect(cached().blocks.map((b) => b.id)).toEqual(["block_2"]));
    expect(blocksApi.deleteBlock).toHaveBeenCalledWith("block_1");
  });

  it("restores the block when the delete fails", async () => {
    const { wrapper, cached } = setup([
      makeBlock({ id: "block_1" }),
      makeBlock({ id: "block_2" }),
    ]);
    vi.mocked(blocksApi.deleteBlock).mockRejectedValue(new Error("nope"));

    const { result } = renderHook(() => useDeleteBlock(PAGE_ID), { wrapper });
    result.current.mutate("block_1");

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(cached().blocks.map((b) => b.id)).toEqual(["block_1", "block_2"]);
  });
});
