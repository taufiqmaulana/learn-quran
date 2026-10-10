import { useEffect, useRef, useState, type ReactNode } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ProgressDots, TopBar } from "../../components/TopBar";
import { FORM_LABEL, FORM_POSITIONS, formOf, type FormPosition } from "../../lib/arabic";
import { audioId, getLesson, getLetter, allLessons } from "../../lib/content";
import { play, stop } from "../../lib/audio";
import { isUnlocked, useProgress } from "../../lib/progress";

type Clip = "name" | "sound";

export function LessonPlayer() {
  const { id = "" } = useParams();
  const lesson = getLesson(id);
  const progress = useProgress((s) => s.lessons);
  if (!lesson || !isUnlocked(allLessons, progress, lesson.id)) return <Navigate to="/" replace />;
  return <Player key={lesson.id} lessonId={lesson.id} />;
}

function Player({ lessonId }: { lessonId: string }) {
  const lesson = getLesson(lessonId)!;
  const navigate = useNavigate();
  const { autoplay, rate } = useProgress((s) => s.settings);
  const [index, setIndex] = useState(0);
  const [active, setActive] = useState<Clip | null>(null);
  const [activeForm, setActiveForm] = useState<FormPosition | null>(null);
  const [bounce, setBounce] = useState(0);
  const letter = getLetter(lesson.items[index]);
  const isLast = index === lesson.items.length - 1;
  const showForms = lesson.card === "forms";

  const playClips = (clips: Clip[], form: FormPosition | null = null) => {
    if (!form) setBounce((b) => b + 1);
    setActiveForm(form);
    const ids = clips.map((c) => (c === "name" ? audioId.letterName(letter.id) : audioId.letterSound(letter.id)));
    void play(ids, { rate, onStart: (i) => setActive(clips[i]) }).then((done) => {
      if (!done) return;
      setActive(null);
      setActiveForm(null);
    });
  };

  useEffect(() => {
    if (autoplay) playClips(["name", "sound"]);
    return () => {
      stop();
      setActive(null);
      setActiveForm(null);
    };
    // Replay only when the card changes.
  }, [index]);

  const go = (delta: number) => {
    const next = index + delta;
    if (next < 0) return;
    if (next >= lesson.items.length) {
      navigate(`/latihan/${lesson.id}`);
      return;
    }
    setIndex(next);
  };

  // Swipe: finger moves left → next card, right → previous card.
  const swipeStart = useRef<number | null>(null);

  return (
    <main
      className="mx-auto flex h-full max-w-md flex-col select-none"
      onPointerDown={(e) => (swipeStart.current = e.clientX)}
      onPointerUp={(e) => {
        if (swipeStart.current === null) return;
        const dx = e.clientX - swipeStart.current;
        swipeStart.current = null;
        if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
      }}
    >
      <TopBar>
        <ProgressDots total={lesson.items.length} current={index} />
      </TopBar>

      <section className={`flex flex-1 flex-col items-center justify-center px-4 ${showForms ? "gap-4" : "gap-6"}`}>
        <button
          key={`${letter.id}-${bounce}`}
          className={`tile flex aspect-square w-full items-center justify-center bg-white shadow-lg animate-bounce-once ${
            showForms ? "max-w-[min(11rem,24vh)] rounded-[2rem]" : "max-w-xs rounded-[2.5rem]"
          }`}
          onClick={() => playClips(["name", "sound"])}
          aria-label={`Huruf ${letter.name}. Ketuk untuk mendengar.`}
        >
          <span
            className={`arabic -translate-y-[8%] text-ink ${showForms ? "text-[min(15vh,6rem)]" : "text-[min(28vh,10rem)]"}`}
            dir="rtl"
            lang="ar"
          >
            {letter.char}
          </span>
        </button>

        <p className="text-4xl font-black">{letter.name}</p>

        {showForms && (
          <div className="grid w-full grid-cols-4 gap-2" dir="rtl">
            {FORM_POSITIONS.map((pos) => (
              <button
                key={pos}
                className={`tile flex flex-col items-center rounded-2xl border-b-4 bg-white pb-1 pt-0 shadow-sm transition-colors ${
                  activeForm === pos ? "border-sun-dark !bg-sun text-white" : "border-stone"
                }`}
                onClick={() => playClips(["sound"], pos)}
                aria-label={`${letter.name} di ${FORM_LABEL[pos].toLowerCase()}`}
              >
                <span className="arabic text-[min(7vh,3rem)]" lang="ar">
                  {formOf(letter, pos)}
                </span>
                <span className="text-sm font-extrabold">{FORM_LABEL[pos]}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex w-full max-w-xs gap-3">
          <ClipButton label="Nama" active={active === "name"} color="bg-sky" onClick={() => playClips(["name"])} />
          <ClipButton
            label="Bunyi"
            active={active === "sound"}
            color="bg-berry"
            onClick={() => playClips(["sound"])}
            extra={
              <span className="arabic text-3xl" dir="rtl" lang="ar">
                {letter.sound}
              </span>
            }
          />
        </div>
      </section>

      <nav className="flex gap-3 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
        <button className="btn bg-white !px-0 !text-ink" onClick={() => go(-1)} disabled={index === 0} aria-label="Sebelumnya">
          ◀
        </button>
        <button className={`btn flex-1 ${isLast ? "bg-sun" : "bg-leaf"}`} onClick={() => go(1)}>
          {isLast ? "Ayo Latihan! ▶" : "Lanjut ▶"}
        </button>
      </nav>
    </main>
  );
}

interface ClipButtonProps {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
  extra?: ReactNode;
}

function ClipButton({ label, active, color, onClick, extra }: ClipButtonProps) {
  return (
    <button
      className={`btn flex-1 ${color} ${active ? "ring-4 ring-sun ring-offset-2 ring-offset-cream" : ""}`}
      onClick={onClick}
      aria-label={`Dengar ${label.toLowerCase()}`}
    >
      <span aria-hidden="true">🔊</span>
      {label}
      {extra}
    </button>
  );
}
