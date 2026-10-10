import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { del, get, set } from "idb-keyval";
import type { Lesson } from "./content";

export type Stars = 0 | 1 | 2 | 3;

export interface LessonProgress {
  stars: Stars;
  completedAt?: string;
}

export interface Settings {
  autoplay: boolean;
  rate: number;
}

interface ProgressState {
  lessons: Record<string, LessonProgress>;
  settings: Settings;
  completeLesson: (lessonId: string, stars: Stars) => void;
  setSettings: (s: Partial<Settings>) => void;
}

/** 0 mistakes → 3 stars, 1–2 → 2 stars, more → 1 star. Finishing always earns a star. */
export function starsFor(mistakes: number): Stars {
  if (mistakes === 0) return 3;
  if (mistakes <= 2) return 2;
  return 1;
}

/** A lesson is open if it is the first one or the one before it is completed. */
export function isUnlocked(
  lessons: Lesson[],
  progress: Record<string, LessonProgress>,
  lessonId: string,
): boolean {
  const i = lessons.findIndex((l) => l.id === lessonId);
  if (i < 0) return false;
  if (i === 0) return true;
  return (progress[lessons[i - 1].id]?.stars ?? 0) > 0;
}

/** The first lesson not yet completed, i.e. where the mascot points. */
export function nextLessonId(
  lessons: Lesson[],
  progress: Record<string, LessonProgress>,
): string | undefined {
  return lessons.find((l) => !(progress[l.id]?.stars > 0))?.id;
}

// IndexedDB with an in-memory fallback (private mode, blocked storage, tests).
const memory = new Map<string, string>();
const idbStorage: StateStorage = {
  getItem: async (name) => {
    try {
      return (await get<string>(name)) ?? memory.get(name) ?? null;
    } catch {
      return memory.get(name) ?? null;
    }
  },
  setItem: async (name, value) => {
    memory.set(name, value);
    try {
      await set(name, value);
    } catch {
      /* keep in memory only */
    }
  },
  removeItem: async (name) => {
    memory.delete(name);
    try {
      await del(name);
    } catch {
      /* ignore */
    }
  },
};

export const useProgress = create<ProgressState>()(
  persist(
    (setState) => ({
      lessons: {},
      settings: { autoplay: true, rate: 1 },
      completeLesson: (lessonId, stars) =>
        setState((s) => {
          const prev = s.lessons[lessonId]?.stars ?? 0;
          return {
            lessons: {
              ...s.lessons,
              [lessonId]: {
                stars: Math.max(prev, stars) as Stars,
                completedAt: new Date().toISOString(),
              },
            },
          };
        }),
      setSettings: (patch) => setState((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    {
      name: "belajar-mengaji/progress",
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      partialize: (s) => ({ lessons: s.lessons, settings: s.settings }),
    },
  ),
);
