import { useEffect, useState } from "react";

/** Seconds-left countdown for "Resend in 0:29" buttons. Returns [secondsLeft, start(seconds)]. */
export function useCooldown(initial = 0) {
  const [left, setLeft] = useState(initial);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return [left, setLeft];
}

export const fmtCooldown = (s) => `0:${String(s).padStart(2, "0")}`;
