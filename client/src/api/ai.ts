export type AiAction = "explain" | "refactor" | "test";

export type AiStreamEvent =
  | { kind: "text"; text: string }
  | { kind: "done" }
  | { kind: "error"; message: string };

export const streamAi = async (
  blockId: string,
  action: AiAction,
  onEvent: (e: AiStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> => {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ blockId, action }),
    signal,
  });

  if (!res.ok || !res.body) {
    onEvent({ kind: "error", message: `Request failed (${res.status})` });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (!payload) continue;
      try {
        const parsed = JSON.parse(payload) as {
          text?: string;
          done?: boolean;
          error?: string;
        };
        if (parsed.error) onEvent({ kind: "error", message: parsed.error });
        else if (parsed.done) onEvent({ kind: "done" });
        else if (parsed.text) onEvent({ kind: "text", text: parsed.text });
      } catch {
        // ignore malformed line
      }
    }
  }
};
