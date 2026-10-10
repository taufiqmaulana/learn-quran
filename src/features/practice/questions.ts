import { distinctForms, FORM_POSITIONS, type FormPosition } from "../../lib/arabic";
import { getLetter, letters as allLetters, type LetterId, type PracticeKind } from "../../lib/content";

/** Game types that can be generated from a list of letters. */
export type LetterGame = Extract<PracticeKind, "listen-pick" | "form-match" | "see-pick">;

export interface Question {
  kind: LetterGame;
  answer: LetterId;
  /** Choices in display order; includes the answer. */
  choices: LetterId[];
  /** Which shape of the answer letter to show (form-match, see-pick). */
  form?: FormPosition;
}

export type Rng = () => number;

function shuffle<T>(items: T[], rng: Rng): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickOne<T>(items: T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
}

/** Distractors come from the same lesson first, then from the rest of the alphabet. */
function choicesFor(answer: LetterId, lessonLetters: LetterId[], rng: Rng, count: number): LetterId[] {
  const sameLesson = shuffle(lessonLetters.filter((id) => id !== answer), rng);
  const others = shuffle(
    allLetters.map((l) => l.id).filter((id) => id !== answer && !lessonLetters.includes(id)),
    rng,
  );
  return shuffle([answer, ...[...sameLesson, ...others].slice(0, count - 1)], rng);
}

function formFor(kind: LetterGame, answer: LetterId, rng: Rng): FormPosition | undefined {
  // Matching only makes sense for shapes that differ from the plain letter;
  // for listening, any shape (including the plain letter) is fair game.
  if (kind === "form-match") return pickOne(distinctForms(getLetter(answer)), rng);
  if (kind === "see-pick") return pickOne(FORM_POSITIONS, rng);
  return undefined;
}

/**
 * One question per lesson letter, in random order. Game types rotate through
 * `kinds`, so a lesson with two kinds gets a roughly even mix.
 */
export function buildQuestions(
  lessonLetters: LetterId[],
  kinds: LetterGame[],
  rng: Rng = Math.random,
  choiceCount = 3,
): Question[] {
  const startAt = Math.floor(rng() * kinds.length);
  return shuffle(lessonLetters, rng).map((answer, i) => {
    const kind = kinds[(startAt + i) % kinds.length];
    return {
      kind,
      answer,
      choices: choicesFor(answer, lessonLetters, rng, choiceCount),
      form: formFor(kind, answer, rng),
    };
  });
}
