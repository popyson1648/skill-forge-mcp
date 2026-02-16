import { getManifest } from "./content.js";
import type { ServerState } from "./state.js";

export function formatStatusTable(state: ServerState): string {
  const manifest = getManifest();
  const header = "| Phase | Name | Status | Reads |";
  const separator = "|-------|------|--------|-------|";
  const rows = manifest.phases.map((phase: { id: number; name: string }) => {
    const p = state.progress[String(phase.id)];
    const readCount = state.accessLog.entries.filter(
      (e) => e.phaseId === phase.id,
    ).length;
    return `| ${phase.id} | ${phase.name} | ${p.status} | ${readCount} |`;
  });
  return [header, separator, ...rows].join("\n");
}
