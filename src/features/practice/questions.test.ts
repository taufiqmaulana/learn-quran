import { describe, expect, it } from "vitest";
import { distinctForms } from "../../lib/arabic";
import { getLetter } from "../../lib/content";
import { buildQuestions } from "./questions";

// Small deterministic PRNG so failures are reproducible.
function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}

describe("buildQuestions", () => {
  const lesson = ["alif", "ba", "ta", "tsa", "jim"];

  it("asks about every lesson letter exactly once", () => {
    const qs = buildQuestions(lesson, ["listen-pick"], seeded(1));
    expect(qs.map((q) => q.answer).sort()).toEqual([...lesson].sort());
  });

  it("gives 3 distinct choices that include the answer", () => {
    for (let seed = 0; seed < 50; seed++) {
      for (const q of buildQuestions(lesson, ["listen-pick"], seeded(seed))) {
        expect(q.choices).toHaveLength(3);
        expect(new Set(q.choices).size).toBe(3);
        expect(q.choices).toContain(q.answer);
      }
    }
  });

  it("prefers distractors from the same lesson", () => {
    for (const q of buildQuestions(lesson, ["listen-pick"], seeded(7))) {
      for (const c of q.choices) expect(lesson).toContain(c);
    }
  });

  it("fills from the rest of the alphabet when the lesson is too small", () => {
    const qs = buildQuestions(["wau", "ya"], ["listen-pick"], seeded(3));
    for (const q of qs) {
      expect(q.choices).toHaveLength(3);
      expect(new Set(q.choices).size).toBe(3);
    }
  });

  it("rotates game types so a two-game lesson gets a mix", () => {
    const qs = buildQuestions(lesson, ["form-match", "see-pick"], seeded(5));
    const counts = { "form-match": 0, "see-pick": 0 } as Record<string, number>;
    for (const q of qs) counts[q.kind]++;
    expect(Math.abs(counts["form-match"] - counts["see-pick"])).toBeLessThanOrEqual(1);
  });

  it("asks form-match only about shapes that differ from the plain letter", () => {
    for (let seed = 0; seed < 50; seed++) {
      for (const q of buildQuestions(["alif", "ba", "dal", "ha", "ya"], ["form-match"], seeded(seed))) {
        expect(distinctForms(getLetter(q.answer))).toContain(q.form);
      }
    }
  });

  it("gives see-pick a shape and listen-pick none", () => {
    expect(buildQuestions(lesson, ["see-pick"], seeded(2)).every((q) => q.form)).toBe(true);
    expect(buildQuestions(lesson, ["listen-pick"], seeded(2)).every((q) => q.form === undefined)).toBe(true);
  });
});
