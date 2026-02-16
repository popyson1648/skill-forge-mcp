# skill-forge-mcp

[![npm version](https://img.shields.io/npm/v/skill-forge-mcp.svg)](https://www.npmjs.com/package/skill-forge-mcp)
[![CI](https://github.com/popyson1648/skill-forge-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/popyson1648/skill-forge-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> [日本語](README.ja.md)

An MCP server that exposes the [Agent Skill](https://github.com/anthropics/skills) creation guide (9 phases) as MCP resources.
AI agents retrieve only the phases they need on demand and follow the process to build SKILL.md files.

## Quick Start

**Claude Code:**

```bash
claude mcp add skill-forge-mcp -- npx skill-forge-mcp
```

**Gemini CLI:**

```bash
gemini mcp add skill-forge-mcp -- npx skill-forge-mcp
```

**VS Code (GitHub Copilot)** — `.vscode/mcp.json`:

```json
{
  "servers": {
    "skill-forge-mcp": {
      "command": "npx",
      "args": ["skill-forge-mcp"]
    }
  }
}
```

**Cursor:**

```json
{
  "skill-forge-mcp": {
    "command": "npx",
    "args": ["skill-forge-mcp"]
  }
}
```

<details>
<summary>Claude Desktop</summary>

```json
{
  "mcpServers": {
    "skill-forge-mcp": {
      "command": "npx",
      "args": ["skill-forge-mcp"]
    }
  }
}
```

</details>

## Usage

Ask your agent:

> "I want to create a skill for React component design. Follow the skill-forge-mcp process."

The agent will automatically:

1. Fetch the process structure from `process://manifest`
2. Read Phase 1 (`process://phase/1`) for scoping, run baseline measurements
3. Record progress with `mark_progress` as it advances through each phase
4. Generate the final SKILL.md following Phase 6 guidelines

Use `search_process` for keyword lookups across phases.

## The 9 Phases

| Phase | Name | Purpose |
|-------|------|---------|
| 0 | Skill Specification | SKILL.md structure and frontmatter |
| 1 | Scoping & Baseline | Measure failure patterns; define research scope |
| 2 | Domain Research | Establish quality criteria and theoretical foundations |
| 3 | Gap Analysis | Verify whether research alone enables the agent to act |
| 4 | Deep Implementation Research | Fill gaps with code examples, anti-patterns, validation |
| 5 | Structuring & Completeness | Confirm coverage across all categories |
| 6 | Distillation into SKILL.md | Condense into ≤500 lines; maximize token efficiency |
| 7 | Deploy & Validate | Place, verify spec compliance, security review |
| 8 | Evaluate & Iterate | Compare against baseline, improve iteratively |

## Features

- **Staged access** — retrieve content at phase or section granularity
- **Cross-phase search** — keyword search across all 9 phases
- **Progress tracking** — record and query per-phase completion status
- **Prompt templates** — `create_skill` and `resume_skill` prompts for guided workflows
- **Structured output** — `outputSchema` + `structuredContent` on all tools for programmatic consumption
- **i18n** — Japanese content available via `SKILL_FORGE_LANG=ja`
- **State persistence** — optionally retain progress across sessions
- **Low overhead** — ~1,500 token fixed cost to the context window

## API

### Resources

| URI | Description |
|-----|-------------|
| `process://manifest` | Full index (JSON) |
| `process://phase/0` – `process://phase/8` | Phase 0–8 content |

### Resource Templates

| Template | Description |
|----------|-------------|
| `process://phase/{phaseId}/section/{sectionName}` | Retrieve a single section |
| `process://phases/{+phaseIds}` | Batch retrieval (e.g. `1,2,3`) |

### Tools

| Tool | Description | Input |
|------|-------------|-------|
| `search_process` | Keyword search across all phases | `{ "query": "frontmatter", "maxResults": 5 }` |
| `mark_progress` | Record phase progress | `{ "phaseId": 1, "status": "in-progress" }` |
| `get_status` | Progress summary for all phases | `{}` |

`status`: `"not-started"` · `"in-progress"` · `"completed"`

### Prompts

| Prompt | Description |
|--------|-------------|
| `create_skill` | Full guided workflow (Phase 0→8). Accepts a `topic` argument. |
| `resume_skill` | Resume from current progress. Checks `get_status` and continues. |

## Configuration

Set `SKILL_FORGE_PERSIST=true` to persist progress to `~/.skill-forge-mcp/state.json`:

```json
{
  "mcpServers": {
    "skill-forge-mcp": {
      "command": "npx",
      "args": ["skill-forge-mcp"],
      "env": { "SKILL_FORGE_PERSIST": "true" }
    }
  }
}
```

Set `SKILL_FORGE_LANG=ja` to serve Japanese content:

```json
{
  "mcpServers": {
    "skill-forge-mcp": {
      "command": "npx",
      "args": ["skill-forge-mcp"],
      "env": { "SKILL_FORGE_LANG": "ja" }
    }
  }
}
```

## Development

```bash
git clone https://github.com/popyson1648/skill-forge-mcp.git
cd skill-forge-mcp
npm install
npm run build
npm test          # 52 tests
```

<details>
<summary>Project structure</summary>

```
src/
├── index.ts        # Entry point
├── content.ts      # Content loading & section extraction
├── search.ts       # Cross-phase search
├── state.ts        # State management & persistence
├── status.ts       # Status table formatter
├── content/        # English content (served)
└── content-ja/     # Japanese originals
tests/
├── content.test.ts
├── search.test.ts
├── state.test.ts
├── resources.test.ts
└── tools.test.ts
```

</details>

**Requirements:** Node.js >= 18

## Contributing

Contributions are welcome! Feel free to open an [Issue](https://github.com/popyson1648/skill-forge-mcp/issues) or submit a Pull Request.

## License

MIT
