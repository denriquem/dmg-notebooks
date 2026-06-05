export const relTime = (iso: string): string => {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const secs = Math.floor((Date.now() - then) / 1000);
  if (secs < 45) return "JUST NOW";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} MINUTE${mins === 1 ? "" : "S"} AGO`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} HOUR${hours === 1 ? "" : "S"} AGO`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "YESTERDAY";
  if (days < 7) return `${days} DAYS AGO`;
  return new Date(iso)
    .toLocaleDateString(undefined, { month: "short", day: "numeric" })
    .toUpperCase();
};
