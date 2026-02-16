# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in skill-forge-mcp, please report it responsibly.

### How to Report

1. **Do NOT open a public GitHub issue** for security vulnerabilities.
2. Report via [GitHub Security Advisories](https://github.com/popyson1648/skill-forge-mcp/security/advisories/new) with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes (optional)

### What to Expect

- **Acknowledgment**: Within 48 hours of your report.
- **Initial Assessment**: Within 7 days, we will assess the severity and validity.
- **Resolution Timeline**: Critical issues will be addressed within 30 days; lower-severity issues may take longer.
- **Disclosure**: We will coordinate with you on public disclosure timing.

### Scope

This policy applies to:
- The skill-forge-mcp npm package
- The source code in this repository
- Configuration and state file handling

### Out of Scope

- Issues in dependencies (please report to the respective maintainers)
- Social engineering attacks
- Issues requiring physical access to a user's machine

## Security Best Practices for Users

1. **Keep your installation up to date** — run `npm update skill-forge-mcp` regularly.
2. **Review environment variables** — be cautious with `SKILL_FORGE_PERSIST=true` as it writes to disk.
3. **Use trusted sources** — only install from npm or the official GitHub repository.

Thank you for helping keep skill-forge-mcp secure!
