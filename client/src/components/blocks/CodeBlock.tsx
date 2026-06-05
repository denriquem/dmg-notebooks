import { Box, Flex } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-python";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import type { Block } from "../../api/types";
import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";
import { useDeleteBlock, useUpdateBlock } from "../../hooks/useBlockMutations";
import BlockChrome from "./BlockChrome";
import { streamAi, type AiAction } from "../../api/ai";

const LANGUAGES = [
  "typescript",
  "javascript",
  "tsx",
  "jsx",
  "python",
  "json",
  "bash",
  "plaintext",
] as const;

const PRISM_LANG: Record<string, string> = {
  typescript: "typescript",
  javascript: "javascript",
  tsx: "tsx",
  jsx: "jsx",
  python: "python",
  json: "json",
  bash: "bash",
  plaintext: "markup",
};

const ACTIONS: { key: AiAction; label: string; token: string; mark?: string }[] = [
  { key: "explain", label: "Explain", token: "horizon", mark: "✦ " },
  { key: "refactor", label: "Refactor", token: "teal" },
  { key: "test", label: "Test", token: "ochre" },
];

const AI_TITLE: Record<AiAction, string> = {
  explain: "Explanation",
  refactor: "Refactor",
  test: "Tests",
};

const highlight = (code: string, lang: string): string => {
  const grammar = Prism.languages[PRISM_LANG[lang] ?? "markup"];
  if (!grammar) return code;
  try {
    return Prism.highlight(code, grammar, PRISM_LANG[lang] ?? "markup");
  } catch {
    return code;
  }
};

type Props = { pageId: string; block: Block };

const CodeBlock = ({ pageId, block }: Props): JSX.Element => {
  const [value, setValue] = useState(block.content);
  const [aiOutput, setAiOutput] = useState("");
  const [aiAction, setAiAction] = useState<AiAction | null>(null);
  const [aiState, setAiState] = useState<"idle" | "streaming" | "done" | "error">("idle");
  const abortRef = useRef<AbortController | null>(null);

  const updateM = useUpdateBlock(pageId);
  const deleteM = useDeleteBlock(pageId);
  const language = block.language ?? "plaintext";

  useEffect(() => {
    setValue(block.content);
  }, [block.id]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const saveContent = useDebouncedCallback((next: string) => {
    if (next === block.content) return;
    updateM.mutate({ id: block.id, input: { content: next } });
  }, 500);

  const runAi = async (action: AiAction) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setAiAction(action);
    setAiOutput("");
    setAiState("streaming");

    await streamAi(
      block.id,
      action,
      (e) => {
        if (e.kind === "text") setAiOutput((prev) => prev + e.text);
        else if (e.kind === "done") setAiState("done");
        else if (e.kind === "error") {
          setAiOutput((prev) => prev + `\n\n[Error: ${e.message}]`);
          setAiState("error");
        }
      },
      ctrl.signal,
    );
  };

  return (
    <BlockChrome type="code" onDelete={() => deleteM.mutate(block.id)}>
      <Box className="dmg-code" p="12px 14px">
        <Flex align="center" gap="10px" mb="12px" flexWrap="wrap">
          <Box
            as="select"
            value={language}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              updateM.mutate({ id: block.id, input: { language: e.target.value } })
            }
            fontFamily="'Space Mono', monospace"
            fontWeight={700}
            fontSize="11px"
            letterSpacing="0.06em"
            textTransform="uppercase"
            bg="transparent"
            color="var(--bone)"
            border="2px solid color-mix(in oklab, var(--bone) 32%, transparent)"
            px="8px"
            py="5px"
            cursor="pointer"
            sx={{ "& option": { color: "#000" } }}
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Box>
          <Flex ml="auto" gap="7px">
            {ACTIONS.map((a) => {
              const active = aiState === "streaming" && aiAction === a.key;
              return (
                <Box
                  key={a.key}
                  as="button"
                  onClick={() => runAi(a.key)}
                  fontFamily="'Syne', sans-serif"
                  fontWeight={800}
                  fontSize="11px"
                  letterSpacing="0.02em"
                  textTransform="uppercase"
                  px="11px"
                  py="7px"
                  cursor="pointer"
                  transition="all .12s"
                  border={`2px solid var(--${a.token})`}
                  bg={active ? `var(--${a.token})` : "transparent"}
                  color={active ? "var(--ink)" : `var(--${a.token})`}
                  _hover={{ bg: `var(--${a.token})`, color: "var(--ink)" }}
                >
                  {a.mark}
                  {a.label}
                </Box>
              );
            })}
          </Flex>
        </Flex>

        <Box
          sx={{
            "& textarea, & pre": {
              fontFamily: "'Space Mono', monospace !important",
              fontSize: "13px !important",
              lineHeight: "1.65 !important",
              outline: "none",
            },
            "& textarea": { caretColor: "var(--bone)" },
          }}
        >
          <Editor
            value={value}
            onValueChange={(next) => {
              setValue(next);
              saveContent(next);
            }}
            highlight={(code) => highlight(code, language)}
            padding={0}
            placeholder="// code"
            style={{ minHeight: 48, background: "transparent", color: "var(--bone)" }}
          />
        </Box>

        {aiAction && (
          <Box
            mt="14px"
            border="2px solid color-mix(in oklab, var(--bone) 22%, transparent)"
            bg="color-mix(in oklab, var(--paper) 8%, transparent)"
            p="12px 14px"
          >
            <Flex align="center" mb="8px">
              <Box
                as="span"
                fontFamily="'Space Mono', monospace"
                fontWeight={700}
                fontSize="10px"
                letterSpacing="0.14em"
                textTransform="uppercase"
                color="var(--horizon)"
              >
                {AI_TITLE[aiAction]}
                {aiState === "streaming" && " · streaming…"}
              </Box>
              <Box
                as="button"
                ml="auto"
                fontFamily="'Space Mono', monospace"
                fontWeight={700}
                fontSize="10px"
                letterSpacing="0.1em"
                color="color-mix(in oklab, var(--bone) 70%, black)"
                cursor="pointer"
                onClick={() => {
                  abortRef.current?.abort();
                  setAiAction(null);
                  setAiOutput("");
                  setAiState("idle");
                }}
              >
                CLOSE
              </Box>
            </Flex>
            <Box
              as="pre"
              m={0}
              fontFamily="'Space Mono', monospace"
              fontSize="12.5px"
              lineHeight={1.6}
              whiteSpace="pre-wrap"
              wordBreak="break-word"
              color="var(--bone)"
            >
              {aiOutput}
              {aiState === "streaming" && (
                <Box as="span" bg="var(--horizon)" color="var(--horizon)">
                  _
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Box>
    </BlockChrome>
  );
};

export default CodeBlock;
