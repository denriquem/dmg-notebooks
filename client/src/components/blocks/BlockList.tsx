import { Box } from "@chakra-ui/react";
import type { Block } from "../../api/types";
import TextBlock from "./TextBlock";
import TodoBlock from "./TodoBlock";
import CodeBlock from "./CodeBlock";

type Props = { pageId: string; blocks: Block[] };

const BlockList = ({ pageId, blocks }: Props): JSX.Element => {
  const sorted = [...blocks].sort((a, b) => a.orderIndex - b.orderIndex);
  return (
    <Box>
      {sorted.map((block) => {
        if (block.type === "text") return <TextBlock key={block.id} pageId={pageId} block={block} />;
        if (block.type === "todo") return <TodoBlock key={block.id} pageId={pageId} block={block} />;
        return <CodeBlock key={block.id} pageId={pageId} block={block} />;
      })}
    </Box>
  );
};

export default BlockList;
