# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-07-20

### Added

- Initial release of SkillForge MCP
- MCP server exposing 9-phase Agent Skill creation guide
- Resources: `process://manifest`, `process://phase/{0-8}`
- Resource templates for section and batch retrieval
- Tools: `search_process`, `mark_progress`, `get_status`
- Prompts: `create_skill`, `resume_skill`
- i18n support: English (default) and Japanese (`SKILL_FORGE_LANG=ja`)
- State persistence option (`SKILL_FORGE_PERSIST=true`)
- Structured output with `outputSchema` on all tools
- Comprehensive test suite (52 tests)

[Unreleased]: https://github.com/popyson1648/skill-forge-mcp/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/popyson1648/skill-forge-mcp/releases/tag/v1.0.0
