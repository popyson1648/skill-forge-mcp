import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createInitialState,
  isPersistEnabled,
  type ServerState,
} from "../src/state.js";

describe("state", () => {
  let state: ServerState;

  beforeEach(() => {
    state = createInitialState();
  });

  // S-1: Initial state
  it("initial state has all phases as not-started", () => {
    for (let i = 0; i <= 8; i++) {
      expect(state.progress[String(i)].status).toBe("not-started");
    }
  });

  it("initial state has empty access log", () => {
    expect(state.accessLog.entries.length).toBe(0);
  });

  it("initial state has empty notes", () => {
    for (let i = 0; i <= 8; i++) {
      expect(state.progress[String(i)].note).toBe("");
    }
  });

  it("initial state has valid timestamps", () => {
    for (let i = 0; i <= 8; i++) {
      const timestamp = state.progress[String(i)].updatedAt;
      expect(() => new Date(timestamp)).not.toThrow();
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    }
  });

  // S-2, S-3: Access log recording (unit level)
  it("access log entries can be pushed", () => {
    state.accessLog.entries.push({
      timestamp: new Date().toISOString(),
      uri: "process://phase/0",
      phaseId: 0,
    });
    expect(state.accessLog.entries.length).toBe(1);
    expect(state.accessLog.entries[0].phaseId).toBe(0);
  });

  it("multiple access log entries accumulate", () => {
    for (let i = 0; i < 3; i++) {
      state.accessLog.entries.push({
        timestamp: new Date().toISOString(),
        uri: "process://phase/0",
        phaseId: 0,
      });
    }
    expect(state.accessLog.entries.length).toBe(3);
  });

  // Progress update
  it("progress can be updated", () => {
    state.progress["1"] = {
      status: "in-progress",
      note: "working on it",
      updatedAt: new Date().toISOString(),
    };
    expect(state.progress["1"].status).toBe("in-progress");
    expect(state.progress["1"].note).toBe("working on it");
  });
});

describe("isPersistEnabled", () => {
  const originalEnv = process.env.SKILL_FORGE_PERSIST;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.SKILL_FORGE_PERSIST;
    } else {
      process.env.SKILL_FORGE_PERSIST = originalEnv;
    }
  });

  it("accepts 'true' (lowercase)", () => {
    process.env.SKILL_FORGE_PERSIST = "true";
    expect(isPersistEnabled()).toBe(true);
  });

  it("accepts 'TRUE' (uppercase)", () => {
    process.env.SKILL_FORGE_PERSIST = "TRUE";
    expect(isPersistEnabled()).toBe(true);
  });

  it("accepts 'True' (mixed case)", () => {
    process.env.SKILL_FORGE_PERSIST = "True";
    expect(isPersistEnabled()).toBe(true);
  });

  it("rejects '1'", () => {
    process.env.SKILL_FORGE_PERSIST = "1";
    expect(isPersistEnabled()).toBe(false);
  });

  it("rejects unset", () => {
    delete process.env.SKILL_FORGE_PERSIST;
    expect(isPersistEnabled()).toBe(false);
  });
});
