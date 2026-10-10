# Belajar Mengaji Bersama Zayn & Zahra

A web app that teaches kids to read the Qur'an, starting from the hijaiyah letters. See [design.md](design.md) for the full design.

**Status:** Jilid 1–2 are playable.

- **Jilid 1 (Huruf Hijaiyah):** letter cards, plus the "Dengar & Pilih" game.
- **Jilid 2 (Bentuk Huruf):** forms cards showing Sendiri / Awal / Tengah / Akhir, plus the "Cari Huruf" and "Lihat & Dengar" games.
- **Shared:** the path map and stars. Progress is saved in IndexedDB.

Letter sounds are real recordings for all 29 letters with fathah, kasrah and dhammah (see `public/audio/letters/ATTRIBUTION.md`). Letter *names* ("Alif", "Ba"…) are still placeholder.

## Development

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # data + logic tests (Vitest)
npm run build      # typecheck + production build into dist/
```

## Audio

Every sound is looked up by ID in `src/data/audio-manifest.json`, for example `letter.ba.name` and `letter.ba.sound`. For each sound, the app uses the first of these that's available:

1. **The recording**, if the entry's `src` is set.
2. **The browser's Arabic text-to-speech voice**, reading the entry's `tts` text. Not every device has one.
3. **A neutral chime.**

During development, a "🔇 audio sementara" badge shows whenever placeholder audio plays. TTS mispronounces many letters, so it's only for building the app. Real recordings are needed before kids use the app.

**Importing letter sounds from the dataset:** the letter sounds come from the [Pelafalan Huruf Hijaiyah](https://huggingface.co/datasets/Reinjin/Pelafalan_Huruf_Hijaiyah) dataset (AFL-3.0). To re-import, or to switch to a different speaker:

```sh
curl -L -o dataset.zip https://huggingface.co/datasets/Reinjin/Pelafalan_Huruf_Hijaiyah/resolve/main/dataset.zip
unzip -q dataset.zip -d hijaiyah-dataset
node scripts/import-hijaiyah.mjs hijaiyah-dataset Masykur   # needs ffmpeg
```

The script trims and normalises every clip and updates the manifest. Masykur was chosen because their recordings had the cleanest audio (highest signal-to-noise, no clipping). 51 speakers recorded the full set.

**Adding a recording:**

1. Put the file under `public/audio/`, e.g. `public/audio/letters/ba.fathah.mp3`. Recording spec: design.md §5.2.
2. In the manifest, set the entry's `"src": "audio/letters/ba.fathah.mp3"` and `"placeholder": false`.

## Content

- Letters are defined in `scripts/letters.src.mjs`. After editing it, run `node scripts/gen-data.mjs` to regenerate `letters.json` and the manifest. Regenerating keeps any recording paths already set.
- Lessons are in `src/data/lessons/jilid-*.json`.

## Notes vs. design.md

- Animations are plain CSS (`src/index.css`) rather than Framer Motion. They're enough for M1.
- The PWA/offline setup is deferred to M5, when there's real audio to cache.
