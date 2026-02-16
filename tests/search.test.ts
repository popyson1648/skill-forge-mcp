import { describe, expect, it } from "vitest";
import { formatSearchResults, searchAllPhases } from "../src/search.js";

describe("search", () => {
  // T-1: Search hits
  it("finds matches for 'frontmatter'", () => {
    const results = searchAllPhases("frontmatter", 5);
    expect(results.length).toBeGreaterThan(0);
    const formatted = formatSearchResults("frontmatter", results);
    expect(formatted).toContain("Found");
  });

  // T-2: No search hits
  it("returns no matches for nonexistent keyword", () => {
    const results = searchAllPhases("xyz_nonexistent_xyz", 5);
    expect(results.length).toBe(0);
    const formatted = formatSearchResults("xyz_nonexistent_xyz", results);
    expect(formatted).toContain("No matches");
  });

  // T-3: Case insensitivity
  it("search is case-insensitive", () => {
    const lower = searchAllPhases("frontmatter", 50);
    const upper = searchAllPhases("FRONTMATTER", 50);
    expect(upper.length).toBe(lower.length);
  });

  // T-4: maxResults limit
  it("respects maxResults limit", () => {
    const results = searchAllPhases("Phase", 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  // Search result format
  it("search results include correct phase and section info", () => {
    const results = searchAllPhases("frontmatter", 1);
    expect(results.length).toBe(1);
    expect(results[0].phaseId).toBeGreaterThanOrEqual(0);
    expect(results[0].phaseId).toBeLessThanOrEqual(8);
    expect(results[0].sectionName).toBeDefined();
    expect(results[0].lineNumber).toBeGreaterThan(0);
    expect(results[0].lineText).toBeDefined();
  });

  // Empty query guard
  it("returns empty results for empty query", () => {
    const results = searchAllPhases("", 5);
    expect(results.length).toBe(0);
  });

  it("returns empty results for whitespace-only query", () => {
    const results = searchAllPhases("   ", 5);
    expect(results.length).toBe(0);
  });
});
