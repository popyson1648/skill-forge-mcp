import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// --- Progress State ---
export interface PhaseProgress {
  status: "not-started" | "in-progress" | "completed";
  note: string;
  updatedAt: string;
}

export interface ProgressState {
  [phaseId: string]: PhaseProgress;
}

// --- Access Log ---
export interface AccessLogEntry {
  timestamp: string;
  uri: string;
  phaseId: number;
  section?: string;
}

export interface AccessLog {
  entries: AccessLogEntry[];
}

// --- Overall State ---
export interface ServerState {
  progress: ProgressState;
  accessLog: AccessLog;
}

const STATE_DIR = join(homedir(), ".skill-forge-mcp");
const STATE_FILE = join(STATE_DIR, "state.json");

export function createInitialState(): ServerState {
  const progress: ProgressState = {};
  for (let i = 0; i <= 8; i++) {
    progress[String(i)] = {
      status: "not-started",
      note: "",
      updatedAt: new Date().toISOString(),
    };
  }
  return {
    progress,
    accessLog: { entries: [] },
  };
}

export function isPersistEnabled(): boolean {
  return (process.env.SKILL_FORGE_PERSIST ?? "").toLowerCase() === "true";
}

const ACCESS_LOG_MAX = 1000;

export function loadState(): ServerState {
  const initial = createInitialState();
  if (isPersistEnabled() && existsSync(STATE_FILE)) {
    try {
      const data = readFileSync(STATE_FILE, "utf-8");
      const saved = JSON.parse(data) as Partial<ServerState>;

      // Merge progress: fill missing phases from initial state
      if (saved.progress && typeof saved.progress === "object") {
        for (const [key, value] of Object.entries(initial.progress)) {
          if (!(key in saved.progress)) {
            saved.progress[key] = value;
          }
        }
        initial.progress = saved.progress as ProgressState;
      }

      // Restore accessLog with cap
      if (saved.accessLog?.entries && Array.isArray(saved.accessLog.entries)) {
        initial.accessLog.entries = saved.accessLog.entries.slice(
          -ACCESS_LOG_MAX,
        );
      }

      return initial;
    } catch {
      return initial;
    }
  }
  return initial;
}

export function saveState(state: ServerState): void {
  if (isPersistEnabled()) {
    // Trim accessLog before saving to prevent unbounded file growth
    if (state.accessLog.entries.length > ACCESS_LOG_MAX) {
      state.accessLog.entries = state.accessLog.entries.slice(-ACCESS_LOG_MAX);
    }
    mkdirSync(STATE_DIR, { recursive: true });
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
  }
}
