import { useAudioStatus } from "../lib/audio";

/** Dev-only marker that the sound just played is not a real recording. */
export function PlaceholderBadge() {
  const show = useAudioStatus((s) => s.placeholder && s.playing);
  if (!import.meta.env.DEV || !show) return null;
  return (
    <div className="pointer-events-none fixed right-2 top-[calc(max(1rem,env(safe-area-inset-top))+76px)] z-40 rounded-full bg-ink/80 px-3 py-1 text-xs font-bold text-white">
      🔇 audio sementara
    </div>
  );
}
