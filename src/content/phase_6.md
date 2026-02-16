## Phase 6: Distillation into SKILL.md

**Goal**: Condense all research into a practical skill of 500 lines or fewer.

### Step 1: "Does Claude Already Know This?" Filter

Before distilling, apply this filter to all research results:

| Question | Result |
|----------|--------|
| Does Claude already know this? | → **Remove** (general knowledge) |
| Do we want to change Claude's default behavior? | → **Keep** (rules/constraints) |
| Is this project/domain-specific information? | → **Keep** (domain-specific knowledge) |
| Does it contain specific code examples or tool names? | → **Keep** (implementation clues) |

Examples:
- ❌ "Responsive design adapts layout to screen size" → Claude already knows this
- ✅ "Use rem instead of px for breakpoints" → Changes default behavior
- ✅ "This project uses Tailwind; custom CSS is prohibited" → Project-specific rule

### Step 2: Skill Design Decisions

Before writing SKILL.md, decide:

| Decision | Options | Criteria |
|----------|---------|----------|
| Skill type | Reference / Task | Adding knowledge vs. executing procedures |
| Freedom level | High / Medium / Low | Failure risk, range of correct answers |
| Invocation mode | Auto / User-only / Both | Frequency, impact scope |
| Scripts needed | Yes / No | Need for verification/automation |
| Templates needed | Yes / No | Strictness of output format |
| Reference file structure | Flat / By domain / By condition | Information volume and classification |
| Portability | Standard only / Include Claude Code specifics | Target agent scope |

**Portability tradeoff**:
- **Standard only** (agentskills.io spec): Works on VS Code Copilot, Claude Code, Cursor, Goose, Amp, etc.
- **Include Claude Code specifics** (`context: fork`, `` !`cmd` ``, `$ARGUMENTS`, etc.): Powerful but won't work on other tools

→ Personal skills: Claude Code specifics OK. Team/public skills: stick to standard.

### Step 3: Distillation and Writing

| Step | Action |
|------|--------|
| 3a | Convert filtered information into instructions/rules/checklist format |
| 3b | Set YAML frontmatter (name, description, invocation control, etc.) |
| 3c | Structure body following Progressive Disclosure |
| 3d | Keep within 500 lines / ~5000 tokens |

### Distillation Priority

When information exceeds 500 lines, prioritize in this order:

1. **Rules and prohibitions** — Things that degrade quality if broken
2. **Checklists** — Items to verify after every implementation
3. **Decision criteria / decision flows** — Guidance when choices are unclear
4. **Patterns and usage** — Representative implementation patterns
5. **Theory/principles summary** — Minimal justification for decisions
6. **Concrete examples** — As space permits

### Writing Patterns

Use purpose-appropriate writing patterns for distilled content:

| Pattern | Use Case | Example |
|---------|----------|---------|
| **Template pattern** | Strict output format | `ALWAYS use this exact template:` |
| **Examples pattern** | Show style via input/output pairs | Good vs. bad comparison |
| **Conditional branching** | Situation-dependent responses | `Creating? → A workflow / Editing? → B workflow` |
| **Feedback loop** | Quality-critical iterative work | `Execute → Verify → Fix → Re-verify` |
| **Default + exception** | Narrow choices for efficiency | Present one default; describe alternatives only for exceptions |
| **Plan-validate-execute** | Batch operations / destructive changes | Create plan file → verify with script → execute |

### Content Writing Guidelines

- **Avoid time-dependent information**: Don't write "Before August 2025, use the old API." Wrap legacy info in `<details>`.
- **Terminology consistency**: Don't use multiple terms for the same concept (e.g., don't mix "API endpoint", "URL", and "path").
- **Add a table of contents for reference files over 100 lines.**
- **Reference MCP tools by fully qualified name**: `BigQuery:bigquery_schema`, `GitHub:create_issue`

### Runtime Environment Constraints

When building skills with scripts, consider deployment environment constraints:

| Surface | Network | Package Installation | Notes |
|---------|---------|---------------------|-------|
| **Claude Code** | ✅ Full access | Local recommended | Avoid global installs |
| **claude.ai** | ⚠️ Config dependent | npm, PyPI, GitHub available | May be restricted by admin settings |
| **Claude API** | ❌ No access | ❌ Cannot install | Use pre-installed packages only |

→ For multi-surface skills, design for the most constrained environment.

### Writing Anti-patterns

| Anti-pattern | Remedy |
|-------------|--------|
| Windows-style paths (`\`) | Always use forward slashes (`/`) |
| Too many options presented | One default + exceptions only |
| Delegating error handling to Claude | Handle errors explicitly in scripts |
| Magic numbers | Comment every constant with its rationale |
| Assuming tool installation | Check and list dependent packages |
| Deep reference chains | SKILL.md → reference files: one level only |

---
