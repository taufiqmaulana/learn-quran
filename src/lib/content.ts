import lettersJson from "../data/letters.json";
import jilid1 from "../data/lessons/jilid-1.json";
import jilid2 from "../data/lessons/jilid-2.json";

export type LetterId = string;

export interface Letter {
  id: LetterId;
  char: string;
  name: string;
  translit: string;
  joinsLeft: boolean;
  /** Vocalised sound shown with the letter, e.g. "بَ". */
  sound: string;
}

export type PracticeKind = "listen-pick" | "form-match" | "see-pick" | "build-word";

/** How lesson cards present each letter: alone (Jilid 1) or in its four forms (Jilid 2). */
export type CardKind = "letter" | "forms";

export interface Lesson {
  id: string;
  jilid: number;
  title: string;
  /** Letter IDs (Jilid 1–2). Later jilid will reference Item IDs. */
  items: LetterId[];
  card?: CardKind;
  practice: PracticeKind[];
}

export interface Jilid {
  number: number;
  title: string;
  lessons: Lesson[];
}

export const letters: Letter[] = lettersJson;
const lettersById = new Map(letters.map((l) => [l.id, l]));

export function getLetter(id: LetterId): Letter {
  const letter = lettersById.get(id);
  if (!letter) throw new Error(`Unknown letter: ${id}`);
  return letter;
}

export const jilids: Jilid[] = [
  { number: 1, title: "Huruf Hijaiyah", lessons: jilid1 as Lesson[] },
  { number: 2, title: "Bentuk Huruf", lessons: jilid2 as Lesson[] },
  { number: 3, title: "Harakat", lessons: [] },
  { number: 4, title: "Tanwin", lessons: [] },
  { number: 5, title: "Sukun", lessons: [] },
  { number: 6, title: "Tasydid", lessons: [] },
  { number: 7, title: "Mad", lessons: [] },
  { number: 8, title: "Kata dalam Al-Qur'an", lessons: [] },
  { number: 9, title: "Surah Pendek", lessons: [] },
];

/** All lessons in learning order. */
export const allLessons: Lesson[] = jilids.flatMap((j) => j.lessons);

export function getLesson(id: string): Lesson | undefined {
  return allLessons.find((l) => l.id === id);
}

export const audioId = {
  letterName: (id: LetterId) => `letter.${id}.name`,
  letterSound: (id: LetterId) => `letter.${id}.sound`,
};
