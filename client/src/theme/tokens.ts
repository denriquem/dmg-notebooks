export const PALETTES = {
  "Sienna dusk": {
    skyTop: "#2A1C18", skyBot: "#7A4632", bone: "#F2E7D2", paper: "#F6EEDC",
    terracotta: "#D2724A", ochre: "#E0A23E", teal: "#5E8A72", oxblood: "#8E2F22",
    ink: "#211309", horizon: "#F0B45A",
  },
  "Twilight piazza": {
    skyTop: "#0E2336", skyBot: "#23566A", bone: "#ECE3D0", paper: "#F3ECDB",
    terracotta: "#C8674A", ochre: "#E4B95B", teal: "#4C8E84", oxblood: "#B5482E",
    ink: "#0B1B27", horizon: "#E9B872",
  },
  "Pop cobalt": {
    skyTop: "#0B2E54", skyBot: "#1789A8", bone: "#F4EEE2", paper: "#FBF6EA",
    terracotta: "#EE5A3D", ochre: "#F4B807", teal: "#15A8A0", oxblood: "#C62F26",
    ink: "#06212F", horizon: "#F6C944",
  },
  Nocturne: {
    skyTop: "#14181A", skyBot: "#2C3A38", bone: "#E7DEC9", paper: "#EEE6D2",
    terracotta: "#B85638", ochre: "#C99A3F", teal: "#5C7A6E", oxblood: "#7A2519",
    ink: "#0C0F0E", horizon: "#C98B4A",
  },
} as const;

export type WorldName = keyof typeof PALETTES;
export type Token = keyof (typeof PALETTES)["Sienna dusk"];

export const DEFAULT_WORLD: WorldName = "Sienna dusk";

export const cvar = (token: Token): string => `var(--${token})`;

export const tint = (token: Token, pct: number, mix: "white" | "black" = "white"): string =>
  `color-mix(in oklab, var(--${token}) ${100 - pct}%, ${mix} ${pct}%)`;

export const applyWorld = (name: WorldName = DEFAULT_WORLD): void => {
  const palette = PALETTES[name];
  const root = document.documentElement;
  for (const [key, value] of Object.entries(palette)) {
    root.style.setProperty(`--${key}`, value);
  }
};
