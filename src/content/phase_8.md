## Phase 8: Evaluation and Iteration

**Goal**: Verify the skill actually works and improve it.

### Step 1: Build Evaluation Scenarios

Prepare at least 3 evaluation scenarios **after** skill creation:

| Scenario Type | Content |
|--------------|---------|
| **Basic task** | Most typical use case for the skill |
| **Edge case** | Boundary conditions or exceptional situations |
| **Composite task** | Combined use with other skills or information |

Evaluation scenario format example:

```json
{
  "skills": ["my-skill-name"],
  "query": "Actual user request",
  "files": ["test-files/sample-input.ext"],
  "expected_behavior": [
    "Expected behavior 1",
    "Expected behavior 2"
  ]
}
```

### Step 2: A/B Testing Pattern

> 1. **Claude A** (Expert): Responsible for skill design and improvement
> 2. **Claude B** (User): Executes actual tasks using the skill
> 3. Observe Claude B's behavior → Feed back to Claude A → Improve

### Step 3: Iteration Loop

```
Run evaluation scenario → Observe output → Identify problems → Fix SKILL.md → Re-evaluate
```

#### 3a: Output Quality Check

- Is the skill auto-invoked at (and only at) the intended timing?
- Is output quality improved vs. without the skill (Phase 1 baseline)?
- Is token consumption reasonable (not loading excessive information)?
- Does it work as expected across different models (Haiku / Sonnet / Opus)?

#### 3b: Observing Claude's Navigation

Observe Claude's behavior along these 4 dimensions when using the skill:

| Dimension | Meaning | Action |
|-----------|---------|--------|
| **Unexpected exploration path** | Reads files in unintended order | Review structure and links |
| **Missed references** | Doesn't follow references to important files | Make links more explicit |
| **Over-reliance on specific sections** | Repeatedly reads the same file | Move that content into SKILL.md body |
| **Unused content** | Never accesses bundled files | Consider removal |

#### 3c: Conciseness and Architecture Review

On each iteration, also check:
- **Conciseness**: "Can we remove explanations Claude already knows?"
- **Information architecture**: "Should content be separated into another file? Can the structure be improved?"

### Troubleshooting

| Problem | Solution |
|---------|----------|
| **Skill doesn't activate** | Check description keywords. Test with `/skill-name` direct invocation |
| **Skill activates too often** | Make description more specific. Consider `disable-model-invocation: true` |
| **Context budget exceeded** | Total description budget is 2% of context window. Reduce skill count or shorten descriptions |
| **Unstable output** | Lower freedom level (text instructions → scripts). Fix output format with templates |

---
