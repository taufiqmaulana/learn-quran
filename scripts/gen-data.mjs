// Generates src/data/letters.json and src/data/audio-manifest.json.
// Existing `src` values in the manifest are kept, so real recordings survive regeneration.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { LETTERS } from "./letters.src.mjs";

const letters = LETTERS.map(([id, char, name, translit, joinsLeft, sound]) => ({
  id, char, name, translit, joinsLeft, sound,
}));
writeFileSync("src/data/letters.json", JSON.stringify(letters, null, 2) + "\n");

const manifestPath = "src/data/audio-manifest.json";
const old = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : [];
const oldById = new Map(old.map((e) => [e.id, e]));
const entry = (id, tts) => {
  const src = oldById.get(id)?.src ?? null;
  return { id, src, tts, placeholder: src === null };
};
// Alif carries a hamzah when voweled (أَ إِ أُ); other letters just take the mark.
const withMark = (id, char, mark) =>
  id === "alif" ? (mark === "\u0650" ? "إ" : "أ") + mark : char + mark;
const manifest = LETTERS.flatMap(([id, char, , , , sound, nameText]) => [
  entry(`letter.${id}.name`, nameText),
  entry(`letter.${id}.sound`, sound), // = fathah; the Jilid 1 "Bunyi" clip
  entry(`letter.${id}.kasrah`, withMark(id, char, "\u0650")),
  entry(`letter.${id}.dhammah`, withMark(id, char, "\u064F")),
]);
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`letters: ${letters.length}, audio entries: ${manifest.length}`);
