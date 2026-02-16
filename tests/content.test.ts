import { describe, expect, it } from "vitest";
import {
  extractSection,
  findSuggestion,
  loadPhaseContent,
  manifest,
} from "../src/content.js";

describe("content", () => {
  // R-2 related: loadPhaseContent
  it("loadPhaseContent returns content for Phase 0", () => {
    const content = loadPhaseContent(0);
    expect(content).toContain("Phase 0");
  });

  // R-3 related: loadPhaseContent for Phase 8
  it("loadPhaseContent returns content for Phase 8", () => {
    const content = loadPhaseContent(8);
    expect(content).toContain("Evaluation and Iteration");
  });

  // R-4: extractSection returns a specific section
  it("extractSection returns frontmatter section from Phase 0", () => {
    const section = extractSection(0, "frontmatter");
    expect(section).toContain("Frontmatter");
    const fullContent = loadPhaseContent(0);
    expect(section.length).toBeLessThan(fullContent.length);
  });

  // R-5: extractSection overview returns content before first ###
  it("extractSection overview returns content before first h3", () => {
    const overview = extractSection(1, "overview");
    expect(overview).not.toContain("### ");
    expect(overview).toContain("Phase 1");
  });

  // R-8: extractSection throws for nonexistent section
  it("extractSection throws for nonexistent section", () => {
    try {
      extractSection(0, "nonexistent");
      expect.fail("Should have thrown");
    } catch (e: unknown) {
      const err = e as Error & {
        code: number;
        data: { availableSections: string[] };
      };
      expect(err.code).toBe(-32002);
      expect(err.data.availableSections).toContain("frontmatter");
    }
  });

  // Levenshtein suggestion
  it("suggests similar section name when typo is close", () => {
    const suggestion = findSuggestion("frontmat", [
      "overview",
      "structure",
      "frontmatter",
      "progressive-disclosure",
      "skill-types",
      "freedom-levels",
      "invocation-control",
      "claude-code-specific",
    ]);
    expect(suggestion).toBe("frontmatter");
  });

  it("does not suggest when distance > 3", () => {
    const suggestion = findSuggestion("xyz", [
      "overview",
      "structure",
      "frontmatter",
    ]);
    expect(suggestion).toBeUndefined();
  });

  // manifest structure
  it("manifest has 9 phases", () => {
    expect(manifest.phases.length).toBe(9);
  });

  it("manifest phases have correct ids 0-8", () => {
    for (let i = 0; i <= 8; i++) {
      expect(manifest.phases[i].id).toBe(i);
    }
  });

  // phaseId boundary validation
  it("loadPhaseContent throws for negative phaseId", () => {
    try {
      loadPhaseContent(-1);
      expect.fail("Should have thrown");
    } catch (e: unknown) {
      const err = e as Error & { code: number };
      expect(err.code).toBe(-32002);
      expect(err.message).toContain("does not exist");
    }
  });

  it("loadPhaseContent throws for phaseId > 8", () => {
    try {
      loadPhaseContent(9);
      expect.fail("Should have thrown");
    } catch (e: unknown) {
      const err = e as Error & { code: number };
      expect(err.code).toBe(-32002);
      expect(err.message).toContain("does not exist");
    }
  });
});
