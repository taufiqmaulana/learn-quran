import type { Letter } from "./content";

export type FormPosition = "isolated" | "initial" | "medial" | "final";

/** Display order, right to left as the forms appear in a word. */
export const FORM_POSITIONS: FormPosition[] = ["isolated", "initial", "medial", "final"];

export const FORM_LABEL: Record<FormPosition, string> = {
  isolated: "Sendiri",
  initial: "Awal",
  medial: "Tengah",
  final: "Akhir",
};

/** Visible connecting stroke, as in printed Iqra books: ـبـ */
export const TATWEEL = "ـ";
/** Invisible joiner: forces the contextual shape without drawing a stroke. */
export const ZWJ = "‍";

/**
 * The shape a letter takes at a position in a word. Letters that never join
 * to the next letter (ا د ذ ر ز و ء) keep their isolated shape at the start
 * of a word and their final shape in the middle, which is what this returns.
 */
export function formOf(letter: Letter, position: FormPosition, joiner: string = TATWEEL): string {
  const joinsPrev = position === "medial" || position === "final";
  const joinsNext = letter.joinsLeft && (position === "initial" || position === "medial");
  return `${joinsPrev ? joiner : ""}${letter.char}${joinsNext ? joiner : ""}`;
}

/** Positions whose shape differs from the isolated letter, i.e. worth quizzing on. */
export function distinctForms(letter: Letter): FormPosition[] {
  return letter.joinsLeft ? ["initial", "medial", "final"] : ["final"];
}
