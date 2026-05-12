# AI assistant instructions

This repository ships team-shared playbooks for AI coding assistants under [`.claude/skills/`](../.claude/skills/). Each skill is vendor-neutral Markdown — usable by any AI assistant (Claude Code, GitHub Copilot, Cursor, Codex, …) or human reader. Only Claude Code auto-loads them by frontmatter; other tools should read the relevant `SKILL.md` as a referenced runbook.

Start with [`.claude/skills/README.md`](../.claude/skills/README.md). The primary workflow in this repo is [`regen-js-client`](../.claude/skills/regen-js-client/SKILL.md) — NSwag regen for the JS V2 client plus the four traps that have silently broken the test suite (`--swagger-override-filepath`, baseUrl trailing-slash, jsdom multipart-Blob skip, `[OpenApiTag]` client-split).

For build / run / test instructions see [`README.md`](../README.md).
