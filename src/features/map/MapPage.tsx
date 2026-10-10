import { useNavigate } from "react-router-dom";
import { Mascot } from "../../components/Mascot";
import { StarRow } from "../../components/StarRow";
import { formOf } from "../../lib/arabic";
import { allLessons, getLetter, jilids, type Lesson } from "../../lib/content";
import { isUnlocked, nextLessonId, useProgress } from "../../lib/progress";

// Horizontal offsets that make the lessons wind like a path.
const ZIGZAG = ["0%", "-28%", "0%", "28%"];

export function MapPage() {
  const progress = useProgress((s) => s.lessons);
  const next = nextLessonId(allLessons, progress);
  const allDone = next === undefined;

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col px-4 pb-16 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="mb-6 flex flex-col items-center gap-1 text-center">
        <h1 className="text-3xl font-black leading-tight text-leaf-dark">
          Belajar Mengaji <span className="block text-xl text-sun-dark">Bersama Zayn &amp; Zahra</span>
        </h1>
        <Mascot size={84} says={allDone ? "Hebat! Semua selesai!" : "Ayo belajar!"} />
      </header>

      {jilids.map((jilid) => (
        <section key={jilid.number} className="mb-8">
          <h2 className="mb-4 flex items-center gap-3 rounded-2xl bg-sand px-4 py-3 text-lg font-extrabold">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sun text-white">
              {jilid.number}
            </span>
            <span>
              Jilid {jilid.number}
              <span className="block text-sm font-bold text-ink-soft">{jilid.title}</span>
            </span>
            {jilid.lessons.length === 0 && <span className="ml-auto text-2xl" aria-label="Segera hadir">🔒</span>}
          </h2>

          {jilid.lessons.length === 0 ? (
            <p className="text-center font-bold text-ink-soft">Segera hadir</p>
          ) : (
            <ol className="flex flex-col items-center gap-6">
              {jilid.lessons.map((lesson, i) => (
                <LessonNode
                  key={lesson.id}
                  lesson={lesson}
                  offset={ZIGZAG[i % ZIGZAG.length]}
                  unlocked={isUnlocked(allLessons, progress, lesson.id)}
                  stars={progress[lesson.id]?.stars ?? 0}
                  isNext={lesson.id === next}
                />
              ))}
            </ol>
          )}
        </section>
      ))}
    </main>
  );
}

interface NodeProps {
  lesson: Lesson;
  offset: string;
  unlocked: boolean;
  stars: number;
  isNext: boolean;
}

function LessonNode({ lesson, offset, unlocked, stars, isNext }: NodeProps) {
  const navigate = useNavigate();
  const first = getLetter(lesson.items[0]);
  const last = getLetter(lesson.items[lesson.items.length - 1]);
  // Forms lessons show a joined shape (e.g. ـبـ) so they read differently from Jilid 1.
  const joiner = lesson.items.map(getLetter).find((l) => l.joinsLeft) ?? first;
  const glyph = lesson.card === "forms" ? formOf(joiner, "medial") : first.char;

  return (
    <li className="relative flex flex-col items-center" style={{ transform: `translateX(${offset})` }}>
      {isNext && (
        <Mascot size={60} named={false} className="pointer-events-none absolute w-max -top-3 right-full mr-1" />
      )}
      <button
        className={`tile flex h-24 w-24 items-center justify-center rounded-full border-b-8 text-white shadow-md transition-transform active:translate-y-1 ${
          unlocked
            ? isNext
              ? "animate-glow border-leaf-dark bg-leaf"
              : "border-sun-dark bg-sun"
            : "border-stone bg-stone/70"
        }`}
        disabled={!unlocked}
        onClick={() => navigate(`/jilid/${lesson.jilid}/lesson/${lesson.id}`)}
        aria-label={`Pelajaran ${lesson.title}${unlocked ? "" : ", terkunci"}`}
      >
        {unlocked ? (
          <span className="arabic text-5xl leading-none" dir="rtl" lang="ar">
            {glyph}
          </span>
        ) : (
          <span className="text-3xl">🔒</span>
        )}
      </button>
      <span className="mt-1 text-sm font-bold text-ink-soft">
        {first.name} – {last.name}
      </span>
      {stars > 0 && <StarRow stars={stars} />}
    </li>
  );
}
