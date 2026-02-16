## Phase 0: Understanding the Skill Specification (First Time Only)

Common specification for all skills. Once understood, refer back as needed.

### SKILL.md Structure

```
skill-name/
├── SKILL.md          # Required: Main instructions
├── scripts/          # Optional: Executable code
├── references/       # Optional: Additional documentation
└── assets/           # Optional: Templates, resources
```

### Frontmatter (Required Header)

```yaml
---
name: skill-name              # Required: 1-64 chars, lowercase alphanumeric + hyphens
description: What and when     # Required: 1-1024 chars
argument-hint: "[file] [opts]" # Optional
user-invokable: true           # Optional (default true)
disable-model-invocation: false # Optional (default false)
allowed-tools: Read, Grep      # Optional (experimental)
license: Apache-2.0            # Optional
compatibility: Requires git    # Optional: 1-500 chars
metadata:                      # Optional: arbitrary key-value pairs
  author: example-org
  version: "1.0"
# --- Claude Code specific fields ---
context: fork                  # Optional: sub-agent execution
agent: Explore                 # Optional: agent type for context: fork
model: claude-sonnet           # Optional: per-skill model override
hooks: ...                     # Optional: lifecycle hooks
---
```

**name rules**:
- Lowercase alphanumeric + hyphens only. Gerunds recommended (e.g., `processing-pdfs`)
- Cannot start/end with `-`, no consecutive hyphens (`--`)
- Must not contain XML tags
- Must not include reserved words `anthropic`, `claude`
- Must match parent directory name

**description rules**:
- Must not contain XML tags
- Use third person (✗ "I can help" / ✗ "You can use" / ✓ "Processes files and generates...")
- Include both "what it does" and "when to use it"
- Include key terms for agent selection

### Progressive Disclosure (3-Level Loading)

| Level | Load Timing | Content | Budget |
|-------|-------------|---------|--------|
| L1: Discovery | At startup (always) | `name` + `description` only | ~100 tokens |
| L2: Instructions | When task matches description | SKILL.md body | < 5000 tokens recommended |
| L3: Resources | When referenced in body | scripts/, references/, assets/ | Minimum necessary |

→ SKILL.md body should be **under 500 lines**. Separate details into other files; limit to one level of reference.

### Skill Types

| Type | Purpose | Example |
|------|---------|---------|
| **Reference** | Adding knowledge/rules | API conventions, coding standards |
| **Task** | Action procedures | Deployment, test execution |

### Freedom Levels

| Freedom | Use Case | Description Method |
|---------|----------|-------------------|
| **High** | Multiple valid approaches | Text instructions |
| **Medium** | Recommended patterns exist | Pseudocode / parameterized scripts |
| **Low** | Exact procedure required | Concrete scripts |

> Analogy: "Bridge with cliffs on both sides" → low freedom, "Open field with no obstacles" → high freedom

### Invocation Control

| Setting | `/` Menu | Auto-load | Use Case |
|---------|----------|-----------|----------|
| Default | ✅ | ✅ | General-purpose skill |
| `user-invokable: false` | ❌ | ✅ | Background knowledge |
| `disable-model-invocation: true` | ✅ | ❌ | On-demand only |

### Claude Code Specific Advanced Features

| Feature | Syntax/Field | Purpose |
|---------|-------------|---------|
| **Argument passing** | `$ARGUMENTS`, `$0`, `$1` | Pass args via `/skill arg1 arg2` |
| **Dynamic context injection** | `` !`command` `` | Inject shell output into skill at runtime |
| **Sub-agent execution** | `context: fork` | Run in isolated environment (exploratory tasks) |
| **Extended Thinking** | Include `ultrathink` in body | Complex reasoning scenarios |
| **Tool restriction** | `allowed-tools: Read, Grep` | Safety enforcement |
| **Model override** | `model: claude-sonnet` | Cost/quality tradeoff |
| **Session ID** | `${CLAUDE_SESSION_ID}` | Logging and session-specific file generation |

> **Note**: These are Claude Code specific. Using them reduces portability to VS Code Copilot, Cursor, etc.

---
