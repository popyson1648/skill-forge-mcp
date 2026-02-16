#!/usr/bin/env node
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  extractSection,
  getLocale,
  getManifest,
  loadPhaseContent,
} from "./content.js";
import { formatSearchResults, searchAllPhases } from "./search.js";
import { loadState, saveState } from "./state.js";
import { formatStatusTable } from "./status.js";

// Resolve locale once at startup
const locale = getLocale();
const manifest = getManifest(locale);

// Initialize state (restore from file if persistence enabled, or create new)
const state = loadState();

// 1. Create server instance
const server = new McpServer({
  name: "skill-forge-mcp",
  version: "1.0.0",
});

// ─── 2. Register static Resources (10: manifest + 9 phases) ────────────────

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

// Register Phase 0-8 in a loop
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
            text: loadPhaseContent(phase.id, locale),
          },
        ],
      };
    },
  );
}

// ─── 3. Register Resource Templates ────────────────────────────────────────

server.resource(
  "section-by-name",
  new ResourceTemplate("process://phase/{phaseId}/section/{sectionName}", {
    list: undefined,
  }),
  {
    title: "Get Section",
    description:
      "Retrieve a specific section within a phase. phaseId: 0-8, sectionName: manifest phases[N].sections[].name",
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

    const text = extractSection(phaseId, sectionName, locale);
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

server.resource(
  "phases-batch",
  new ResourceTemplate("process://phases/{+phaseIds}", {
    list: undefined,
  }),
  {
    title: "Batch Phase Retrieval",
    description:
      "Retrieve multiple phases at once using comma-separated phase IDs. Example: process://phases/1,2,3",
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
      text: loadPhaseContent(id, locale),
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

// ─── 4. Register Tools (new API: registerTool with outputSchema) ───────────

const SearchResultSchema = z.object({
  phaseId: z.number().describe("Phase ID where match was found"),
  sectionName: z.string().describe("Section name within the phase"),
  lineNumber: z.number().describe("Line number of the match"),
  lineText: z.string().describe("Matched line text"),
});

server.registerTool(
  "search_process",
  {
    title: "Search Process",
    description:
      "Search all phases of the skill creation process by keyword. Case-insensitive partial match. Returns matching phase IDs, section names, and matched lines.",
    inputSchema: {
      query: z
        .string()
        .describe("Search keyword (case-insensitive partial match)"),
      maxResults: z
        .number()
        .int()
        .min(1)
        .max(50)
        .default(5)
        .describe("Maximum number of results to return"),
    },
    outputSchema: {
      total: z.number().describe("Total number of matches found"),
      results: z
        .array(SearchResultSchema)
        .describe("Array of matching results with location info"),
    },
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async ({ query, maxResults }) => {
    const results = searchAllPhases(query, maxResults, locale);
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
    description:
      "Record progress status for a phase. status: 'not-started' | 'in-progress' | 'completed'.",
    inputSchema: {
      phaseId: z.number().int().min(0).max(8).describe("Phase ID (0-8)"),
      status: z
        .enum(["not-started", "in-progress", "completed"])
        .describe("Phase status"),
      note: z
        .string()
        .optional()
        .describe(
          "Optional note (e.g., '2 gaps from Phase 3 to address in Phase 4')",
        ),
    },
    outputSchema: {
      phaseId: z.number().describe("Phase ID that was updated"),
      status: z.string().describe("New status value"),
      updatedAt: z.string().describe("ISO 8601 timestamp of the update"),
    },
    annotations: {
      readOnlyHint: false,
      idempotentHint: true,
      destructiveHint: false,
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
    // Persist immediately so progress isn't lost on crash
    saveState(state);
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

const PhaseStatusSchema = z.object({
  phaseId: z.number().describe("Phase ID"),
  name: z.string().describe("Phase name"),
  status: z.string().describe("Current status"),
  reads: z.number().describe("Number of times this phase was accessed"),
});

server.registerTool(
  "get_status",
  {
    title: "Get Status",
    description:
      "Return a summary of all phase progress (not-started/in-progress/completed) and access counts.",
    inputSchema: {},
    outputSchema: {
      phases: z.array(PhaseStatusSchema).describe("Status of each phase"),
    },
    annotations: {
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async () => {
    const table = formatStatusTable(state, locale);
    const phases = manifest.phases.map(
      (phase: { id: number; name: string }) => {
        const p = state.progress[String(phase.id)];
        const reads = state.accessLog.entries.filter(
          (e) => e.phaseId === phase.id,
        ).length;
        return { phaseId: phase.id, name: phase.name, status: p.status, reads };
      },
    );
    return {
      content: [{ type: "text" as const, text: table }],
      structuredContent: { phases },
    };
  },
);

// ─── 5. Register Prompts ───────────────────────────────────────────────────

server.registerPrompt(
  "create_skill",
  {
    title: "Create Skill",
    description:
      "Guide the agent through the full skill creation process (Phase 0→8). Provide a topic and the agent will follow the structured workflow.",
    argsSchema: {
      topic: z
        .string()
        .describe(
          "The skill topic to create (e.g., 'React component design', 'Python error handling')",
        ),
    },
  },
  async ({ topic }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: [
            `I want to create an Agent Skill for: "${topic}"`,
            "",
            "Please follow the SkillForge MCP process:",
            "1. Read process://manifest to understand the full 9-phase workflow",
            "2. Start from Phase 0 to understand the SKILL.md specification",
            "3. Work through each phase sequentially (Phase 1→8)",
            "4. Use mark_progress to record your progress on each phase",
            "5. Use search_process if you need to find specific guidance",
            "6. Generate the final SKILL.md at Phase 6",
            "7. Deploy and validate in Phases 7-8",
            "",
            "Begin by reading the manifest.",
          ].join("\n"),
        },
      },
    ],
  }),
);

server.registerPrompt(
  "resume_skill",
  {
    title: "Resume Skill Creation",
    description:
      "Resume a skill creation session. Checks current progress and continues from where you left off.",
  },
  async () => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: [
            "I want to resume my skill creation session.",
            "",
            "Please:",
            "1. Call get_status to check my current progress",
            "2. Identify the next incomplete phase",
            "3. Read that phase's content and continue the workflow",
            "4. Use mark_progress as you complete each phase",
          ].join("\n"),
        },
      },
    ],
  }),
);

// ─── 6. Transport connection and startup ───────────────────────────────────

async function runServer() {
  const transport = new StdioServerTransport();

  const handleExit = () => {
    saveState(state);
    process.exit(0);
  };

  process.on("SIGTERM", handleExit);
  process.on("SIGINT", handleExit);

  process.stdin.on("close", () => {
    saveState(state);
  });

  await server.connect(transport);
  console.error("SkillForge MCP server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
