import { Box, Flex, HStack, Input, SimpleGrid, Spinner, Text } from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { useLogout } from "../hooks/useAuth";
import { useCreatePage, useDeletePage, usePages, useUpdatePage } from "../hooks/usePages";
import { useCreateFolder, useDeleteFolder, useFolders, useUpdateFolder } from "../hooks/useFolders";
import type { Folder } from "../api/types";
import type { Token } from "../theme/tokens";
import Glyph, { type GlyphKind } from "../components/dmg/Glyph";
import PopButton from "../components/dmg/PopButton";
import { relTime } from "../lib/time";

const DRAG_MIME = "application/x-dmnotebook-page";

const FOLDER_KINDS: GlyphKind[] = ["column", "sphere", "cube", "cone", "arch"];
const FOLDER_ACCENTS: Token[] = ["terracotta", "ochre", "teal", "oxblood", "bone"];
const ROW_ACCENTS: Token[] = ["terracotta", "ochre", "teal", "oxblood", "horizon"];

const SectionHead = ({ title, eyebrow }: { title: string; eyebrow: string }): JSX.Element => (
  <Flex align="baseline" gap="12px" mb="18px">
    <Text fontFamily="'Syne', sans-serif" fontWeight={800} fontSize="22px" color="var(--ink)">
      {title}
    </Text>
    <Text
      fontFamily="'Space Mono', monospace"
      fontWeight={700}
      fontSize="11px"
      letterSpacing="0.08em"
      color="color-mix(in oklab, var(--ink) 60%, transparent)"
    >
      {eyebrow}
    </Text>
  </Flex>
);

type ArchProps = {
  folder: Folder;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  onDropPage: (pageId: string) => void;
};

const FolderArch = ({ folder, index, isOpen, onToggle, onDropPage }: ArchProps): JSX.Element => {
  const [hover, setHover] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const accent = FOLDER_ACCENTS[index % FOLDER_ACCENTS.length];
  const kind = FOLDER_KINDS[index % FOLDER_KINDS.length];
  const glyphColor: Token = accent === "bone" ? "oxblood" : "paper";
  const W = 196;
  const archH = 232;

  return (
    <Box
      width={`${W}px`}
      cursor="pointer"
      onClick={onToggle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes(DRAG_MIME)) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          setDragOver(true);
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        const pageId = e.dataTransfer.getData(DRAG_MIME);
        setDragOver(false);
        if (pageId) onDropPage(pageId);
      }}
    >
      <Box
        position="relative"
        width={`${W}px`}
        height={`${archH}px`}
        transition="transform .12s"
        transform={hover || isOpen ? "translate(-3px,-3px)" : "none"}
      >
        <Box
          position="absolute"
          inset={0}
          transform="translate(10px,10px)"
          bg="var(--ink)"
          borderTopRadius={`${W / 2}px`}
        />
        <Flex
          position="absolute"
          inset={0}
          direction="column"
          align="center"
          overflow="hidden"
          bg={dragOver ? "color-mix(in oklab, var(--ink) 14%, transparent)" : `var(--${accent})`}
          border="3px solid var(--ink)"
          borderBottom="none"
          borderTopRadius={`${W / 2}px`}
          borderStyle={dragOver ? "dashed" : "solid"}
        >
          <Box
            width="30px"
            height="30px"
            mt="-1px"
            bg="var(--ink)"
            sx={{ clipPath: "polygon(50% 0,100% 100%,0 100%)" }}
          />
          <Box mt="26px" transition="transform .12s" transform={hover ? "scale(1.06)" : "none"}>
            <Glyph kind={kind} size={78} color={glyphColor} />
          </Box>
          <Flex
            mt="auto"
            width="100%"
            bg="var(--ink)"
            px="12px"
            py="10px"
            align="center"
            justify="space-between"
          >
            <Text
              fontFamily="'Syne', sans-serif"
              fontWeight={800}
              fontSize="16px"
              lineHeight={1}
              textTransform="uppercase"
              letterSpacing="-0.01em"
              color="var(--bone)"
              noOfLines={1}
            >
              {folder.name}
            </Text>
            <Text
              fontFamily="'Space Mono', monospace"
              fontWeight={700}
              fontSize="11px"
              lineHeight={1}
              color={`var(--${accent})`}
            >
              {String(folder.pages.length).padStart(2, "0")}
            </Text>
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
};

type IndexRowProps = {
  n: number;
  title: string;
  updatedAt: string;
  subpageCount?: number;
  draggable?: boolean;
  pageId: string;
  onOpen: () => void;
  onDelete: () => void;
};

const IndexRow = ({
  n, title, updatedAt, subpageCount, draggable, pageId, onOpen, onDelete,
}: IndexRowProps): JSX.Element => {
  const [hover, setHover] = useState(false);
  const acc = ROW_ACCENTS[(n - 1) % ROW_ACCENTS.length];
  return (
    <Flex
      position="relative"
      align="center"
      gap="20px"
      pl="14px"
      pr="18px"
      py="14px"
      bg="var(--paper)"
      border="3px solid var(--ink)"
      cursor="pointer"
      transition="all .12s"
      boxShadow={hover ? `8px 8px 0 var(--${acc})` : "none"}
      transform={hover ? "translate(-2px,-2px)" : "none"}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onOpen}
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_MIME, pageId);
        e.dataTransfer.effectAllowed = "move";
      }}
    >
      <Text
        fontFamily="'Syne', sans-serif"
        fontWeight={800}
        fontSize="38px"
        lineHeight={0.8}
        letterSpacing="-0.04em"
        color={`var(--${acc})`}
        width="56px"
        textAlign="center"
        flexShrink={0}
      >
        {String(n).padStart(2, "0")}
      </Text>
      <Box width="3px" alignSelf="stretch" bg="var(--ink)" flexShrink={0} />
      <Box flex="1" minW={0}>
        <Text
          fontFamily="'Syne', sans-serif"
          fontWeight={800}
          fontSize="18px"
          lineHeight={1.05}
          letterSpacing="-0.01em"
          color="var(--ink)"
          noOfLines={1}
        >
          {title || "Untitled"}
        </Text>
        <Text
          fontFamily="'Space Mono', monospace"
          fontWeight={400}
          fontSize="10px"
          letterSpacing="0.06em"
          mt="5px"
          color="color-mix(in oklab, var(--ink) 56%, transparent)"
        >
          UPDATED {relTime(updatedAt)}
        </Text>
      </Box>
      {(subpageCount ?? 0) > 0 && (
        <Text
          fontFamily="'Space Mono', monospace"
          fontWeight={700}
          fontSize="11px"
          letterSpacing="0.04em"
          color="var(--paper)"
          bg="var(--ink)"
          px="9px"
          py="5px"
          flexShrink={0}
        >
          +{subpageCount}
        </Text>
      )}
      <Box
        as="button"
        aria-label="Delete page"
        position="absolute"
        top="-10px"
        right="-10px"
        width="24px"
        height="24px"
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
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        ×
      </Box>
    </Flex>
  );
};

const DashedTile = ({ label, onClick }: { label: string; onClick: () => void }): JSX.Element => (
  <Flex
    as="button"
    align="center"
    justify="center"
    gap="8px"
    p="14px"
    border="3px dashed color-mix(in oklab, var(--ink) 45%, transparent)"
    color="color-mix(in oklab, var(--ink) 70%, transparent)"
    fontFamily="'Syne', sans-serif"
    fontWeight={800}
    fontSize="14px"
    textTransform="uppercase"
    cursor="pointer"
    transition="all .12s"
    _hover={{ borderColor: "var(--ink)", color: "var(--ink)" }}
    onClick={onClick}
  >
    {label}
  </Flex>
);

const Dashboard = (): JSX.Element => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const logoutM = useLogout();
  const pagesQ = usePages();
  const foldersQ = useFolders();
  const createM = useCreatePage();
  const updateM = useUpdatePage();
  const deleteM = useDeletePage();
  const createFolderM = useCreateFolder();
  const deleteFolderM = useDeleteFolder();
  const updateFolderM = useUpdateFolder();

  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const [pagesDragOver, setPagesDragOver] = useState(false);

  const onCreate = async () => {
    const page = await createM.mutateAsync("Untitled");
    navigate(`/pages/${page.id}`);
  };

  const onCreateInFolder = async (folderId: string) => {
    const page = await createM.mutateAsync({ title: "Untitled", folderId });
    navigate(`/pages/${page.id}`);
  };

  const onLogout = async () => {
    await logoutM.mutateAsync();
    navigate("/login");
  };

  const onDeletePage = (id: string, title: string) => {
    if (confirm(`Delete "${title || "Untitled"}"?`)) deleteM.mutate(id);
  };

  const onMovePageToFolder = (pageId: string, folderId: string | null) => {
    updateM.mutate({ id: pageId, folderId });
  };

  const topLevelPages = pagesQ.data?.filter((p) => !p.folderId) ?? [];
  const folders = foldersQ.data ?? [];
  const openFolder = folders.find((f) => f.id === openFolderId) ?? null;
  const isLoading = pagesQ.isLoading || foldersQ.isLoading;

  return (
    <Box minH="100vh" position="relative" fontFamily="'Space Grotesk', sans-serif">
      <div className="dmg-wall-grid" />
      <Box position="relative" zIndex={1} maxW="1200px" mx="auto" px="36px" pb="90px">
        <Flex
          mt="32px"
          bg="var(--ink)"
          px="28px"
          py="24px"
          align="center"
          justify="space-between"
          gap="16px"
          flexWrap="wrap"
          boxShadow="12px 12px 0 var(--terracotta)"
        >
          <Box>
            <Text
              as="h1"
              fontFamily="'Syne', sans-serif"
              fontWeight={800}
              fontSize={{ base: "38px", md: "54px" }}
              lineHeight={0.84}
              letterSpacing="-0.035em"
              color="var(--bone)"
            >
              DMGNotebooks
            </Text>
            {user && (
              <Text
                mt="8px"
                fontFamily="'Space Mono', monospace"
                fontWeight={700}
                fontSize="10px"
                letterSpacing="0.14em"
                textTransform="uppercase"
                color="color-mix(in oklab, var(--bone) 50%, transparent)"
              >
                Signed in as {user.name}
              </Text>
            )}
          </Box>
          <HStack spacing="10px" flexWrap="wrap">
            <PopButton variant="ghost" onClick={onLogout}>
              Log out
            </PopButton>
            <PopButton
              variant="outline"
              onClick={() => {
                const name = prompt("Folder name:");
                if (name?.trim()) createFolderM.mutate(name.trim());
              }}
              isDisabled={createFolderM.isPending}
            >
              New folder
            </PopButton>
            <PopButton variant="solid" onClick={onCreate} isDisabled={createM.isPending}>
              ＋ New page
            </PopButton>
          </HStack>
        </Flex>

        {isLoading ? (
          <Box mt="60px" textAlign="center">
            <Spinner color="var(--terracotta)" size="lg" />
          </Box>
        ) : (
          <>
            {folders.length > 0 && (
              <Box mt="40px">
                <SectionHead title="Folders" eyebrow={`/ ${folders.length} ${folders.length === 1 ? "ARCH" : "ARCHES"}`} />
                <Box>
                  <Flex align="flex-end" gap="16px" flexWrap="wrap">
                    {folders.map((folder, i) => (
                      <FolderArch
                        key={folder.id}
                        folder={folder}
                        index={i}
                        isOpen={openFolderId === folder.id}
                        onToggle={() => {
                          setRenaming(false);
                          setOpenFolderId((prev) => (prev === folder.id ? null : folder.id));
                        }}
                        onDropPage={(pageId) => onMovePageToFolder(pageId, folder.id)}
                      />
                    ))}
                  </Flex>
                  <Box height="5px" bg="var(--ink)" mt="-1px" />
                </Box>

                {openFolder && (
                  <Box mt="22px" bg="var(--paper)" border="3px solid var(--ink)" p="18px">
                    <Flex align="center" gap="12px" mb="14px" flexWrap="wrap">
                      {renaming ? (
                        <Input
                          autoFocus
                          value={renameDraft}
                          variant="unstyled"
                          fontFamily="'Syne', sans-serif"
                          fontWeight={800}
                          fontSize="18px"
                          color="var(--ink)"
                          maxW="280px"
                          onChange={(e) => setRenameDraft(e.target.value)}
                          onBlur={() => {
                            const next = renameDraft.trim();
                            if (next && next !== openFolder.name) {
                              updateFolderM.mutate({ id: openFolder.id, name: next });
                            }
                            setRenaming(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                            if (e.key === "Escape") setRenaming(false);
                          }}
                        />
                      ) : (
                        <Text
                          fontFamily="'Syne', sans-serif"
                          fontWeight={800}
                          fontSize="18px"
                          color="var(--ink)"
                          textTransform="uppercase"
                          cursor="text"
                          onClick={() => {
                            setRenameDraft(openFolder.name);
                            setRenaming(true);
                          }}
                        >
                          {openFolder.name}
                        </Text>
                      )}
                      <HStack spacing="8px" ml="auto">
                        <DashedTile label="＋ New page" onClick={() => onCreateInFolder(openFolder.id)} />
                        <Box
                          as="button"
                          fontFamily="'Space Mono', monospace"
                          fontWeight={700}
                          fontSize="10px"
                          letterSpacing="0.1em"
                          textTransform="uppercase"
                          color="var(--oxblood)"
                          border="2px solid var(--oxblood)"
                          px="10px"
                          py="9px"
                          cursor="pointer"
                          transition="all .12s"
                          _hover={{ bg: "var(--oxblood)", color: "var(--paper)" }}
                          onClick={() => {
                            if (confirm(`Delete folder "${openFolder.name}"? Pages inside will be kept but unfiled.`)) {
                              deleteFolderM.mutate(openFolder.id);
                              setOpenFolderId(null);
                            }
                          }}
                        >
                          Delete folder
                        </Box>
                      </HStack>
                    </Flex>
                    {openFolder.pages.length === 0 ? (
                      <Text
                        fontFamily="'Space Mono', monospace"
                        fontSize="11px"
                        letterSpacing="0.06em"
                        textTransform="uppercase"
                        color="color-mix(in oklab, var(--ink) 50%, transparent)"
                      >
                        Empty — drag a page here or add one.
                      </Text>
                    ) : (
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing="14px">
                        {openFolder.pages.map((p, i) => (
                          <IndexRow
                            key={p.id}
                            n={i + 1}
                            pageId={p.id}
                            title={p.title}
                            updatedAt={p.updatedAt}
                            draggable
                            onOpen={() => navigate(`/pages/${p.id}`)}
                            onDelete={() => onDeletePage(p.id, p.title)}
                          />
                        ))}
                      </SimpleGrid>
                    )}
                  </Box>
                )}
              </Box>
            )}

            <Box
              mt="40px"
              onDragOver={(e) => {
                if (e.dataTransfer.types.includes(DRAG_MIME)) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setPagesDragOver(true);
                }
              }}
              onDragLeave={() => setPagesDragOver(false)}
              onDrop={(e) => {
                const pageId = e.dataTransfer.getData(DRAG_MIME);
                setPagesDragOver(false);
                if (pageId) onMovePageToFolder(pageId, null);
              }}
              p={pagesDragOver ? "12px" : 0}
              border={pagesDragOver ? "3px dashed var(--ink)" : "3px dashed transparent"}
              bg={pagesDragOver ? "color-mix(in oklab, var(--horizon) 16%, transparent)" : undefined}
              transition="all .12s"
            >
              <SectionHead
                title="Loose pages"
                eyebrow={`/ ${String(topLevelPages.length).padStart(2, "0")} UNFILED — DRAG INTO AN ARCH`}
              />
              {topLevelPages.length === 0 && folders.length === 0 ? (
                <Box
                  textAlign="center"
                  py="60px"
                  fontFamily="'Space Mono', monospace"
                  fontSize="12px"
                  letterSpacing="0.08em"
                  textTransform="uppercase"
                  color="color-mix(in oklab, var(--ink) 50%, transparent)"
                >
                  No pages yet. Press ＋ New page to begin.
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing="14px">
                  {topLevelPages.map((p, i) => (
                    <IndexRow
                      key={p.id}
                      n={i + 1}
                      pageId={p.id}
                      title={p.title}
                      updatedAt={p.updatedAt}
                      subpageCount={p._count?.children}
                      draggable
                      onOpen={() => navigate(`/pages/${p.id}`)}
                      onDelete={() => onDeletePage(p.id, p.title)}
                    />
                  ))}
                  <DashedTile label="＋ New page" onClick={onCreate} />
                </SimpleGrid>
              )}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;
