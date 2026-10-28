import { beforeEach, describe, expect, it, vi } from "vitest";
import { streamAi, type AiStreamEvent } from "../../src/api/ai";

/** Builds a Response whose body streams `chunks` exactly as given. */
const sseResponse = (chunks: string[], init: { ok?: boolean; status?: number } = {}) => {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return { ok: init.ok ?? true, status: init.status ?? 200, body } as unknown as Response;
};

const collect = async (chunks: string[]): Promise<AiStreamEvent[]> => {
  const events: AiStreamEvent[] = [];
  vi.mocked(fetch).mockResolvedValue(sseResponse(chunks));
  await streamAi("block_1", "explain", (e) => events.push(e));
  return events;
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

describe("streamAi — request", () => {
  it("posts the block and action with credentials", async () => {
    vi.mocked(fetch).mockResolvedValue(sseResponse([]));

    await streamAi("block_9", "refactor", () => {});

    expect(fetch).toHaveBeenCalledWith(
      "/api/ai",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ blockId: "block_9", action: "refactor" }),
      }),
    );
  });

  it("passes the abort signal through", async () => {
    vi.mocked(fetch).mockResolvedValue(sseResponse([]));
    const controller = new AbortController();

    await streamAi("block_1", "explain", () => {}, controller.signal);

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(init?.signal).toBe(controller.signal);
  });
});

describe("streamAi — parsing", () => {
  it("emits one text event per frame, then done", async () => {
    const events = await collect([
      'data: {"text":"Hello "}\n\n',
      'data: {"text":"world"}\n\n',
      'data: {"done":true}\n\n',
    ]);

    expect(events).toEqual([
      { kind: "text", text: "Hello " },
      { kind: "text", text: "world" },
      { kind: "done" },
    ]);
  });

  it("reassembles a frame split across network chunks", async () => {
    const events = await collect(['data: {"text":"Hel', 'lo"}\n\n', 'data: {"done":true}\n\n']);

    expect(events).toEqual([{ kind: "text", text: "Hello" }, { kind: "done" }]);
  });

  it("handles several frames arriving in one chunk", async () => {
    const events = await collect(['data: {"text":"a"}\n\ndata: {"text":"b"}\n\ndata: {"done":true}\n\n']);

    expect(events).toEqual([
      { kind: "text", text: "a" },
      { kind: "text", text: "b" },
      { kind: "done" },
    ]);
  });

  it("preserves newlines inside the streamed text", async () => {
    const events = await collect([`data: ${JSON.stringify({ text: "line one\nline two" })}\n\n`]);

    expect(events).toEqual([{ kind: "text", text: "line one\nline two" }]);
  });

  it("emits an error event for an error frame", async () => {
    const events = await collect(['data: {"error":"overloaded"}\n\n']);

    expect(events).toEqual([{ kind: "error", message: "overloaded" }]);
  });

  it("ignores malformed JSON instead of throwing", async () => {
    const events = await collect([
      "data: {not json}\n\n",
      'data: {"text":"still here"}\n\n',
      'data: {"done":true}\n\n',
    ]);

    expect(events).toEqual([{ kind: "text", text: "still here" }, { kind: "done" }]);
  });

  it("ignores SSE comments and non-data lines", async () => {
    const events = await collect([": keep-alive\n\n", 'event: ping\ndata: {"done":true}\n\n']);

    expect(events).toEqual([{ kind: "done" }]);
  });

  it("emits nothing for an empty stream", async () => {
    const events = await collect([]);

    expect(events).toEqual([]);
  });

  it("drops a trailing frame that never got its newline terminator", async () => {
    // The parser only flushes complete lines, so a truncated stream is dropped
    // rather than half-parsed.
    const events = await collect(['data: {"text":"done"}\n\ndata: {"text":"trunc']);

    expect(events).toEqual([{ kind: "text", text: "done" }]);
  });
});

describe("streamAi — failures", () => {
  it("reports a non-ok response as a single error event", async () => {
    vi.mocked(fetch).mockResolvedValue(sseResponse([], { ok: false, status: 429 }));
    const events: AiStreamEvent[] = [];

    await streamAi("block_1", "explain", (e) => events.push(e));

    expect(events).toEqual([{ kind: "error", message: "Request failed (429)" }]);
  });

  it("reports a missing body as an error rather than hanging", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 200, body: null } as Response);
    const events: AiStreamEvent[] = [];

    await streamAi("block_1", "explain", (e) => events.push(e));

    expect(events).toEqual([{ kind: "error", message: "Request failed (200)" }]);
  });
});
