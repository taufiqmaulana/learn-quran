import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import manifest from "../data/audio-manifest.json";
import { allLessons, audioId, letters } from "./content";

describe("content", () => {
  it("has all 29 hijaiyah letters with unique ids and chars", () => {
    expect(letters).toHaveLength(29);
    expect(new Set(letters.map((l) => l.id)).size).toBe(29);
    expect(new Set(letters.map((l) => l.char)).size).toBe(29);
  });

  it("Jilid 1 lessons cover every letter exactly once, in alphabet order", () => {
    const covered = allLessons.filter((l) => l.jilid === 1).flatMap((l) => l.items);
    expect(covered).toEqual(letters.map((l) => l.id));
  });

  it("Jilid 2 lessons cover every letter except hamzah, as forms cards", () => {
    const j2 = allLessons.filter((l) => l.jilid === 2);
    expect(j2.every((l) => l.card === "forms")).toBe(true);
    expect(j2.flatMap((l) => l.items)).toEqual(letters.map((l) => l.id).filter((id) => id !== "hamzah"));
  });

  it("has unique lesson ids", () => {
    expect(new Set(allLessons.map((l) => l.id)).size).toBe(allLessons.length);
  });

  it("has name and sound audio for every letter", () => {
    const ids = new Set(manifest.map((e) => e.id));
    for (const l of letters) {
      expect(ids).toContain(audioId.letterName(l.id));
      expect(ids).toContain(audioId.letterSound(l.id));
    }
  });

  it("points every recorded entry at a file that exists in public/", () => {
    for (const e of manifest) {
      if (e.src) expect(existsSync(`public/${e.src}`), e.src).toBe(true);
    }
  });

  it("marks entries as placeholder exactly when no recording exists", () => {
    for (const e of manifest) {
      expect(e.placeholder).toBe(e.src === null);
      if (e.placeholder) expect(e.tts).toBeTruthy();
    }
  });
});
