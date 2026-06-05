import { Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import prisma from "../lib/prisma";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const AiActionSchema = z.object({
  blockId: z.string().min(1),
  action: z.enum(["explain", "refactor", "test"]),
});

const testFramework = (language: string): string => {
  if (language === "tsx" || language === "jsx") return "React Testing Library with Vitest";
  if (language === "typescript" || language === "javascript") return "Vitest";
  if (language === "python") return "pytest";
  return "an appropriate testing framework for the language";
};

const PROMPTS: Record<string, (content: string, language: string) => string> = {
  explain: (content, language) =>
    `Explain the following ${language} code concisely, covering what it does and any notable patterns:\n\n\`\`\`${language}\n${content}\n\`\`\``,
  refactor: (content, language) =>
    `Refactor the following ${language} code for clarity and best practices. Return only the refactored code with a brief explanation of changes:\n\n\`\`\`${language}\n${content}\n\`\`\``,
  test: (content, language) =>
    `Write tests for the following ${language} code using ${testFramework(language)}. Cover the main behaviours and obvious edge cases. Return ONLY a single fenced code block containing the test file — no prose before or after. Include any necessary imports.\n\n\`\`\`${language}\n${content}\n\`\`\``,
};

export const runAiAction = async (req: Request, res: Response): Promise<void> => {
  const parsed = AiActionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { blockId, action } = parsed.data;

  const block = await prisma.block.findFirst({
    where: { id: blockId, page: { userId: req.userId } },
  });

  if (!block) {
    res.status(404).json({ error: "Block not found" });
    return;
  }

  if (block.type !== "code") {
    res.status(400).json({ error: "AI actions only apply to code blocks" });
    return;
  }

  const language = block.language ?? "plaintext";
  const prompt = PROMPTS[action](block.content, language);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResult = "";

  const stream = client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  stream.on("text", (text) => {
    fullResult += text;
    res.write(`data: ${JSON.stringify({ text })}\n\n`);
  });

  stream.on("error", (err) => {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  });

  stream.on("finalMessage", async () => {
    await prisma.aiInteraction.create({
      data: { blockId: block.id, action, result: fullResult },
    });
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  });
};
