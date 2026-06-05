import { Box, Flex, SimpleGrid, Text } from "@chakra-ui/react";
import { useState } from "react";
import type { BlockType } from "../../api/types";

type Props = { onAdd: (type: BlockType) => void };

const ITEMS: { type: BlockType; label: string; desc: string; token: string }[] = [
  { type: "text", label: "Text", desc: "Markdown prose", token: "teal" },
  { type: "todo", label: "To-do", desc: "A checkable task", token: "ochre" },
  { type: "code", label: "Code", desc: "Snippet + AI actions", token: "terracotta" },
];

const AddBlockMenu = ({ onAdd }: Props): JSX.Element => {
  const [open, setOpen] = useState(false);
  return (
    <Box position="relative" mt="4px">
      <Flex
        as="button"
        align="center"
        justify="center"
        gap="10px"
        width="100%"
        p="14px 16px"
        cursor="pointer"
        bg="transparent"
        border="3px dashed color-mix(in oklab, var(--ink) 45%, transparent)"
        color="color-mix(in oklab, var(--ink) 76%, transparent)"
        fontFamily="'Syne', sans-serif"
        fontWeight={800}
        fontSize="14px"
        letterSpacing="0.02em"
        textTransform="uppercase"
        transition="all .12s"
        _hover={{ borderColor: "var(--ink)", color: "var(--ink)" }}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "×  Close" : "＋  Add block"}
      </Flex>
      {open && (
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing="10px" mt="10px">
          {ITEMS.map((it) => (
            <Box
              key={it.type}
              as="button"
              textAlign="left"
              p="14px"
              cursor="pointer"
              bg="var(--paper)"
              border="3px solid var(--ink)"
              boxShadow={`5px 5px 0 var(--${it.token})`}
              transition="all .12s"
              _hover={{ transform: "translate(-2px,-2px)", boxShadow: `7px 7px 0 var(--${it.token})` }}
              onClick={() => {
                onAdd(it.type);
                setOpen(false);
              }}
            >
              <Text
                fontFamily="'Syne', sans-serif"
                fontWeight={800}
                fontSize="16px"
                lineHeight={1}
                mb="5px"
                color="var(--ink)"
              >
                {it.label}
              </Text>
              <Text
                fontFamily="'Space Mono', monospace"
                fontWeight={400}
                fontSize="10px"
                lineHeight={1.3}
                letterSpacing="0.04em"
                textTransform="uppercase"
                color="color-mix(in oklab, var(--ink) 58%, transparent)"
              >
                {it.desc}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default AddBlockMenu;
