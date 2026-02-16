import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { loadPhaseContent, manifest } from "../src/content.js";
import { formatSearchResults, searchAllPhases } from "../src/search.js";
import { createInitialState } from "../src/state.js";
import { formatStatusTable } from "../src/status.js";

const SearchResultSchema = z.object({
  phaseId: z.number(),
  sectionName: z.string(),
  lineNumber: z.number(),
  lineText: z.string(),
});

function createTestServer() {
  const state = createInitialState();

  const server = new McpServer({
    name: "skill-forge-mcp",
    version: "1.0.0",
  });

  // Register phase resources for access log tracking
  for (const phase of manifest.phases) {
    server.resource(
      `phase-${phase.id}`,
      `process://phase/${phase.id}`,
      {
        title: `Phase ${phase.id}: ${phase.name}`,
        description: phase.description,
        mimeType: "text/markdown",
        annotations: { audience: ["assistant"], priority: 0.7 },
      },
      async (uri) => {
        state.accessLog.entries.push({
          timestamp: new Date().toISOString(),
          uri: uri.href,
          phaseId: phase.id,
        });
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/markdown",
              text: loadPhaseContent(phase.id),
            },
          ],
        };
      },
    );
  }

  // Tools (using registerTool API)
  server.registerTool(
    "search_process",
    {
      title: "Search Process",
      description:
        "Search all phases of the skill creation process by keyword.",
      inputSchema: {
        query: z.string(),
        maxResults: z.number().int().min(1).max(50).default(5),
      },
      outputSchema: {
        total: z.number(),
        results: z.array(SearchResultSchema),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ query, maxResults }) => {
      const results = searchAllPhases(query, maxResults);
      return {
        content: [
          { type: "text" as const, text: formatSearchResults(query, results) },
        ],
        structuredContent: { total: results.length, results },
      };
    },
  );

  server.registerTool(
    "mark_progress",
    {
      title: "Mark Progress",
      description: "Record progress status for a phase.",
      inputSchema: {
        phaseId: z.number().int().min(0).max(8),
        status: z.enum(["not-started", "in-progress", "completed"]),
        note: z.string().optional(),
      },
      outputSchema: {
        phaseId: z.number(),
        status: z.string(),
        updatedAt: z.string(),
      },
      annotations: {
        readOnlyHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ phaseId, status, note }) => {
      const updatedAt = new Date().toISOString();
      state.progress[String(phaseId)] = {
        status,
        note: note ?? "",
        updatedAt,
      };
      return {
        content: [
          {
            type: "text" as const,
            text: `Phase ${phaseId} marked as '${status}'.`,
          },
        ],
        structuredContent: { phaseId, status, updatedAt },
      };
    },
  );

  server.registerTool(
    "get_status",
    {
      title: "Get Status",
      description: "Return a summary of all phase progress and access counts.",
      outputSchema: {
        phases: z.array(
          z.object({
            phaseId: z.number(),
            name: z.string(),
            status: z.string(),
            reads: z.number(),
          }),
        ),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      const table = formatStatusTable(state);
      const phases = manifest.phases.map(
        (phase: { id: number; name: string }) => {
          const p = state.progress[String(phase.id)];
          const reads = state.accessLog.entries.filter(
            (e: { phaseId: number }) => e.phaseId === phase.id,
          ).length;
          return {
            phaseId: phase.id,
            name: phase.name,
            status: p.status,
            reads,
          };
        },
      );
      return {
        content: [{ type: "text" as const, text: table }],
        structuredContent: { phases },
      };
    },
  );

  // Prompts
  server.registerPrompt(
    "create_skill",
    {
      title: "Create Skill",
      description: "Guide the agent through the full skill creation process.",
      argsSchema: {
        topic: z.string().describe("The skill topic to create"),
      },
    },
    async ({ topic }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `I want to create an Agent Skill for: "${topic}"\n\nPlease follow the SkillForge MCP process.`,
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "resume_skill",
    {
      title: "Resume Skill Creation",
      description: "Resume a skill creation session.",
    },
    async () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: "I want to resume my skill creation session.",
          },
        },
      ],
    }),
  );

  return { server, state };
}

describe("tools integration", () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const { server } = createTestServer();
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    client = new Client({ name: "test-client", version: "1.0.0" });
    await Promise.all([
      client.connect(clientTransport),
      server.connect(serverTransport),
    ]);

    cleanup = async () => {
      await client.close();
      await server.close();
    };
  });

  afterAll(async () => {
    await cleanup();
  });

  // T-1: 検索ヒット
  it("T-1: search finds matches for 'frontmatter'", async () => {
    const result = await client.callTool({
      name: "search_process",
      arguments: { query: "frontmatter" },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain("Found");
  });

  // T-2: 検索ヒットなし
  it("T-2: search returns no matches", async () => {
    const result = await client.callTool({
      name: "search_process",
      arguments: { query: "xyz_nonexistent_xyz" },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain("No matches");
  });

  // T-3: 検索大文字小文字
  it("T-3: search is case-insensitive", async () => {
    const lower = await client.callTool({
      name: "search_process",
      arguments: { query: "frontmatter", maxResults: 50 },
    });
    const upper = await client.callTool({
      name: "search_process",
      arguments: { query: "FRONTMATTER", maxResults: 50 },
    });
    const lowerText = (
      lower.content as Array<{ type: string; text: string }>
    )[0].text;
    const upperText = (
      upper.content as Array<{ type: string; text: string }>
    )[0].text;
    // Both should have the same number of "Found N matches"
    const lowerMatch = lowerText.match(/Found (\d+)/);
    const upperMatch = upperText.match(/Found (\d+)/);
    expect(lowerMatch).not.toBeNull();
    expect(upperMatch).not.toBeNull();
    expect(lowerMatch?.[1]).toBe(upperMatch?.[1]);
  });

  // T-4: maxResults 制限
  it("T-4: search respects maxResults", async () => {
    const result = await client.callTool({
      name: "search_process",
      arguments: { query: "Phase", maxResults: 2 },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    // Should have at most 2 numbered results
    const matches = text.match(/^\d+\./gm);
    expect(matches).not.toBeNull();
    expect(matches?.length).toBeLessThanOrEqual(2);
  });

  // T-5: 進捗マーク
  it("T-5: mark_progress sets status", async () => {
    const result = await client.callTool({
      name: "mark_progress",
      arguments: { phaseId: 1, status: "in-progress" },
    });
    expect(result.isError).toBeFalsy();
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(text).toContain("Phase 1 marked as 'in-progress'");
  });

  // T-6: 進捗マーク+メモ
  it("T-6: mark_progress with note", async () => {
    const result = await client.callTool({
      name: "mark_progress",
      arguments: { phaseId: 1, status: "completed", note: "done" },
    });
    expect(result.isError).toBeFalsy();
  });

  // T-7: 進捗マーク範囲外 (Zod validation failure)
  it("T-7: mark_progress rejects out-of-range phaseId", async () => {
    const result = await client.callTool({
      name: "mark_progress",
      arguments: { phaseId: 99, status: "completed" },
    });
    expect(result.isError).toBe(true);
  });

  // T-8: ステータス取得
  it("T-8: get_status returns all phases", async () => {
    const result = await client.callTool({ name: "get_status", arguments: {} });
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    for (const phase of manifest.phases) {
      expect(text).toContain(phase.name);
    }
  });

  // T-9: Progress reflection check
  it("T-9: get_status reflects progress changes", async () => {
    // First mark phase 1 as in-progress
    await client.callTool({
      name: "mark_progress",
      arguments: { phaseId: 1, status: "in-progress" },
    });
    const result = await client.callTool({ name: "get_status", arguments: {} });
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    // Phase 1 row should contain in-progress
    const lines = text.split("\n");
    const phase1Line = lines.find((l) => l.includes("Scoping"));
    expect(phase1Line).toContain("in-progress");
  });

  // S-1: 初期状態 — all not-started, reads 0
  // (we can check indirectly via get_status, but our server state already has modifications)
  // This is covered by the state.test.ts unit test

  // S-2: Access log recording
  it("S-2: reading a phase increments read count", async () => {
    // Get initial status
    const before = await client.callTool({ name: "get_status", arguments: {} });
    const beforeText = (
      before.content as Array<{ type: string; text: string }>
    )[0].text;
    const beforePhase0Line = beforeText
      .split("\n")
      .find((l) => l.includes("Understanding"));
    const beforeReads = parseInt(
      beforePhase0Line?.split("|").pop()?.trim(),
      10,
    );

    // Read phase 0
    await client.readResource({ uri: "process://phase/0" });

    // Get status again
    const after = await client.callTool({ name: "get_status", arguments: {} });
    const afterText = (
      after.content as Array<{ type: string; text: string }>
    )[0].text;
    const afterPhase0Line = afterText
      .split("\n")
      .find((l) => l.includes("Understanding"));
    const afterReads = parseInt(afterPhase0Line?.split("|").pop()?.trim(), 10);

    expect(afterReads).toBe(beforeReads + 1);
  });

  // S-3: Multiple access
  it("S-3: multiple reads increment count", async () => {
    const before = await client.callTool({ name: "get_status", arguments: {} });
    const beforeText = (
      before.content as Array<{ type: string; text: string }>
    )[0].text;
    const beforePhase0Line = beforeText
      .split("\n")
      .find((l) => l.includes("Understanding"));
    const beforeReads = parseInt(
      beforePhase0Line?.split("|").pop()?.trim(),
      10,
    );

    // Read 3 times
    await client.readResource({ uri: "process://phase/0" });
    await client.readResource({ uri: "process://phase/0" });
    await client.readResource({ uri: "process://phase/0" });

    const after = await client.callTool({ name: "get_status", arguments: {} });
    const afterText = (
      after.content as Array<{ type: string; text: string }>
    )[0].text;
    const afterPhase0Line = afterText
      .split("\n")
      .find((l) => l.includes("Understanding"));
    const afterReads = parseInt(afterPhase0Line?.split("|").pop()?.trim(), 10);

    expect(afterReads).toBe(beforeReads + 3);
  });
});
