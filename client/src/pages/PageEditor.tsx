import { useEffect, useState } from "react";
import { Box, Flex, Input, SimpleGrid, Spinner, Text } from "@chakra-ui/react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { usePage, pageKey } from "../hooks/usePage";
import { usePages, useUpdatePage, useCreatePage } from "../hooks/usePages";
import { useDebouncedCallback } from "../hooks/useDebouncedCallback";
import BlockList from "../components/blocks/BlockList";
import AddBlockMenu from "../components/blocks/AddBlockMenu";
import { useCreateBlock } from "../hooks/useBlockMutations";
import type { BlockType, SubpageSummary } from "../api/types";
import type { Token } from "../theme/tokens";
import Glyph from "../components/dmg/Glyph";
import PopButton from "../components/dmg/PopButton";
import { relTime } from "../lib/time";

const SUB_ACCENTS: Token[] = ["terracotta", "teal", "ochre", "oxblood"];

const SubRow = ({ sub, n }: { sub: SubpageSummary; n: number }): JSX.Element => {
  const [hover, setHover] = useState(false);
  const acc = SUB_ACCENTS[(n - 1) % SUB_ACCENTS.length];
  return (
    <Flex
      as={RouterLink}
      to={`/pages/${sub.id}`}
      align="center"
      gap="16px"
      p="13px 16px"
      bg="var(--paper)"
      border="3px solid var(--ink)"
      cursor="pointer"
      transition="all .12s"
      boxShadow={hover ? `6px 6px 0 var(--${acc})` : "none"}
      transform={hover ? "translate(-1px,-1px)" : "none"}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Glyph kind="column" size={26} color={acc} />
      <Box flex="1" minW={0}>
        <Text fontFamily="'Syne', sans-serif" fontWeight={800} fontSize="16px" lineHeight={1.05} color="var(--ink)" noOfLines={1}>
          {sub.title || "Untitled"}
        </Text>
        <Text
          fontFamily="'Space Mono', monospace"
          fontWeight={400}
          fontSize="10px"
          letterSpacing="0.06em"
          mt="4px"
          color="color-mix(in oklab, var(--ink) 56%, transparent)"
        >
          UPDATED {relTime(sub.updatedAt)}
        </Text>
      </Box>
      {sub._count.children > 0 && (
        <Text
          fontFamily="'Space Mono', monospace"
          fontWeight={700}
          fontSize="11px"
          color="var(--paper)"
          bg="var(--ink)"
          px="9px"
          py="5px"
          flexShrink={0}
        >
          +{sub._count.children}
        </Text>
      )}
    </Flex>
  );
};

const PageEditor = (): JSX.Element => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const pageQ = usePage(id);
  const updatePage = useUpdatePage();
  const createBlock = useCreateBlock(id);
  const createPage = useCreatePage();
  const qc = useQueryClient();
  const { refetch: refetchPages } = usePages();

  const [title, setTitle] = useState("");

  useEffect(() => {
    if (pageQ.data) setTitle(pageQ.data.title);
  }, [pageQ.data?.id]);

  const saveTitle = useDebouncedCallback((next: string) => {
    if (!pageQ.data || !next.trim() || next === pageQ.data.title) return;
    updatePage.mutate(
      { id, title: next },
      {
        onSuccess: () => {
          qc.setQueryData(
            pageKey(id),
            (prev: typeof pageQ.data | undefined) => (prev ? { ...prev, title: next } : prev),
          );
          void refetchPages();
        },
      },
    );
  }, 500);

  const onAdd = (type: BlockType) => {
    const orderIndex = (pageQ.data?.blocks.at(-1)?.orderIndex ?? -1) + 1;
    const language = type === "code" ? "typescript" : undefined;
    createBlock.mutate({ type, content: "", orderIndex, language });
  };

  const onAddSubpage = async () => {
    const page = await createPage.mutateAsync({ title: "Untitled", parentId: id });
    navigate(`/pages/${page.id}`);
  };

  if (pageQ.isLoading) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Spinner color="var(--terracotta)" size="lg" />
      </Box>
    );
  }

  if (!pageQ.data) {
    return (
      <Box minH="100vh" display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap="12px">
        <Text fontFamily="'Syne', sans-serif" fontWeight={800} fontSize="22px">
          Page not found.
        </Text>
        <Box as={RouterLink} to="/" fontFamily="'Space Mono', monospace" fontSize="12px" textTransform="uppercase" letterSpacing="0.1em" color="var(--oxblood)">
          ← Back to dashboard
        </Box>
      </Box>
    );
  }

  const page = pageQ.data;
  const backHref = page.parentId ? `/pages/${page.parentId}` : "/";
  const backLabel = page.parentId ? "← Parent page" : "← Loose pages";
  const meta = `${page.parentId ? "SUBPAGE" : "NOTEBOOK"} / UPDATED ${relTime(page.updatedAt)} / ${page.blocks.length} BLOCKS`;

  const todos = page.blocks.filter((b) => b.type === "todo");
  const doneCount = todos.filter((b) => b.checked).length;
  const todoCount = todos.length;

  return (
    <Box minH="100vh" position="relative" fontFamily="'Space Grotesk', sans-serif">
      <div className="dmg-wall-grid" />

      <Flex
        position="sticky"
        top={0}
        zIndex={20}
        align="center"
        gap="16px"
        px="24px"
        height="58px"
        bg="var(--ink)"
      >
        <Box
          as={RouterLink}
          to={backHref}
          fontFamily="'Syne', sans-serif"
          fontWeight={800}
          fontSize="12px"
          letterSpacing="0.02em"
          textTransform="uppercase"
          color="var(--bone)"
          whiteSpace="nowrap"
        >
          {backLabel}
        </Box>
        <Box width="2px" height="22px" bg="color-mix(in oklab, var(--ink) 50%, var(--bone))" />
        <Text fontFamily="'Syne', sans-serif" fontWeight={800} fontSize="14px" letterSpacing="-0.01em" color="var(--horizon)" whiteSpace="nowrap">
          DMGNotebooks
        </Text>
        <Flex ml="auto" gap="8px">
          <PopButton variant="outline" fontSize="11px" px="13px" py="9px">
            Share
          </PopButton>
          <PopButton variant="solid" fontSize="11px" px="13px" py="9px" onClick={onAddSubpage} isDisabled={createPage.isPending}>
            ＋ Subpage
          </PopButton>
        </Flex>
      </Flex>

      <Box position="relative" zIndex={1} maxW="860px" mx="auto" px="24px" pt="46px" pb="90px">
        <Box mb="34px">
          <Flex align="center" gap="14px" mb="16px">
            <Glyph kind="sphere" size={40} color="terracotta" />
            <Text
              fontFamily="'Space Mono', monospace"
              fontWeight={700}
              fontSize="11px"
              letterSpacing="0.14em"
              textTransform="uppercase"
              color="color-mix(in oklab, var(--ink) 62%, transparent)"
            >
              {meta}
            </Text>
          </Flex>
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              saveTitle(e.target.value);
            }}
            placeholder="Untitled"
            variant="unstyled"
            fontFamily="'Syne', sans-serif"
            fontWeight={800}
            fontSize={{ base: "40px", md: "56px" }}
            lineHeight={0.94}
            letterSpacing="-0.03em"
            color="var(--ink)"
            _placeholder={{ color: "color-mix(in oklab, var(--ink) 35%, transparent)" }}
          />
          <Box height="6px" width="96px" bg="var(--ink)" mt="18px" />
          {todoCount > 0 && (
            <Flex
              mt="16px"
              display="inline-flex"
              align="center"
              gap="10px"
              fontFamily="'Space Mono', monospace"
              fontWeight={700}
              fontSize="11px"
              letterSpacing="0.08em"
              textTransform="uppercase"
              color="color-mix(in oklab, var(--ink) 70%, transparent)"
            >
              <Box position="relative" width="120px" height="8px" bg="color-mix(in oklab, var(--ink) 22%, transparent)" border="2px solid var(--ink)">
                <Box position="absolute" inset={0} width={`${(doneCount / todoCount) * 100}%`} bg="var(--ochre)" />
              </Box>
              {doneCount} / {todoCount} done
            </Flex>
          )}
        </Box>

        <BlockList pageId={id} blocks={page.blocks} />
        <AddBlockMenu onAdd={onAdd} />

        <Box mt="56px">
          <Box height="3px" bg="var(--ink)" mb="20px" />
          <Flex align="baseline" gap="12px" mb="18px">
            <Text fontFamily="'Syne', sans-serif" fontWeight={800} fontSize="22px" color="var(--ink)">
              Subpages
            </Text>
            <Text
              fontFamily="'Space Mono', monospace"
              fontWeight={700}
              fontSize="11px"
              letterSpacing="0.08em"
              color="color-mix(in oklab, var(--ink) 50%, transparent)"
            >
              / {String(page.children.length).padStart(2, "0")}
            </Text>
          </Flex>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing="14px">
            {page.children.map((child, i) => (
              <SubRow key={child.id} sub={child} n={i + 1} />
            ))}
            <Flex
              as="button"
              align="center"
              justify="center"
              gap="8px"
              p="16px"
              border="3px dashed color-mix(in oklab, var(--ink) 45%, transparent)"
              color="color-mix(in oklab, var(--ink) 70%, transparent)"
              fontFamily="'Syne', sans-serif"
              fontWeight={800}
              fontSize="13px"
              textTransform="uppercase"
              cursor="pointer"
              transition="all .12s"
              _hover={{ borderColor: "var(--ink)", color: "var(--ink)" }}
              onClick={onAddSubpage}
            >
              ＋ New subpage
            </Flex>
          </SimpleGrid>
        </Box>
      </Box>
    </Box>
  );
};

export default PageEditor;
