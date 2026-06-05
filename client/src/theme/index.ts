import { extendTheme } from "@chakra-ui/react";

const dmg = {
  ink: "var(--ink)",
  paper: "var(--paper)",
  bone: "var(--bone)",
  terracotta: "var(--terracotta)",
  ochre: "var(--ochre)",
  teal: "var(--teal)",
  oxblood: "var(--oxblood)",
  horizon: "var(--horizon)",
  skyTop: "var(--skyTop)",
  skyBot: "var(--skyBot)",
};

export const theme = extendTheme({
  fonts: {
    heading: "'Syne', sans-serif",
    body: "'Space Grotesk', sans-serif",
    mono: "'Space Mono', monospace",
  },
  colors: { dmg },
  styles: {
    global: {
      "html, body, #root": { height: "100%" },
      body: {
        bg: "var(--paper)",
        color: "var(--ink)",
        fontFamily: "'Space Grotesk', sans-serif",
      },
      "*:focus, *:focus-visible": { boxShadow: "none !important", outline: "none" },
      "*::selection": { background: "var(--horizon)", color: "var(--ink)" },
    },
  },
});
