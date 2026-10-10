import { useMemo } from "react";

const COLORS = ["#f5a524", "#2f9e76", "#4f8fe8", "#e5577a", "#a78bfa"];

/** A one-shot burst of falling confetti. Remount (via `key`) to replay. */
export function Confetti({ pieces = 40 }: { pieces?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        left: Math.random() * 100,
        dx: `${(Math.random() - 0.5) * 30}vw`,
        rot: `${Math.random() * 720 - 360}deg`,
        delay: Math.random() * 300,
        duration: 1400 + Math.random() * 900,
        color: COLORS[i % COLORS.length],
        round: Math.random() > 0.5,
      })),
    [pieces],
  );
  return (
    <div className="confetti pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {bits.map((b, i) => (
        <span
          key={i}
          className="absolute top-0 block h-3 w-2"
          style={{
            left: `${b.left}%`,
            background: b.color,
            borderRadius: b.round ? "999px" : "2px",
            animation: `confetti-fall ${b.duration}ms ${b.delay}ms ease-in forwards`,
            ["--dx" as string]: b.dx,
            ["--rot" as string]: b.rot,
          }}
        />
      ))}
    </div>
  );
}
