## Phase 1: Scoping and Baseline

### Step 1: Check Existing Skills

**Goal**: Before building, verify whether a similar skill already exists.

| Source | Content |
|--------|---------|
| **Anthropic prebuilt** | pptx, xlsx, docx, pdf skills (available on claude.ai / API) |
| **[anthropics/skills](https://github.com/anthropics/skills)** | Official reference skill collection |
| **[github/awesome-copilot](https://github.com/github/awesome-copilot)** | Community collection |

If an existing skill exists → use as-is or fork and customize.

### Step 2: Mechanism Selection

**Goal**: Determine whether this topic should actually be a Skill.

| Mechanism | Best For | Loading |
|-----------|----------|---------|
| **CLAUDE.md / Custom Instructions** | Rules that should always apply (coding conventions, etc.) | Auto every time |
| **Prompt File** | Repeated but simple tasks | Slash command |
| **Agent Skill** | Complex workflows with scripts/resources, domain expertise | On-demand |

A Skill is appropriate when:
- The task has **multiple steps**
- **Scripts/templates/reference files** are needed
- Should only load **for specific tasks** (not always)
- Needs to be **portable** across multiple agents/tools

### Step 3: Baseline Measurement

**Goal**: Have Claude execute representative tasks without the skill and record failure patterns.

```
1. Select 3-5 representative tasks
2. Execute without the skill
3. Record specific problems in the output:
   - What did it get wrong?
   - What did it not know?
   - Where did it misjudge?
4. Use the record to identify what Claude "truly needs to know"
```

> This record determines the research scope for Phase 2 onward.
> Don't research everything — only research **information that fills the failures**.

---
