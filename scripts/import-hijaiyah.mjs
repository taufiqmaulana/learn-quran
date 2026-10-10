// Imports letter recordings from the "Pelafalan Huruf Hijaiyah" dataset
// (https://huggingface.co/datasets/Reinjin/Pelafalan_Huruf_Hijaiyah, AFL-3.0)
// into public/audio/letters/ and points the audio manifest at them.
//
// Usage:
//   node scripts/import-hijaiyah.mjs <extracted-dataset-dir> [speaker]
//
// Each clip is trimmed to the spoken syllable (with pre/post-roll so quiet
// consonant onsets survive), faded at the edges to remove clicks,
// loudness-normalised to -16 LUFS (two-pass) and encoded as mono MP3.
// Requires ffmpeg on PATH.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [datasetDir, speaker = "Masykur"] = process.argv.slice(2);
if (!datasetDir) {
  console.error("usage: node scripts/import-hijaiyah.mjs <extracted-dataset-dir> [speaker]");
  process.exit(1);
}

// Dataset letter label → our letter id. The dataset has no hamzah; see below.
const LETTER = {
  alif: "alif", ba: "ba", ta: "ta", tsa: "tsa", jim: "jim", hah: "ha_h", kha: "kho",
  dal: "dal", dzal: "dzal", ra: "ro", zay: "zai", sin: "sin", shin: "syin", sad: "shod",
  dad: "dhod", tah: "tho", zah: "zho", ain: "ain", ghaiin: "ghoin", fa: "fa", qaf: "qof",
  kaf: "kaf", lam: "lam", mim: "mim", nun: "nun", Ha: "ha", waw: "wau", ya: "ya",
};
// Dataset harakat label → [our file suffix, manifest key].
const HARAKAT = {
  fathah: ["fathah", "sound"],
  kasroh: ["kasrah", "kasrah"],
  dommah: ["dhammah", "dhammah"],
};

// Trim window relative to each clip's loudest moment: room noise sits far below
// the syllable, while fricative onsets (ث س ش ف ح) are within ~30 dB of it.
const THRESHOLD_DB = -30;
const PRE_ROLL = 0.12;
const POST_ROLL = 0.15;
const RATE = 16000;

/** Seconds [start, end] around the part of the clip within THRESHOLD_DB of its peak. */
function speechWindow(input) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostdin", "-i", input, "-f", "s16le", "-ac", "1", "-ar", String(RATE), "-"]);
  if (r.status !== 0) throw new Error(`ffmpeg decode failed: ${input}`);
  const pcm = new Int16Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length >> 1);
  const frame = RATE / 100; // 10 ms
  const db = [];
  for (let i = 0; i + frame <= pcm.length; i += frame) {
    let sum = 0;
    for (let j = i; j < i + frame; j++) sum += pcm[j] * pcm[j];
    db.push(10 * Math.log10(sum / frame + 1e-9));
  }
  const peak = Math.max(...db);
  // Group loud frames into segments (bridging gaps under 150 ms) and drop
  // segments under 40 ms, so clicks and bumps don't stretch the window.
  const segments = [];
  db.forEach((d, i) => {
    if (d < peak + THRESHOLD_DB) return;
    const prev = segments.at(-1);
    if (prev && i - prev[1] <= 15) prev[1] = i;
    else segments.push([i, i]);
  });
  const real = segments.filter(([a, b]) => b - a + 1 >= 4);
  const [first, last] = [real[0][0], real.at(-1)[1]];
  const duration = pcm.length / RATE;
  return [Math.max(0, first / 100 - PRE_ROLL), Math.min(duration, (last + 1) / 100 + POST_ROLL)];
}

function trimFilter(input) {
  const [start, end] = speechWindow(input);
  const len = end - start;
  return `highpass=f=70,atrim=start=${start.toFixed(3)}:end=${end.toFixed(3)},asetpts=PTS-STARTPTS,`
    + `afade=t=in:d=0.02,afade=t=out:st=${(len - 0.05).toFixed(3)}:d=0.05,apad=pad_dur=0.05`;
}
const TARGET = "I=-16:TP=-1.5:LRA=11";

function ffmpeg(args) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostdin", "-y", ...args], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`ffmpeg ${args.join(" ")}\n${r.stderr}`);
  return r.stderr; // ffmpeg reports (including loudnorm JSON) on stderr
}

function convert(input, output) {
  const TRIM = trimFilter(input);
  const report = ffmpeg(["-i", input, "-af", `${TRIM},loudnorm=${TARGET}:print_format=json`, "-f", "null", "-"]);
  const m = JSON.parse(report.slice(report.lastIndexOf("{"), report.lastIndexOf("}") + 1));
  const loudnorm = `loudnorm=${TARGET}:linear=true`
    + `:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}`
    + `:measured_thresh=${m.input_thresh}:offset=${m.target_offset}`;
  ffmpeg(["-i", input, "-af", `${TRIM},${loudnorm}`, "-ar", "44100", "-ac", "1",
    "-c:a", "libmp3lame", "-b:a", "64k", output]);
}

const outDir = "public/audio/letters";
mkdirSync(outDir, { recursive: true });
const srcById = new Map();

for (const dir of readdirSync(datasetDir).sort()) {
  const label = dir.split(". ", 2)[1]; // "04. ba_fathah" → "ba_fathah"
  if (!label) continue;
  const [letterLabel, harakatLabel] = label.split("_");
  const id = LETTER[letterLabel];
  const harakat = HARAKAT[harakatLabel];
  if (!id || !harakat) throw new Error(`Unmapped dataset class: ${dir}`);

  // Primary take, named "<speaker>_<label>.wav" (some names have trailing spaces).
  const file = readdirSync(join(datasetDir, dir))
    .find((f) => f.replace(/\s+_/, "_") === `${speaker}_${label}.wav`);
  if (!file) throw new Error(`No recording by ${speaker} for ${label}`);

  const name = `${id}.${harakat[0]}.mp3`;
  convert(join(datasetDir, dir, file), join(outDir, name));
  srcById.set(`letter.${id}.${harakat[1]}`, `audio/letters/${name}`);
  process.stdout.write(".");
}

// Hamzah is not in the dataset. Voweled alif is pronounced as hamzah (أَ إِ أُ),
// so hamzah reuses alif's recordings.
for (const [suffix, key] of Object.values(HARAKAT)) {
  const name = `hamzah.${suffix}.mp3`;
  copyFileSync(join(outDir, `alif.${suffix}.mp3`), join(outDir, name));
  srcById.set(`letter.hamzah.${key}`, `audio/letters/${name}`);
}

const manifestPath = "src/data/audio-manifest.json";
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
let updated = 0;
for (const entry of manifest) {
  const src = srcById.get(entry.id);
  if (!src) continue;
  entry.src = src;
  entry.placeholder = false;
  updated++;
}
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

const missing = [...srcById.keys()].filter((id) => !manifest.some((e) => e.id === id));
if (missing.length) throw new Error(`Manifest has no entry for: ${missing.join(", ")}`);
console.log(`\n${srcById.size} clips written to ${outDir}, ${updated} manifest entries updated (speaker: ${speaker}).`);
if (!existsSync(join(outDir, "ATTRIBUTION.md"))) console.warn("Remember to add ATTRIBUTION.md for the dataset license.");
