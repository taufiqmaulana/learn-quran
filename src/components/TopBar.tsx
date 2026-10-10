import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { stop } from "../lib/audio";

interface Props {
  backTo?: string;
  children?: ReactNode;
}

export function TopBar({ backTo = "/", children }: Props) {
  const navigate = useNavigate();
  return (
    <header className="flex items-center gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <button
        className="btn bg-white !px-0 !text-ink"
        aria-label="Kembali"
        onClick={() => {
          stop();
          navigate(backTo);
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <div className="flex-1">{children}</div>
    </header>
  );
}

export function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-label={`${current + 1} dari ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-3 rounded-full transition-all ${
            i === current ? "w-8 bg-leaf" : i < current ? "w-3 bg-leaf/60" : "w-3 bg-stone"
          }`}
        />
      ))}
    </div>
  );
}
