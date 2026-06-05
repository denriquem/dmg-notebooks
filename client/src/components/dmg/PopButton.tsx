import { Box, type BoxProps } from "@chakra-ui/react";
import { forwardRef } from "react";

type Variant = "solid" | "outline" | "ghost";

type Props = BoxProps & { variant?: Variant; isDisabled?: boolean };

const VARIANTS: Record<Variant, BoxProps> = {
  solid: {
    bg: "var(--ochre)",
    color: "var(--ink)",
    border: "2.5px solid var(--ink)",
    boxShadow: "3px 3px 0 var(--bone)",
    _hover: { boxShadow: "5px 5px 0 var(--bone)", transform: "translate(-1px,-1px)" },
  },
  outline: {
    bg: "transparent",
    color: "var(--bone)",
    border: "2.5px solid var(--bone)",
    _hover: { bg: "color-mix(in oklab, var(--bone) 12%, transparent)" },
  },
  ghost: {
    bg: "transparent",
    color: "var(--bone)",
    border: "2.5px solid transparent",
    _hover: { bg: "color-mix(in oklab, var(--bone) 10%, transparent)" },
  },
};

const PopButton = forwardRef<HTMLButtonElement, Props>(
  ({ variant = "ghost", isDisabled, sx, ...rest }, ref) => (
    <Box
      ref={ref}
      as="button"
      type="button"
      disabled={isDisabled}
      fontFamily="'Syne', sans-serif"
      fontWeight={800}
      fontSize="13px"
      lineHeight={1}
      letterSpacing="0.01em"
      textTransform="uppercase"
      px="16px"
      py="11px"
      cursor="pointer"
      transition="all .12s"
      whiteSpace="nowrap"
      sx={{ opacity: isDisabled ? 0.5 : 1, pointerEvents: isDisabled ? "none" : "auto", ...sx }}
      {...VARIANTS[variant]}
      {...rest}
    />
  ),
);

PopButton.displayName = "PopButton";

export default PopButton;
