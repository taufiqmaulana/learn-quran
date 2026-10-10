# Belajar Mengaji Bersama Zayn & Zahra — Design

A web app that teaches kids to read the Arabic Qur'an, from single letters (huruf hijaiyah) up to whole Qur'anic words. The app shows a letter and plays how it sounds.

## 1. Decisions

| Topic | Decision |
|---|---|
| Audience | Kids, about 5–10 years old. Assume they can't yet read Indonesian well. |
| UI language | Bahasa Indonesia only. Indonesian transliteration (Tsa, Kho, Syin, Shod…). |
| Audio | Placeholder audio for now. Real recordings by a qari/ustadz replace it later without code changes. |
| Platform | Static, offline-first PWA. No backend, no accounts. |
| Framework | Vite + React + TypeScript. |

## 2. Curriculum

The order follows the Iqra' method, which is familiar in Indonesian TPA/TPQ.

| Jilid | Topic | Examples |
|---|---|---|
| 1 | Huruf hijaiyah: names and sounds (with fathah) | ا ب ت ث |
| 2 | Letter forms: isolated, initial, medial, final | بـ ـبـ ـب |
| 3 | Harakat: fathah, kasrah, dhammah | بَ بِ بُ |
| 4 | Tanwin | بً بٍ بٌ |
| 5 | Sukun, two-letter syllables | أَبْ ، اِبْ |
| 6 | Tasydid | رَبِّ |
| 7 | Mad (long vowels) with ا و ي | بَا بِي بُو |
| 8 | Qur'anic words | بِسْمِ ، ٱللَّهِ ، ٱلرَّحْمَٰنِ |
| 9 | Short surahs, word by word | Al-Fatihah, then An-Nas, Al-Falaq, Al-Ikhlas… |

- Each jilid has 3–6 short lessons of about 5–8 items each, kept short to fit kids' attention spans.
- A lesson unlocks when the previous lesson is finished. Once unlocked, a lesson stays open, and kids can replay any lesson.

### Letter set (Jilid 1)

| # | Huruf | Nama | # | Huruf | Nama |
|---|---|---|---|---|---|
| 1 | ا | Alif | 16 | ط | Tho |
| 2 | ب | Ba | 17 | ظ | Zho |
| 3 | ت | Ta | 18 | ع | 'Ain |
| 4 | ث | Tsa | 19 | غ | Ghoin |
| 5 | ج | Jim | 20 | ف | Fa |
| 6 | ح | Ha (ḥ) | 21 | ق | Qof |
| 7 | خ | Kho | 22 | ك | Kaf |
| 8 | د | Dal | 23 | ل | Lam |
| 9 | ذ | Dzal | 24 | م | Mim |
| 10 | ر | Ro | 25 | ن | Nun |
| 11 | ز | Zai | 26 | و | Wau |
| 12 | س | Sin | 27 | ه | Ha (h) |
| 13 | ش | Syin | 28 | ء | Hamzah |
| 14 | ص | Shod | 29 | ي | Ya |
| 15 | ض | Dhod | | | |

Each letter has two clips: its **name** ("Ba") and its **sound** ("ba", as بَ). Later jilid add clips for the other harakat, tanwin, and mad.

## 3. Screens

### 3.1 Peta Belajar (home / path map)
- A winding path of lesson "islands" grouped by jilid, with stars earned shown on each lesson.
- A mascot points at the next lesson. Tapping it starts that lesson.
- There's no text-heavy UI: every label has an icon, and tapping a label reads it aloud (future work, see §8).

### 3.2 Kartu Huruf (letter card)
```
┌───────────────────────────────┐
│  ←                    3 / 8   │
│                               │
│             ب                 │   ← glyph ~40vh, Scheherazade New
│                               │
│        [ 🔊 Nama ] [ 🔊 Bunyi ] │
│             "Ba"              │
│                               │
│    ◀ Sebelumnya   Lanjut ▶    │
└───────────────────────────────┘
```
- The card auto-plays the letter's name, then its sound, when it opens.
- Tapping the glyph replays the audio, and the glyph does a small bounce while the audio plays.
- Kids swipe left or right to move between letters, or use the large arrow buttons.
- Jilid 2 shows the 4 forms in a row, and tapping any form plays the sound.

### 3.3 Urai Kata (word breakdown), Jilid 5+
- The whole word is shown at the top. Below it, the word is split into its letters/syllables, right to left.
- **Putar** plays each syllable in turn while highlighting it, karaoke-style, then plays the whole word.
- In the split view, each letter keeps the shape it has inside the word. This uses the zero-width joiner (`U+200D`), e.g. `"‍ب‍"` renders medial ـبـ.

### 3.4 Latihan (practice), at the end of every lesson
The game types below rotate through each lesson's questions:
1. **Dengar & Pilih**: the app plays a sound and the kid picks the right letter from 3–4 big tiles.
2. **Lihat & Dengar**: the app shows a letter and the kid picks the right sound from 3 speaker buttons.
3. **Cari Huruf** (Jilid 2): the app shows a letter form (e.g. ـغـ) and the kid picks the plain letter it belongs to. On a correct answer, the letter's sound plays.
4. **Susun Kata** (Jilid 8+): the kid taps letters in order to build the word they heard.

When the kid answers:
- **Right answer:** cheerful sound + confetti.
- **Wrong answer:** a gentle "coba lagi" wobble, then the right answer is played. There are no fail states and nothing is ever lost.

A lesson awards 1–3 stars based on mistakes. Letters the kid gets wrong go into a review pile (§3.5).

### 3.5 Ulangi (review)
A daily mini-session of 5 items drawn from the review pile, using simple spaced repetition (Leitner boxes 1–3).

### 3.6 Ruang Orang Tua (parent corner)
- Kept behind a parent gate (e.g. "tekan dan tahan 3 detik").
- Shows progress per jilid and the letters the kid finds hardest.
- Settings: auto-play on/off, playback speed, and resetting progress.

## 4. Kid-focused UX rules
- Tap targets are at least 64px, with big rounded shapes, high contrast and a warm palette.
- Every action has an audio or animation response. There are no silent taps.
- No timers, no lives, no penalties.
- No ads, no external links, and no data collection.
- The app is portrait-first for phones and tablets, and also works on desktop.
- Arabic text is always `dir="rtl"` `lang="ar"`, and Arabic glyphs are never smaller than 48px.
- Respect `prefers-reduced-motion`.

## 5. Audio

### 5.1 Placeholder strategy
- Every clip is referenced by an ID through a single manifest (`src/data/audio-manifest.json`). Code never hard-codes file paths.
- A placeholder entry looks like `{ "id": "letter.ba.sound", "src": null, "placeholder": true }`.
- The audio layer resolves each clip in this order:
  1. A real file, if `src` is set.
  2. Otherwise, browser `speechSynthesis` with an Arabic voice (`ar-SA`/`ar`), if available, speaking the vocalised text.
  3. Otherwise, a short neutral chime, with the transliteration shown big on screen.
- A dev-only badge "🔇 audio sementara" marks placeholder playback.
- TTS is **not** accurate for Qur'anic pronunciation, especially for ح ع ق ص ض ط ظ. It's only good enough to build and test the app flow. Real recordings are required before kids use the app.

### 5.2 Recording spec (for later)
- One clip per sound, mono, 44.1 kHz, trimmed to about 100 ms of silence on each side, loudness-normalised (−16 LUFS).
- Delivered as `.mp3`, plus `.ogg` if needed.
- Naming: `letters/ba.name.mp3`, `letters/ba.fathah.mp3`, `letters/ba.kasrah.mp3`, …, `words/bismi.mp3`.
- Jilid 1–7 need about 29 × (name + 3 harakat + 3 tanwin + 3 mad + sukun) ≈ 320 clips.
- Jilid 8–9 can use Quran.com word-by-word audio, if its license allows bundling. Check the license first.

### 5.3 Playback
- Howler.js handles preloading the current lesson's clips, queued sequential playback with per-clip `onstart`/`onend` callbacks (which drive the highlighting), and iOS audio unlocking on first tap.
- Starting new audio stops whatever is already playing, so clips never overlap.

## 6. Data model

```ts
type LetterId = string; // "alif", "ba", ...

interface Letter {
  id: LetterId;
  char: string;               // "ب"
  name: string;               // "Ba"
  translit: string;           // "b"
  joinsLeft: boolean;         // false for ا د ذ ر ز و
  makhrajHint?: string;       // "Bibir dirapatkan" (parent corner / tooltip)
}

type ItemKind = "letter" | "form" | "syllable" | "word" | "ayah";

interface Item {
  id: string;
  kind: ItemKind;
  text: string;               // vocalised Arabic, e.g. "بِسْمِ"
  translit: string;           // "bis-mi"
  segments?: { text: string; audio: string }[]; // for Urai Kata
  audio: string[];            // manifest IDs, played in order
  meaning?: string;           // Indonesian meaning for words/ayat
}

interface Lesson {
  id: string;                 // "j1-l2"
  jilid: number;
  title: string;              // "Huruf Ba sampai Tsa"
  items: string[];            // Item IDs
  practice: ("listen-pick" | "see-pick" | "build-word")[];
}

interface Progress {
  lessons: Record<string, { stars: 0 | 1 | 2 | 3; completedAt?: string }>;
  review: Record<string, { box: 1 | 2 | 3; due: string }>;
  settings: { autoplay: boolean; rate: number };
}
```

- Lesson content lives as JSON in the repo.
- Progress is stored in IndexedDB via `idb-keyval`, with in-memory fallback if storage is unavailable.

## 7. Tech and structure

| Area | Choice |
|---|---|
| Framework | Vite + React + TypeScript |
| Routing | React Router (`/`, `/jilid/:j/lesson/:id`, `/latihan/:id`, `/orang-tua`) |
| State | Zustand (progress + settings), persisted to IndexedDB |
| Audio | Howler.js + manifest resolver (§5.1) |
| Offline | vite-plugin-pwa: precache the app shell, runtime-cache audio per jilid |
| Styling | Tailwind CSS |
| Animation | Framer Motion (respects reduced motion) |
| Fonts (self-hosted) | Scheherazade New (letters), KFGQPC Uthmanic Hafs (Qur'an words), Nunito (Indonesian UI) |
| Testing | Vitest (data + logic), Playwright (lesson flow smoke test) |
| Hosting | Cloudflare Pages or GitHub Pages |

```
src/
  app/            routes, layout
  components/     LetterCard, WordBreakdown, ChoiceTiles, StarBurst, Mascot, ParentGate
  features/
    lesson/       lesson player
    practice/     game types
    review/       Leitner logic
  lib/
    audio.ts      manifest resolver, queue, highlight callbacks
    arabic.ts     contextual forms (ZWJ), harakat helpers
    progress.ts   store + persistence
  data/
    letters.json
    lessons/jilid-1.json … jilid-9.json
    items/*.json
    audio-manifest.json
public/
  audio/letters/  audio/words/  (empty until recordings arrive)
  fonts/
```

## 8. Milestones

1. ✅ **M1: Jilid 1 playable.** The path map, letter card, and Dengar & Pilih game, with progress saved. All audio is placeholder.
2. **M2: Jilid 2–4.** Letter forms, harakat, and tanwin, plus the Lihat & Dengar game and stars. Jilid 2 (letter forms) is done; Jilid 3–4 remain.
3. **M3: Jilid 5–7.** Sukun, tasydid and mad, plus syllable drills and the review pile.
4. **M4: Jilid 8–9.** Urai Kata, Susun Kata, and Al-Fatihah and short surahs word by word. Also the parent corner.
5. **M5: Real audio.** Swap in recordings through the manifest, have an ustadz review them, add PWA offline packs, and do a polish pass.

Future ideas: voice-over for all UI labels (so non-readers can use everything), a microphone "coba ucapkan" practice mode, tajweed colour-coding, and multiple child profiles.

## 9. Open questions
- Who will record the audio, and can they review the pronunciation hints (makhraj) too?
- Should Jilid 1 teach letters with fathah only (pure Iqra' style), or with their names too? The current plan uses both.
- What is the Quran.com word audio license for bundling offline? If bundling isn't allowed, stream that audio instead.
- ✅ Name and mascot: the app is "Belajar Mengaji Bersama Zayn & Zahra", and the mascot is `src/img/mascot.png`.
