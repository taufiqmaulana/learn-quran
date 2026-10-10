import { describe, expect, it } from "vitest";
import "fake-indexeddb/auto";
import { allLessons } from "./content";
import { isUnlocked, nextLessonId, starsFor, useProgress } from "./progress";

describe("starsFor", () => {
  it("rewards fewer mistakes with more stars, never zero", () => {
    expect(starsFor(0)).toBe(3);
    expect(starsFor(1)).toBe(2);
    expect(starsFor(2)).toBe(2);
    expect(starsFor(3)).toBe(1);
    expect(starsFor(50)).toBe(1);
  });
});

describe("unlocking", () => {
  const [l1, l2, l3] = allLessons;

  it("opens only the first lesson at the start", () => {
    expect(isUnlocked(allLessons, {}, l1.id)).toBe(true);
    expect(isUnlocked(allLessons, {}, l2.id)).toBe(false);
    expect(nextLessonId(allLessons, {})).toBe(l1.id);
  });

  it("opens the next lesson once the previous one has stars", () => {
    const p = { [l1.id]: { stars: 1 as const } };
    expect(isUnlocked(allLessons, p, l2.id)).toBe(true);
    expect(isUnlocked(allLessons, p, l3.id)).toBe(false);
    expect(nextLessonId(allLessons, p)).toBe(l2.id);
  });

  it("rejects unknown lessons", () => {
    expect(isUnlocked(allLessons, {}, "nope")).toBe(false);
  });
});

describe("useProgress", () => {
  it("keeps the best star count when a lesson is replayed", () => {
    const { completeLesson } = useProgress.getState();
    completeLesson("j1-l1", 3);
    completeLesson("j1-l1", 1);
    expect(useProgress.getState().lessons["j1-l1"].stars).toBe(3);
  });
});
