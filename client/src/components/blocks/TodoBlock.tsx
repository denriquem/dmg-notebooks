import { Box, Flex, Input } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import type { Block } from "../../api/types";
import { useDebouncedCallback } from "../../hooks/useDebouncedCallback";
import { useDeleteBlock, useUpdateBlock } from "../../hooks/useBlockMutations";
import BlockChrome from "./BlockChrome";

type Props = { pageId: string; block: Block };

const TodoBlock = ({ pageId, block }: Props): JSX.Element => {
  const [value, setValue] = useState(block.content);
  const updateM = useUpdateBlock(pageId);
  const deleteM = useDeleteBlock(pageId);
  const done = block.checked;

  useEffect(() => {
    setValue(block.content);
  }, [block.id]);

  const saveText = useDebouncedCallback((next: string) => {
    if (next === block.content) return;
    updateM.mutate({ id: block.id, input: { content: next } });
  }, 500);

  return (
    <BlockChrome type="todo" onDelete={() => deleteM.mutate(block.id)}>
      <Flex align="center" gap="14px">
        <Flex
          as="button"
          aria-label={done ? "Mark not done" : "Mark done"}
          flex="0 0 auto"
          width="26px"
          height="26px"
          align="center"
          justify="center"
          bg={done ? "var(--ochre)" : "var(--paper)"}
          border="3px solid var(--ink)"
          cursor="pointer"
          onClick={() => updateM.mutate({ id: block.id, input: { checked: !done } })}
        >
          {done && (
            <Box as="span" fontFamily="'Space Grotesk', sans-serif" fontWeight={800} fontSize="16px" lineHeight={1} color="var(--ink)">
              ✓
            </Box>
          )}
        </Flex>
        <Input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            saveText(e.target.value);
          }}
          placeholder="To-do"
          variant="unstyled"
          fontFamily="'Space Grotesk', sans-serif"
          fontWeight={600}
          fontSize="16px"
          lineHeight={1.3}
          color={done ? "color-mix(in oklab, var(--ink) 50%, transparent)" : "var(--ink)"}
          textDecoration={done ? "line-through" : "none"}
          _placeholder={{ color: "color-mix(in oklab, var(--ink) 40%, transparent)" }}
        />
      </Flex>
    </BlockChrome>
  );
};

export default TodoBlock;
