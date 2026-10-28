import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { streamMock } = vi.hoisted(() => ({ streamMock: vi.fn() }));

vi.mock("@anthropic-ai/sdk", () => ({
    default: class FakeAnthropic {
        messages = { stream: streamMock };
    },
}));

import { prismaMock } from "../prisma-mock";
import { TEST_USER_ID, authCookie, fakeBlock, testApp } from "../helpers";

const app = testApp();
const cookie = authCookie();

type Emit = {
    text: (chunk: string) => void;
    error: (err: Error) => void;
    finalMessage: () => void;
};

/**
 * Stands in for the SDK's streaming helper: collects the handler registrations
 * the route makes synchronously, then runs `script` on the next tick.
 */
const scriptedStream = (script: (emit: Emit) => void) => {
    const handlers = new Map<string, (arg?: unknown) => void>();
    const stream = {
        on(event: string, cb: (arg?: unknown) => void) {
            handlers.set(event, cb);
            return stream;
        },
    };
    const fire = (event: string, arg?: unknown) => handlers.get(event)?.(arg);
    setImmediate(() =>
        script({
            text: (chunk) => fire("text", chunk),
            error: (err) => fire("error", err),
            finalMessage: () => fire("finalMessage"),
        }),
    );
    return stream;
};

const codeBlock = (language: string | null = "typescript") =>
    fakeBlock({ type: "code", content: "const a = 1;", language });

/** Parses an SSE body into the sequence of JSON payloads it carried. */
const sseFrames = (body: string): unknown[] =>
    body
        .split("\n")
        .filter((line) => line.startsWith("data: "))
        .map((line) => JSON.parse(line.slice(6)));

beforeEach(() => {
    streamMock.mockReset();
    prismaMock.aiInteraction.create.mockResolvedValue({} as never);
});

describe("POST /api/ai — request validation", () => {
    it("401s without a cookie", async () => {
        const res = await request(app).post("/api/ai").send({ blockId: "b1", action: "explain" });

        expect(res.status).toBe(401);
        expect(streamMock).not.toHaveBeenCalled();
    });

    it.each([
        ["an unknown action", { blockId: "block_1", action: "translate" }],
        ["a missing blockId", { action: "explain" }],
        ["an empty blockId", { blockId: "", action: "explain" }],
    ])("400s on %s", async (_label, body) => {
        const res = await request(app).post("/api/ai").set("Cookie", cookie).send(body);

        expect(res.status).toBe(400);
        expect(streamMock).not.toHaveBeenCalled();
    });

    it("404s for a block on someone else's page", async () => {
        prismaMock.block.findFirst.mockResolvedValue(null);

        const res = await request(app)
            .post("/api/ai")
            .set("Cookie", cookie)
            .send({ blockId: "block_1", action: "explain" });

        expect(res.status).toBe(404);
        expect(prismaMock.block.findFirst).toHaveBeenCalledWith({
            where: { id: "block_1", page: { userId: TEST_USER_ID } },
        });
        expect(streamMock).not.toHaveBeenCalled();
    });

    it("400s when the block isn't a code block", async () => {
        prismaMock.block.findFirst.mockResolvedValue(fakeBlock({ type: "text" }) as never);

        const res = await request(app)
            .post("/api/ai")
            .set("Cookie", cookie)
            .send({ blockId: "block_1", action: "explain" });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: "AI actions only apply to code blocks" });
        expect(streamMock).not.toHaveBeenCalled();
    });
});

describe("POST /api/ai — streaming", () => {
    it("streams text frames then a done frame as SSE", async () => {
        prismaMock.block.findFirst.mockResolvedValue(codeBlock() as never);
        streamMock.mockImplementation(() =>
            scriptedStream((emit) => {
                emit.text("Hello ");
                emit.text("world");
                emit.finalMessage();
            }),
        );

        const res = await request(app)
            .post("/api/ai")
            .set("Cookie", cookie)
            .send({ blockId: "block_1", action: "explain" });

        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toContain("text/event-stream");
        expect(res.headers["cache-control"]).toBe("no-cache");
        expect(sseFrames(res.text)).toEqual([
            { text: "Hello " },
            { text: "world" },
            { done: true },
        ]);
    });

    it("persists the concatenated result as an AiInteraction", async () => {
        prismaMock.block.findFirst.mockResolvedValue(codeBlock() as never);
        streamMock.mockImplementation(() =>
            scriptedStream((emit) => {
                emit.text("Hello ");
                emit.text("world");
                emit.finalMessage();
            }),
        );

        await request(app)
            .post("/api/ai")
            .set("Cookie", cookie)
            .send({ blockId: "block_1", action: "refactor" });

        expect(prismaMock.aiInteraction.create).toHaveBeenCalledWith({
            data: { blockId: "block_1", action: "refactor", result: "Hello world" },
        });
    });

    it("forwards an upstream error as an error frame and closes the stream", async () => {
        prismaMock.block.findFirst.mockResolvedValue(codeBlock() as never);
        streamMock.mockImplementation(() =>
            scriptedStream((emit) => {
                emit.text("partial");
                emit.error(new Error("overloaded"));
            }),
        );

        const res = await request(app)
            .post("/api/ai")
            .set("Cookie", cookie)
            .send({ blockId: "block_1", action: "explain" });

        expect(sseFrames(res.text)).toEqual([{ text: "partial" }, { error: "overloaded" }]);
        expect(prismaMock.aiInteraction.create).not.toHaveBeenCalled();
    });

    it("escapes newlines so multi-line output stays on one SSE frame", async () => {
        prismaMock.block.findFirst.mockResolvedValue(codeBlock() as never);
        streamMock.mockImplementation(() =>
            scriptedStream((emit) => {
                emit.text("line one\nline two");
                emit.finalMessage();
            }),
        );

        const res = await request(app)
            .post("/api/ai")
            .set("Cookie", cookie)
            .send({ blockId: "block_1", action: "explain" });

        expect(sseFrames(res.text)).toEqual([{ text: "line one\nline two" }, { done: true }]);
    });
});

describe("POST /api/ai — prompt construction", () => {
    const promptFor = async (action: string, language: string | null) => {
        prismaMock.block.findFirst.mockResolvedValue(codeBlock(language) as never);
        streamMock.mockImplementation(() => scriptedStream((emit) => emit.finalMessage()));

        await request(app).post("/api/ai").set("Cookie", cookie).send({ blockId: "block_1", action });

        const [args] = streamMock.mock.calls[0] as [
            { model: string; max_tokens: number; messages: { role: string; content: string }[] },
        ];
        return args;
    };

    it("targets the expected model", async () => {
        const args = await promptFor("explain", "typescript");

        expect(args.model).toBe("claude-sonnet-4-6");
        expect(args.max_tokens).toBe(2048);
        expect(args.messages[0].role).toBe("user");
    });

    it("includes the block's code and language", async () => {
        const args = await promptFor("explain", "python");

        expect(args.messages[0].content).toContain("const a = 1;");
        expect(args.messages[0].content).toContain("```python");
    });

    it("falls back to plaintext when the block has no language", async () => {
        const args = await promptFor("explain", null);

        expect(args.messages[0].content).toContain("```plaintext");
    });

    it.each([
        ["tsx", "React Testing Library with Vitest"],
        ["typescript", "Vitest"],
        ["python", "pytest"],
        ["bash", "an appropriate testing framework for the language"],
    ])("asks for %s tests using %s", async (language, framework) => {
        const args = await promptFor("test", language);

        expect(args.messages[0].content).toContain(framework);
    });
});
