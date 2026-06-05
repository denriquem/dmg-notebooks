import { cvar, tint, type Token } from "../../theme/tokens";

export type GlyphKind = "sphere" | "cube" | "cone" | "column" | "arch";

type Props = { kind: GlyphKind; size?: number; color?: Token };

const Sphere = ({ size, color }: { size: number; color: Token }): JSX.Element => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: `radial-gradient(circle at 33% 28%, ${tint(color, 55)}, ${cvar(color)} 58%, ${tint(color, 32, "black")} 100%)`,
    }}
  />
);

const Cube = ({ size, color }: { size: number; color: Token }): JSX.Element => (
  <div style={{ width: size, height: size, position: "relative" }}>
    <div style={{ position: "absolute", left: 0, bottom: 0, width: size * 0.74, height: size * 0.74, background: cvar(color) }} />
    <div
      style={{
        position: "absolute", left: 0, top: 0, width: size * 0.74, height: size * 0.26,
        background: tint(color, 42), transform: "skewX(-45deg)", transformOrigin: "bottom left",
      }}
    />
    <div
      style={{
        position: "absolute", right: 0, bottom: 0, width: size * 0.26, height: size * 0.74,
        background: tint(color, 30, "black"), transform: "skewY(-45deg)", transformOrigin: "bottom left",
      }}
    />
  </div>
);

const Cone = ({ size, color }: { size: number; color: Token }): JSX.Element => (
  <div
    style={{
      width: size,
      height: size,
      clipPath: "polygon(50% 0, 100% 100%, 0 100%)",
      background: `linear-gradient(105deg, ${tint(color, 40)} 0%, ${cvar(color)} 46%, ${tint(color, 28, "black")} 100%)`,
    }}
  />
);

const Column = ({ size, color }: { size: number; color: Token }): JSX.Element => {
  const w = size * 0.5;
  return (
    <div style={{ width: size, height: size, position: "relative", display: "flex", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: 0, width: w * 1.32, height: size * 0.1, background: tint(color, 18, "black"), borderRadius: 1 }} />
      <div
        style={{
          position: "absolute", top: size * 0.1, width: w, height: size * 0.8,
          background: `repeating-linear-gradient(90deg, ${tint(color, 22, "black")} 0 2px, ${cvar(color)} 2px 7px)`,
        }}
      />
      <div style={{ position: "absolute", bottom: 0, width: w * 1.32, height: size * 0.1, background: tint(color, 18, "black"), borderRadius: 1 }} />
    </div>
  );
};

const ArchGlyph = ({ size, color }: { size: number; color: Token }): JSX.Element => {
  const w = size * 0.82;
  return (
    <div style={{ width: size, height: size, display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
      <div
        style={{
          width: w, height: size * 0.94,
          borderTopLeftRadius: w / 2, borderTopRightRadius: w / 2,
          background: `linear-gradient(160deg, ${tint(color, 30)}, ${cvar(color)} 70%)`,
          boxSizing: "border-box",
        }}
      />
    </div>
  );
};

const Glyph = ({ kind, size = 64, color = "terracotta" }: Props): JSX.Element => {
  switch (kind) {
    case "cube":
      return <Cube size={size} color={color} />;
    case "cone":
      return <Cone size={size} color={color} />;
    case "column":
      return <Column size={size} color={color} />;
    case "arch":
      return <ArchGlyph size={size} color={color} />;
    default:
      return <Sphere size={size} color={color} />;
  }
};

export default Glyph;
