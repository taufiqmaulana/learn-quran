# Letter recordings: attribution

The letter sounds in this folder (`<letter>.<fathah|kasrah|dhammah>.mp3`) are derived from:

- **Dataset:** "Pelafalan Huruf Hijaiyah" by Reinjin
  <https://huggingface.co/datasets/Reinjin/Pelafalan_Huruf_Hijaiyah>
- **Recorded by:** santri of MTs/MA Pondok Tahfidz Yanbuul Qur'an Menawan, Kudus. The speaker used is "Masykur".
- **License:** Academic Free License v3.0 (AFL-3.0), <https://opensource.org/license/afl-3-0-php>

Changes made, via `scripts/import-hijaiyah.mjs`:

- Each clip was trimmed to the spoken syllable and faded at the edges.
- Loudness was normalised to −16 LUFS.
- The files were re-encoded as 44.1 kHz mono MP3.

The dataset has no hamzah recordings. `hamzah.*.mp3` are copies of the matching `alif.*.mp3`, because a voweled alif is pronounced as hamzah (أَ إِ أُ).
