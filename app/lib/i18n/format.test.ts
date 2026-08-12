import { describe, expect, test } from "bun:test";
import { formatTemplate } from "@/lib/i18n/format";

describe("formatTemplate", () => {
  test("substitutes known placeholders", () => {
    expect(formatTemplate("Delete “{label}”?", { label: "Acme" })).toBe("Delete “Acme”?");
    expect(formatTemplate("{percent}% translated", { percent: 42 })).toBe("42% translated");
  });

  test("leaves an unknown placeholder untouched rather than throwing", () => {
    expect(formatTemplate("Hello {name}", {})).toBe("Hello {name}");
  });
});
