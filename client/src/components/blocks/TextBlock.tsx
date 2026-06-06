import { Box, Flex, Textarea } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import type { Block, TextColor, TextFont, TextSize, TextStyle } from "../../api/types";
import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";
import { useDeleteBlock, useUpdateBlock } from "../../hooks/useBlockMutations";
import BlockChrome from "./BlockChrome";

const FONTS: Record<TextFont, { label: string; family: string }> = {
  sans: { label: "Sans", family: "'Space Grotesk', sans-serif" },
  display: { label: "Display", family: "'Syne', sans-serif" },
  mono: { label: "Mono", family: "'Space Mono', monospace" },
};

const SIZES: Record<TextSize, { label: string; px: string }> = {
  sm: { label: "S", px: "14px" },
  md: { label: "M", px: "18px" },
  lg: { label: "L", px: "26px" },
};

const COLORS: { key: TextColor; label: string }[] = [
  { key: "ink", label: "Default" },
  { key: "terracotta", label: "Terracotta" },
  { key: "ochre", label: "Ochre" },
  { key: "teal", label: "Teal" },
  { key: "oxblood", label: "Oxblood" },
];

const DEFAULT_STYLE: Required<TextStyle> = { font: "sans", color: "ink", size: "md" };

const resolveStyle = (style: TextStyle | null): Required<TextStyle> => ({
  ...DEFAULT_STYLE,
  ...(style ?? {}),
});

type Props = { pageId: string; block: Block };

const TextBlock = ({ pageId, block }: Props): JSX.Element => {
  const [value, setValue] = useState(block.content);
  const [style, setStyle] = useState<Required<TextStyle>>(resolveStyle(block.style));
  const [isEditing, setIsEditing] = useState(block.content === "");
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const styleRef = useRef(style);
  styleRef.current = style;
  const updateM = useUpdateBlock(pageId);
  const deleteM = useDeleteBlock(pageId);

  useEffect(() => {
    setValue(block.content);
    setStyle(resolveStyle(block.style));
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

  const applyStyle = (patch: Partial<TextStyle>) => {
    const next = { ...styleRef.current, ...patch };
    styleRef.current = next;
    setStyle(next);
    updateM.mutate({ id: block.id, input: { style: next } });
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node | null)) {
      setIsEditing(false);
    }
  };

  const textStyles = {
    fontFamily: FONTS[style.font].family,
    fontSize: SIZES[style.size].px,
    color: `var(--${style.color})`,
    lineHeight: 1.6,
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-word" as const,
  };

  return (
    <BlockChrome type="text" onDelete={() => deleteM.mutate(block.id)}>
      <Box width="100%" ref={containerRef} onBlur={handleBlur}>
        {isEditing ? (
          <>
            <Flex align="center" gap="6px" mb="10px" flexWrap="wrap">
              {/* Font */}
              <Flex border="2px solid var(--ink)">
                {(Object.keys(FONTS) as TextFont[]).map((key) => (
                  <Box
                    key={key}
                    as="button"
                    title={FONTS[key].label}
                    fontFamily={FONTS[key].family}
                    fontWeight={700}
                    fontSize="12px"
                    lineHeight={1}
                    px="9px"
                    py="6px"
                    cursor="pointer"
                    bg={style.font === key ? "var(--ink)" : "transparent"}
                    color={style.font === key ? "var(--paper)" : "var(--ink)"}
                    onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
                    onClick={() => applyStyle({ font: key })}
                  >
                    {FONTS[key].label}
                  </Box>
                ))}
              </Flex>

              {/* Size */}
              <Flex border="2px solid var(--ink)">
                {(Object.keys(SIZES) as TextSize[]).map((key) => (
                  <Box
                    key={key}
                    as="button"
                    title={`Size ${SIZES[key].label}`}
                    fontFamily="'Space Mono', monospace"
                    fontWeight={700}
                    fontSize="11px"
                    lineHeight={1}
                    width="24px"
                    py="6px"
                    cursor="pointer"
                    bg={style.size === key ? "var(--ink)" : "transparent"}
                    color={style.size === key ? "var(--paper)" : "var(--ink)"}
                    onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
                    onClick={() => applyStyle({ size: key })}
                  >
                    {SIZES[key].label}
                  </Box>
                ))}
              </Flex>

              {/* Colour */}
              <Flex align="center" gap="6px">
                {COLORS.map((c) => (
                  <Box
                    key={c.key}
                    as="button"
                    title={c.label}
                    width="18px"
                    height="18px"
                    borderRadius="50%"
                    border="2px solid var(--ink)"
                    cursor="pointer"
                    boxShadow={style.color === c.key ? "0 0 0 2px var(--paper), 0 0 0 4px var(--ink)" : "none"}
                    bg={c.key === "ink" ? "color-mix(in oklab, var(--ink) 30%, transparent)" : `var(--${c.key})`}
                    onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
                    onClick={() => applyStyle({ color: c.key })}
                  />
                ))}
              </Flex>

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
              placeholder="Write something…"
              variant="unstyled"
              rows={Math.max(2, value.split("\n").length)}
              resize="none"
              sx={textStyles}
              _placeholder={{ color: "color-mix(in oklab, var(--ink) 40%, transparent)" }}
            />
          </>
        ) : (
          <Box
            minH="24px"
            cursor="text"
            onClick={() => setIsEditing(true)}
            sx={value ? textStyles : { opacity: 0.45, fontStyle: "italic" }}
          >
            {value || "Click to write…"}
          </Box>
        )}
      </Box>
    </BlockChrome>
  );
};

export default TextBlock;
