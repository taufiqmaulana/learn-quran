import { describe, expect, it } from "vitest";
import { distinctForms, formOf, TATWEEL as T, ZWJ } from "./arabic";
import { getLetter } from "./content";

describe("formOf", () => {
  it("draws all four forms of a joining letter", () => {
    const ba = getLetter("ba");
    expect(formOf(ba, "isolated")).toBe("ب");
    expect(formOf(ba, "initial")).toBe(`ب${T}`);
    expect(formOf(ba, "medial")).toBe(`${T}ب${T}`);
    expect(formOf(ba, "final")).toBe(`${T}ب`);
  });

  it("never joins a non-joining letter to the next letter", () => {
    for (const id of ["alif", "dal", "dzal", "ro", "zai", "wau"]) {
      const l = getLetter(id);
      expect(formOf(l, "initial")).toBe(l.char);
      expect(formOf(l, "medial")).toBe(`${T}${l.char}`);
      expect(formOf(l, "final")).toBe(`${T}${l.char}`);
    }
  });

  it("can use an invisible joiner instead of tatweel", () => {
    expect(formOf(getLetter("ha"), "medial", ZWJ)).toBe(`${ZWJ}ه${ZWJ}`);
  });
});

describe("distinctForms", () => {
  it("only lists shapes that differ from the plain letter", () => {
    expect(distinctForms(getLetter("kaf"))).toEqual(["initial", "medial", "final"]);
    expect(distinctForms(getLetter("ro"))).toEqual(["final"]);
  });
});
