import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { extractSection, loadPhaseContent, manifest } from "../src/content.js";
import { formatSearchResults, searchAllPhases } from "../src/search.js";
import { createInitialState } from "../src/state.js";
import { formatStatusTable } from "../src/status.js";

function createTestServer() {
  const state = createInitialState();

  const server = new McpServer({
    name: "skill-forge-mcp",
    version: "1.0.0",
  });

  // Register manifest resource
  server.resource(
    "manifest",
    "process://manifest",
    {
      title: "Skill Creation Process — Full Index",
      description:
        "List of all 9 phases. Overview, dependencies, and section structure for each phase. Read this first to understand the overall picture.",
      mimeType: "application/json",
      annotations: { audience: ["assistant"], priority: 1.0 },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(manifest),
        },
      ],
    }),
  );

  // Register phase resources
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

  // Section template
  server.resource(
    "section-by-name",
    new ResourceTemplate("process://phase/{phaseId}/section/{sectionName}", {
      list: undefined,
    }),
    {
      title: "セクション取得",
      description: "特定フェーズ内の特定セクションだけを取得する",
      mimeType: "text/markdown",
    },
    async (uri, params) => {
      const phaseId = Number(params.phaseId);
      const sectionName = String(params.sectionName);
      if (Number.isNaN(phaseId) || phaseId < 0 || phaseId > 8) {
        const error = new Error(
          `Phase ${params.phaseId} does not exist. Valid range: 0-8`,
        );
        (error as Error & { code: number }).code = -32002;
        throw error;
      }
      const text = extractSection(phaseId, sectionName);
      state.accessLog.entries.push({
        timestamp: new Date().toISOString(),
        uri: uri.href,
        phaseId,
        section: sectionName,
      });
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text,
          },
        ],
      };
    },
  );

  // Batch template
  server.resource(
    "phases-batch",
    new ResourceTemplate("process://phases/{+phaseIds}", {
      list: undefined,
    }),
    {
      title: "複数フェーズ一括取得",
      description: "カンマ区切りのフェーズ ID で複数フェーズを一括取得する",
      mimeType: "text/markdown",
    },
    async (_uri, params) => {
      const ids = String(params.phaseIds).split(",").map(Number);
      for (const id of ids) {
        if (Number.isNaN(id) || id < 0 || id > 8) {
          const error = new Error(
            `Phase ${id} does not exist in batch request. Valid range: 0-8`,
          );
          (error as Error & { code: number }).code = -32002;
          throw error;
        }
      }
      const contents = ids.map((id) => ({
        uri: `process://phase/${id}`,
        mimeType: "text/markdown" as const,
        text: loadPhaseContent(id),
      }));
      for (const id of ids) {
        state.accessLog.entries.push({
          timestamp: new Date().toISOString(),
          uri: `process://phase/${id}`,
          phaseId: id,
        });
      }
      return { contents };
    },
  );

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
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ query, maxResults }) => ({
      content: [
        {
          type: "text" as const,
          text: formatSearchResults(query, searchAllPhases(query, maxResults)),
        },
      ],
    }),
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
      annotations: {
        readOnlyHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ phaseId, status, note }) => {
      state.progress[String(phaseId)] = {
        status,
        note: note ?? "",
        updatedAt: new Date().toISOString(),
      };
      return {
        content: [
          {
            type: "text" as const,
            text: `Phase ${phaseId} marked as '${status}'.`,
          },
        ],
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

  return { server, state };
}

describe("resources integration", () => {
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

  // R-1: Manifest retrieval
  it("R-1: reads manifest resource", async () => {
    const result = await client.readResource({ uri: "process://manifest" });
    expect(result.contents[0].mimeType).toBe("application/json");
    const parsed = JSON.parse(result.contents[0].text as string);
    expect(parsed.phases.length).toBe(9);
  });

  // R-2: Phase 0 retrieval
  it("R-2: reads Phase 0", async () => {
    const result = await client.readResource({ uri: "process://phase/0" });
    expect(result.contents[0].mimeType).toBe("text/markdown");
    expect(result.contents[0].text).toContain("Phase 0");
  });

  // R-3: Phase 8 retrieval
  it("R-3: reads Phase 8", async () => {
    const result = await client.readResource({ uri: "process://phase/8" });
    expect(result.contents[0].text).toContain("Evaluation and Iteration");
  });

  // R-4: Section retrieval
  it("R-4: reads a specific section", async () => {
    const result = await client.readResource({
      uri: "process://phase/0/section/frontmatter",
    });
    expect(result.contents[0].text).toContain("Frontmatter");
    const fullPhase = await client.readResource({ uri: "process://phase/0" });
    expect((result.contents[0].text as string).length).toBeLessThan(
      (fullPhase.contents[0].text as string).length,
    );
  });

  // R-5: Overview section
  it("R-5: reads overview section", async () => {
    const result = await client.readResource({
      uri: "process://phase/1/section/overview",
    });
    expect(result.contents[0].text).not.toContain("### ");
  });

  // R-6: Batch retrieval
  it("R-6: reads batch phases", async () => {
    const result = await client.readResource({ uri: "process://phases/0,1,2" });
    expect(result.contents.length).toBe(3);
  });

  // R-7: Nonexistent phase
  it("R-7: errors on nonexistent phase", async () => {
    await expect(
      client.readResource({ uri: "process://phase/9" }),
    ).rejects.toThrow();
  });

  // R-8: Nonexistent section
  it("R-8: errors on nonexistent section with available list", async () => {
    await expect(
      client.readResource({ uri: "process://phase/0/section/nonexistent" }),
    ).rejects.toThrow();
  });

  // R-10: Batch with invalid ID
  it("R-10: errors on batch with invalid ID", async () => {
    await expect(
      client.readResource({ uri: "process://phases/1,99" }),
    ).rejects.toThrow();
  });

  // R-11: resources/list
  it("R-11: lists 10 resources", async () => {
    const result = await client.listResources();
    expect(result.resources.length).toBe(10);
  });

  // R-12: templates/list
  it("R-12: lists 2 resource templates", async () => {
    const result = await client.listResourceTemplates();
    expect(result.resourceTemplates.length).toBe(2);
  });
});
