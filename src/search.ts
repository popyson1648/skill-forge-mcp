import { getManifest, loadPhaseContent } from "./content.js";

export interface SearchResult {
  phaseId: number;
  sectionName: string;
  lineNumber: number;
  lineText: string;
}

export function searchAllPhases(
  query: string,
  maxResults: number,
): SearchResult[] {
  if (!query.trim()) {
    return [];
  }
  const lowerQuery = query.toLowerCase();
  const results: SearchResult[] = [];
  const manifest = getManifest();

  for (
    let phaseId = 0;
    phaseId <= 8 && results.length < maxResults;
    phaseId++
  ) {
    const content = loadPhaseContent(phaseId);
    const lines = content.split("\n");
    const phaseManifest = manifest.phases[phaseId];
    let currentSection = "overview";

    for (let i = 0; i < lines.length && results.length < maxResults; i++) {
      const line = lines[i];

      // Track section boundaries
      if (line.startsWith("### ")) {
        const heading = line.substring(4).trim();
        const matchedSection = phaseManifest.sections.find(
          (s: { name: string; heading: string }) => s.heading === heading,
        );
        if (matchedSection) {
          currentSection = matchedSection.name;
        }
      }

      // Search match
      if (line.toLowerCase().includes(lowerQuery)) {
        results.push({
          phaseId,
          sectionName: currentSection,
          lineNumber: i + 1,
          lineText: line.trim(),
        });
      }
    }
  }

  return results;
}

export function formatSearchResults(
  query: string,
  results: SearchResult[],
): string {
  if (results.length === 0) {
    return `No matches found for '${query}'.`;
  }
  const lines = results.map(
    (r, i) =>
      `${i + 1}. [Phase ${r.phaseId} > ${r.sectionName}] line ${r.lineNumber}\n   "${r.lineText}"`,
  );
  return `Found ${results.length} matches for '${query}':\n\n${lines.join("\n\n")}`;
}
