import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Confetti } from "../../components/Confetti";
import { Mascot } from "../../components/Mascot";
import { StarRow } from "../../components/StarRow";
import { ProgressDots, TopBar } from "../../components/TopBar";
import { FORM_LABEL, formOf } from "../../lib/arabic";
import { allLessons, audioId, getLesson, getLetter, type Lesson, type LetterId } from "../../lib/content";
import { play, sfxCorrect, sfxTryAgain, stop } from "../../lib/audio";
import { isUnlocked, starsFor, useProgress } from "../../lib/progress";
import { buildQuestions, type LetterGame, type Question } from "./questions";

const LETTER_GAMES: LetterGame[] = ["listen-pick", "form-match", "see-pick"];

export function PracticePage() {
  const { id = "" } = useParams();
  const lesson = getLesson(id);
  const progress = useProgress((s) => s.lessons);
  const [attempt, setAttempt] = useState(0);
  if (!lesson || !isUnlocked(allLessons, progress, lesson.id)) return <Navigate to="/" replace />;
  return <Game key={`${lesson.id}-${attempt}`} lesson={lesson} onRetry={() => setAttempt((a) => a + 1)} />;
}

type Status = "asking" | "retry" | "correct" | "done";

const ASK: Record<LetterGame, string> = {
  "listen-pick": "Huruf mana ini?",
  "form-match": "Ini huruf apa?",
  "see-pick": "Bunyinya yang mana?",
};

function Game({ lesson, onRetry }: { lesson: Lesson; onRetry: () => void }) {
  const rate = useProgress((s) => s.settings.rate);
  const completeLesson = useProgress((s) => s.completeLesson);
  const [questions] = useState(() => {
    const kinds = lesson.practice.filter((k): k is LetterGame => LETTER_GAMES.includes(k as LetterGame));
    return buildQuestions(lesson.items, kinds.length ? kinds : ["listen-pick"]);
  });
  const [qIndex, setQIndex] = useState(0);
  const [status, setStatus] = useState<Status>("asking");
  const [mistakes, setMistakes] = useState(0);
  const [missedThis, setMissedThis] = useState(false);
  const [wobble, setWobble] = useState<{ id: LetterId; n: number } | null>(null);
  /** see-pick: the sound the kid has listened to and may confirm. */
  const [selected, setSelected] = useState<LetterId | null>(null);
  const [confetti, setConfetti] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  // Bumped on every pick and on unmount, so pending follow-up audio can tell it is stale.
  const pickSeq = useRef(0);

  const q = questions[Math.min(qIndex, questions.length - 1)];
  const playLetter = (id: LetterId) => play([audioId.letterSound(id)], { rate });
  const playAnswer = () => void playLetter(q.answer);

  useEffect(() => {
    if (status !== "done" && q.kind === "listen-pick") playAnswer();
    // Ask each new question once; replay is on the "Dengar lagi" button.
  }, [qIndex]);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      pickSeq.current++;
      stop();
    },
    [],
  );

  const stars = starsFor(mistakes);
  useEffect(() => {
    if (status === "done") completeLesson(lesson.id, stars);
  }, [status]);

  const pick = async (choice: LetterId) => {
    if (status === "correct" || status === "done") return;
    const seq = ++pickSeq.current;
    if (choice === q.answer) {
      stop();
      setStatus("correct");
      setConfetti((c) => c + 1);
      // Matching a shape: say the letter, so the shape gets tied to its sound.
      const sayIt = q.kind === "form-match";
      timer.current = window.setTimeout(() => {
        if (qIndex + 1 >= questions.length) {
          setStatus("done");
        } else {
          setQIndex(qIndex + 1);
          setMissedThis(false);
          setSelected(null);
          setStatus("asking");
        }
      }, sayIt ? 1900 : 1300);
      await sfxCorrect();
      if (sayIt && seq === pickSeq.current) playAnswer();
      return;
    }
    // Wrong: count at most one mistake per question, then show and replay the answer.
    if (!missedThis) {
      setMistakes((m) => m + 1);
      setMissedThis(true);
    }
    setStatus("retry");
    setSelected(null);
    setWobble((w) => ({ id: choice, n: (w?.n ?? 0) + 1 }));
    stop();
    await sfxTryAgain();
    if (seq === pickSeq.current) playAnswer();
  };

  const listenTo = (choice: LetterId) => {
    if (status === "correct") return;
    pickSeq.current++; // a pending "coba lagi" replay must not talk over this
    setSelected(choice);
    void playLetter(choice);
  };

  if (status === "done") {
    return <Results lesson={lesson} stars={stars} onRetry={onRetry} />;
  }

  const says = status === "correct" ? "Benar! 🎉" : status === "retry" ? "Coba lagi, ya!" : ASK[q.kind];
  const tileState = (id: LetterId) => {
    const isAnswer = id === q.answer;
    const wobbling = wobble?.id === id && !isAnswer;
    let cls = "border-stone";
    if (isAnswer && status === "correct") cls = "border-leaf-dark !bg-leaf text-white animate-bounce-once";
    else if (isAnswer && status === "retry") cls = "border-leaf animate-glow";
    return { cls: `${cls} ${wobbling ? "animate-wobble" : ""}`, key: `${qIndex}-${id}-${wobbling ? wobble.n : 0}` };
  };

  return (
    <main className="mx-auto flex h-full max-w-md flex-col">
      {confetti > 0 && status === "correct" && <Confetti key={confetti} pieces={24} />}
      <TopBar backTo="/">
        <ProgressDots total={questions.length} current={qIndex} />
      </TopBar>

      <section className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
        <Mascot size={80} says={says} />

        {q.kind === "listen-pick" ? (
          <button className="btn bg-sky !text-2xl" onClick={playAnswer} aria-label="Dengar lagi">
            <span aria-hidden="true">🔊</span> Dengar lagi
          </button>
        ) : (
          <ShapePrompt q={q} />
        )}

        {q.kind === "see-pick" ? (
          <>
            <div className="grid w-full grid-cols-3 gap-3">
              {q.choices.map((id, i) => {
                const t = tileState(id);
                const isSelected = selected === id;
                return (
                  <button
                    key={t.key}
                    className={`tile flex aspect-square flex-col items-center justify-center gap-1 rounded-3xl border-b-8 bg-white shadow-md transition-colors ${t.cls} ${
                      isSelected ? "ring-4 ring-sun ring-offset-2 ring-offset-cream" : ""
                    }`}
                    onClick={() => listenTo(id)}
                    aria-label={`Bunyi ${i + 1}`}
                    aria-pressed={isSelected}
                  >
                    <span className="text-5xl" aria-hidden="true">🔊</span>
                    <span className="text-xl font-black">{i + 1}</span>
                  </button>
                );
              })}
            </div>
            <button
              className="btn w-full bg-leaf"
              disabled={!selected || status === "correct"}
              onClick={() => selected && void pick(selected)}
            >
              ✓ Pilih
            </button>
          </>
        ) : (
          <div className="grid w-full grid-cols-3 gap-3" dir="rtl">
            {q.choices.map((id) => {
              const t = tileState(id);
              const letter = getLetter(id);
              return (
                <button
                  key={t.key}
                  className={`tile flex aspect-square items-center justify-center rounded-3xl border-b-8 bg-white shadow-md transition-colors ${t.cls}`}
                  onClick={() => void pick(id)}
                  aria-label={`Huruf ${letter.name}`}
                >
                  <span className="arabic text-7xl leading-none" lang="ar">
                    {letter.char}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>
      <div className="pb-[max(1.5rem,env(safe-area-inset-bottom))]" />
    </main>
  );
}

/** The letter shape being asked about, with a chip saying where in a word it sits. */
function ShapePrompt({ q }: { q: Question }) {
  const letter = getLetter(q.answer);
  const form = q.form ?? "isolated";
  return (
    <div className="flex w-44 flex-col items-center rounded-[2rem] bg-white pb-3 shadow-lg animate-pop-in" key={`${q.answer}-${form}`}>
      <span className="arabic -translate-y-[6%] text-8xl text-ink" dir="rtl" lang="ar">
        {formOf(letter, form)}
      </span>
      <span className="rounded-full bg-sand px-3 py-0.5 text-sm font-extrabold text-ink-soft">{FORM_LABEL[form]}</span>
    </div>
  );
}

function Results({ lesson, stars, onRetry }: { lesson: Lesson; stars: number; onRetry: () => void }) {
  const navigate = useNavigate();
  const message = stars === 3 ? "Sempurna!" : stars === 2 ? "Hebat!" : "Bagus, terus berlatih!";
  return (
    <main className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
      <Confetti pieces={60} />
      <Mascot size={150} />
      <h1 className="text-4xl font-black text-leaf-dark animate-pop-in">{message}</h1>
      <StarRow stars={stars} size="lg" />
      <p className="arabic text-5xl" dir="rtl" lang="ar">
        {lesson.items.map((id) => getLetter(id).char).join(" ")}
      </p>
      <div className="flex w-full flex-col gap-3">
        <button className="btn bg-leaf" onClick={() => navigate("/")}>
          🗺️ Ke Peta
        </button>
        <button className="btn bg-white !text-ink" onClick={onRetry}>
          🔁 Latihan lagi
        </button>
        <button
          className="btn bg-white !text-ink"
          onClick={() => navigate(`/jilid/${lesson.jilid}/lesson/${lesson.id}`)}
        >
          📖 Belajar lagi
        </button>
      </div>
    </main>
  );
}
