interface Props {
  stars: number;
  size?: "sm" | "lg";
}

export function StarRow({ stars, size = "sm" }: Props) {
  const cls = size === "lg" ? "text-6xl" : "text-xl";
  return (
    <div className={`flex justify-center gap-1 ${cls}`} aria-label={`${stars} bintang`}>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`${n <= stars ? "" : "opacity-25 grayscale"} ${size === "lg" ? "animate-pop-in" : ""}`}
          style={size === "lg" ? { animationDelay: `${n * 200}ms` } : undefined}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}
