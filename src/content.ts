import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import manifest from "./content/manifest.json" with { type: "json" };

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Get the manifest */
export function getManifest() {
  return manifest;
}

function contentDir(): string {
  return join(__dirname, "content");
}

/** Return full content of a phase file */
export function loadPhaseContent(phaseId: number): string {
  if (!Number.isInteger(phaseId) || phaseId < 0 || phaseId > 8) {
    const error = new Error(
      `Phase ${phaseId} does not exist. Valid range: 0-8`,
    );
    (error as Error & { code: number }).code = -32002;
    throw error;
  }
  const filePath = join(contentDir(), `phase_${phaseId}.md`);
  return readFileSync(filePath, "utf-8");
}

/** Extract a specific section from a phase file */
export function extractSection(
  phaseId: number,
  sectionName: string,
): string {
  const content = loadPhaseContent(phaseId);
  const m = getManifest();
  const phaseManifest = m.phases[phaseId];

  if (sectionName === "overview") {
    // From file start to just before the first ### heading
    const firstH3 = content.indexOf("\n### ");
    return firstH3 === -1 ? content : content.substring(0, firstH3).trim();
  }

  // Get section heading from manifest
  const sectionDef = phaseManifest.sections.find(
    (s: { name: string; heading: string }) => s.name === sectionName,
  );
  if (!sectionDef) {
    // Error: unknown section (throw per §7.1)
    const availableSections = phaseManifest.sections.map(
      (s: { name: string }) => s.name,
    );
    const suggestion = findSuggestion(sectionName, availableSections);

    const errorData: Record<string, unknown> = { availableSections };
    if (suggestion) {
      errorData.suggestion = `Did you mean '${suggestion}'?`;
    }

    const error = new Error(
      `Section '${sectionName}' not found in Phase ${phaseId}. Available: ${availableSections.join(", ")}`,
    );
    (error as Error & { code: number; data: Record<string, unknown> }).code =
      -32002;
    (error as Error & { code: number; data: Record<string, unknown> }).data =
      errorData;
    throw error;
  }

  // Find line starting with ### {heading}, return content until next ###
  const startMarker = `### ${sectionDef.heading}`;
  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) {
    const error = new Error(
      `Section heading not found in phase file: ${startMarker}`,
    );
    (error as Error & { code: number }).code = -32603;
    throw error;
  }

  const afterStart = startIdx + startMarker.length;
  const nextH3 = content.indexOf("\n### ", afterStart);
  const endIdx = nextH3 === -1 ? content.length : nextH3;
  return content.substring(startIdx, endIdx).trim();
}

/** Calculate Levenshtein distance */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  return matrix[a.length][b.length];
}

/** Find suggestion with Levenshtein distance <= 3 */
function findSuggestion(
  input: string,
  candidates: string[],
): string | undefined {
  let bestCandidate: string | undefined;
  let bestDistance = 4; // Only <= 3
  for (const candidate of candidates) {
    const distance = levenshteinDistance(input, candidate);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestCandidate = candidate;
    }
  }
  return bestCandidate;
}

export { manifest, findSuggestion };
