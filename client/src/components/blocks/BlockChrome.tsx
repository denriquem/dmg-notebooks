import { Box, Flex } from "@chakra-ui/react";
import { useState } from "react";
import type { BlockType } from "../../api/types";

const TYPE_META: Record<BlockType, { tab: string; accent: string }> = {
  text: { tab: "TEXT", accent: "teal" },
  todo: { tab: "TO-DO", accent: "ochre" },
  code: { tab: "CODE", accent: "terracotta" },
};

type Props = {
  type: BlockType;
  onDelete: () => void;
  children: React.ReactNode;
};

const BlockChrome = ({ type, onDelete, children }: Props): JSX.Element => {
  const [hover, setHover] = useState(false);
  const { tab, accent } = TYPE_META[type];
  const isCode = type === "code";

  return (
    <Flex
      position="relative"
      gap={0}
      mb="16px"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Flex
        flex="0 0 auto"
        width="30px"
        align="center"
        justify="center"
        bg={`var(--${accent})`}
        border="3px solid var(--ink)"
        borderRight="none"
      >
        <Box
          as="span"
          sx={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          fontFamily="'Space Mono', monospace"
          fontWeight={700}
          fontSize="10px"
          lineHeight={1}
          letterSpacing="0.18em"
          color={type === "todo" ? "var(--ink)" : "var(--paper)"}
        >
          {tab}
        </Box>
      </Flex>

      <Box
        flex="1"
        minW={0}
        bg={isCode ? "var(--ink)" : "var(--paper)"}
        border="3px solid var(--ink)"
        p={isCode ? 0 : "16px 18px"}
        transition="all .12s"
        boxShadow={hover ? `7px 7px 0 var(--${accent})` : "none"}
        transform={hover ? "translate(-1px,-1px)" : "none"}
      >
        {children}
      </Box>

      <Box
        as="button"
        aria-label="Delete block"
        position="absolute"
        top="-10px"
        right="-10px"
        width="26px"
        height="26px"
        bg="var(--oxblood)"
        color="var(--paper)"
        border="2.5px solid var(--ink)"
        fontFamily="'Space Grotesk', sans-serif"
        fontWeight={700}
        fontSize="14px"
        lineHeight={1}
        cursor="pointer"
        opacity={hover ? 1 : 0}
        transition="opacity .12s"
        onClick={onDelete}
      >
        ×
      </Box>
    </Flex>
  );
};

export default BlockChrome;
