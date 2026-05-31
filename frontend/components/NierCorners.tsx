interface NierCornersProps {
  accent?: string;
  size?: number;
}

export function NierCorners({ accent = "#c8a84b", size = 10 }: NierCornersProps) {
  const s = { position: "absolute" as const };
  const b = `1px solid ${accent}`;
  return (
    <>
      <div style={{ ...s, top: -1, left: -1, width: size, height: size, borderTop: b, borderLeft: b }} />
      <div style={{ ...s, top: -1, right: -1, width: size, height: size, borderTop: b, borderRight: b }} />
      <div style={{ ...s, bottom: -1, left: -1, width: size, height: size, borderBottom: b, borderLeft: b }} />
      <div style={{ ...s, bottom: -1, right: -1, width: size, height: size, borderBottom: b, borderRight: b }} />
    </>
  );
}
