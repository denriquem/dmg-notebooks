import { Box, Flex, Textarea } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import type { Block } from "../../api/types";
import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";
import { useDeleteBlock, useUpdateBlock } from "../../hooks/useBlockMutations";
import BlockChrome from "./BlockChrome";

const MD_COLORS: { label: string; token: string | null }[] = [
  { label: "Default", token: null },
  { label: "Terracotta", token: "terracotta" },
  { label: "Ochre", token: "ochre" },
  { label: "Teal", token: "teal" },
  { label: "Oxblood", token: "oxblood" },
];

type Props = { pageId: string; block: Block };

const TextBlock = ({ pageId, block }: Props): JSX.Element => {
  const [value, setValue] = useState(block.content);
  const [isEditing, setIsEditing] = useState(block.content === "");
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const updateM = useUpdateBlock(pageId);
  const deleteM = useDeleteBlock(pageId);

  useEffect(() => {
    setValue(block.content);
  }, [block.id]);

  useEffect(() => {
    if (isEditing) textareaRef.current?.focus();
  }, [isEditing]);

  const save = useDebouncedCallback((next: string) => {
    if (next === block.content) return;
    updateM.mutate({ id: block.id, input: { content: next } });
  }, 500);

  const handleChange = (next: string) => {
    setValue(next);
    save(next);
  };

  const applyColor = (token: string | null) => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const selected = value.slice(start, end) || "text";
    const wrapped = token ? `<span style="color:var(--${token})">${selected}</span>` : selected;
    const next = value.slice(0, start) + wrapped + value.slice(end);
    handleChange(next);
    setTimeout(() => {
      el.focus();
      const cursor = start + wrapped.length;
      el.setSelectionRange(cursor, cursor);
    }, 0);
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node | null)) {
      setIsEditing(false);
    }
  };

  return (
    <BlockChrome type="text" onDelete={() => deleteM.mutate(block.id)}>
      <Box width="100%" ref={containerRef} onBlur={handleBlur}>
        {isEditing ? (
          <>
            <Flex align="center" gap="6px" mb="10px" flexWrap="wrap">
              {MD_COLORS.map((c) => (
                <Box
                  key={c.label}
                  as="button"
                  title={c.label}
                  width="18px"
                  height="18px"
                  borderRadius="50%"
                  border="2px solid var(--ink)"
                  cursor="pointer"
                  bg={c.token ? `var(--${c.token})` : "color-mix(in oklab, var(--ink) 30%, transparent)"}
                  onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
                  onClick={() => applyColor(c.token)}
                />
              ))}
              <Box
                as="button"
                ml="auto"
                fontFamily="'Space Mono', monospace"
                fontWeight={700}
                fontSize="10px"
                lineHeight={1}
                letterSpacing="0.1em"
                px="10px"
                py="5px"
                bg="var(--ink)"
                color="var(--paper)"
                cursor="pointer"
                onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
                onClick={() => setIsEditing(false)}
              >
                DONE
              </Box>
            </Flex>
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Write something… (markdown supported)"
              variant="unstyled"
              rows={Math.max(2, value.split("\n").length)}
              resize="none"
              fontFamily="'Space Mono', monospace"
              fontSize="14px"
              lineHeight={1.6}
              color="var(--ink)"
              _placeholder={{ color: "color-mix(in oklab, var(--ink) 40%, transparent)" }}
            />
          </>
        ) : (
          <Box
            className="md-preview"
            minH="24px"
            cursor="text"
            onClick={() => setIsEditing(true)}
            sx={value ? undefined : { opacity: 0.45, fontStyle: "italic" }}
          >
            {value ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                {value}
              </ReactMarkdown>
            ) : (
              "Click to write…"
            )}
          </Box>
        )}
      </Box>
    </BlockChrome>
  );
};

export default TextBlock;
