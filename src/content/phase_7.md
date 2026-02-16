## Phase 7: Deployment and Validation

**Goal**: Place the skill in the appropriate location and verify specification compliance.

### Step 1: Determine Placement

| Location | Scope | Use Case |
|----------|-------|----------|
| `.github/skills/` / `.claude/skills/` / `.agents/skills/` | Project (team shared) | Team standards, project-specific |
| `~/.claude/skills/` / `~/.copilot/skills/` | Personal (all projects) | Individual productivity |
| Plugin | Distributable | Community publishing |

**Skill priority** (when names conflict): enterprise > personal > project

Plugin skills use `plugin-name:skill-name` namespace and don't conflict.

> In VS Code, use the `chat.agentSkillsLocations` setting to configure additional search paths.

### Step 2: Cross-surface Considerations

Skills are **not automatically synced across surfaces**. Each requires separate deployment:

| Surface | Deployment Method | Sharing Scope |
|---------|-------------------|---------------|
| Claude Code | File system placement | Personal or project |
| claude.ai | ZIP upload from settings | Personal only (no team sharing) |
| Claude API | `/v1/skills` endpoint | Entire workspace |

### Step 3: Security Review

Skills carry risk equivalent to software installation. **Only use skills from trusted sources.**

Checklist for team/public skills:
- [ ] No unexpected network calls in scripts
- [ ] File access patterns are appropriate
- [ ] Not fetching data from external URLs (prompt injection risk)
- [ ] `allowed-tools` permits only the minimum necessary tools

### Step 4: Validation

```bash
# Automatically validate frontmatter compliance
skills-ref validate ./my-skill
```

Manual checks:
- [ ] `name` matches directory name
- [ ] `description` includes both "what it does" and "when to use it"
- [ ] SKILL.md body is under 500 lines
- [ ] File references are one level deep
- [ ] Using relative paths

---
