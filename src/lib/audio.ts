import { Howl } from "howler";
import { create } from "zustand";
import manifestJson from "../data/audio-manifest.json";

export interface AudioEntry {
  id: string;
  /** Path under /public, e.g. "audio/letters/ba.fathah.mp3". Null until recorded. */
  src: string | null;
  /** Vocalised Arabic text used for the TTS placeholder. */
  tts?: string;
  placeholder: boolean;
}

const manifest = new Map<string, AudioEntry>(
  (manifestJson as AudioEntry[]).map((e) => [e.id, e]),
);

/** UI-facing audio state: what is playing, and whether it is a placeholder. */
export const useAudioStatus = create<{ playing: boolean; placeholder: boolean }>(() => ({
  playing: false,
  placeholder: false,
}));

export interface PlayOptions {
  rate?: number;
  /** Called when clip `index` of the queue starts. */
  onStart?: (index: number) => void;
}

// Every play() call bumps the generation; older queues notice and stop.
let generation = 0;
let stopCurrent: (() => void) | null = null;
const howls = new Map<string, Howl>();

export function stop() {
  generation++;
  stopCurrent?.();
  stopCurrent = null;
  useAudioStatus.setState({ playing: false });
}

/**
 * Plays clips in order. Resolves true when the whole queue finished,
 * false when a newer play() or stop() interrupted it.
 */
export async function play(ids: string[], opts: PlayOptions = {}): Promise<boolean> {
  stop();
  const gen = generation;
  useAudioStatus.setState({ playing: true });
  for (let i = 0; i < ids.length; i++) {
    if (gen !== generation) return false;
    opts.onStart?.(i);
    await playOne(ids[i], opts.rate ?? 1);
    if (gen !== generation) return false;
    if (i < ids.length - 1) await pause(250);
  }
  if (gen !== generation) return false;
  useAudioStatus.setState({ playing: false });
  return true;
}

function pause(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function playOne(id: string, rate: number): Promise<void> {
  const entry = manifest.get(id);
  if (!entry) {
    console.warn(`audio: no manifest entry for "${id}"`);
    return Promise.resolve();
  }
  if (entry.src) {
    useAudioStatus.setState({ placeholder: false });
    return playFile(entry.src, rate);
  }
  useAudioStatus.setState({ placeholder: true });
  const voice = arabicVoice();
  if (voice && entry.tts) return speak(entry.tts, voice, rate);
  return chime();
}

function playFile(src: string, rate: number): Promise<void> {
  let howl = howls.get(src);
  if (!howl) {
    howl = new Howl({ src: [`${import.meta.env.BASE_URL}${src}`] });
    howls.set(src, howl);
  }
  const h = howl;
  return new Promise((resolve) => {
    const soundId = h.play();
    h.rate(rate, soundId);
    const done = () => resolve();
    h.once("end", done, soundId);
    h.once("loaderror", done);
    h.once("playerror", done);
    stopCurrent = () => {
      h.stop(soundId);
      resolve();
    };
  });
}

// --- Placeholder: browser text-to-speech ---------------------------------

let cachedVoice: SpeechSynthesisVoice | null | undefined;

function arabicVoice(): SpeechSynthesisVoice | null {
  if (typeof speechSynthesis === "undefined") return null;
  if (cachedVoice !== undefined) return cachedVoice;
  const voices = speechSynthesis.getVoices();
  if (voices.length === 0) return null; // not loaded yet; try again next time
  cachedVoice = voices.find((v) => v.lang.toLowerCase().startsWith("ar")) ?? null;
  return cachedVoice;
}

if (typeof speechSynthesis !== "undefined") {
  speechSynthesis.addEventListener?.("voiceschanged", () => {
    cachedVoice = undefined;
  });
}

function speak(text: string, voice: SpeechSynthesisVoice, rate: number): Promise<void> {
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = 0.8 * rate; // slower is clearer for kids
    u.onend = () => resolve();
    u.onerror = () => resolve();
    stopCurrent = () => {
      speechSynthesis.cancel();
      resolve();
    };
    speechSynthesis.speak(u);
  });
}

// --- Placeholder of last resort + UI feedback sounds ---------------------

let ctx: AudioContext | null = null;

function tone(notes: { freq: number; at: number; dur: number }[], type: OscillatorType = "sine"): Promise<void> {
  if (typeof AudioContext === "undefined") return Promise.resolve();
  ctx ??= new AudioContext();
  const c = ctx;
  void c.resume();
  const t0 = c.currentTime;
  let end = 0;
  for (const n of notes) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = n.freq;
    gain.gain.setValueAtTime(0.0001, t0 + n.at);
    gain.gain.exponentialRampToValueAtTime(0.25, t0 + n.at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + n.at + n.dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0 + n.at);
    osc.stop(t0 + n.at + n.dur + 0.05);
    end = Math.max(end, n.at + n.dur);
  }
  return pause(end * 1000 + 50);
}

/** Neutral chime used when neither a recording nor an Arabic voice exists. */
export function chime() {
  return tone([{ freq: 660, at: 0, dur: 0.35 }]);
}

export function sfxCorrect() {
  return tone([
    { freq: 523, at: 0, dur: 0.15 },
    { freq: 659, at: 0.12, dur: 0.15 },
    { freq: 784, at: 0.24, dur: 0.3 },
  ], "triangle");
}

export function sfxTryAgain() {
  return tone([
    { freq: 392, at: 0, dur: 0.18 },
    { freq: 330, at: 0.16, dur: 0.25 },
  ], "triangle");
}
