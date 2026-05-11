# Claude Code skills — lf-api-js

This directory holds team-shared playbooks (skills) that AI coding assistants load on demand for specific workflows in this repo. Skills keep the project's tribal knowledge out of always-loaded instruction files and surface it only when the matching task comes up.

## How discovery works

- **Claude Code** auto-scans `.claude/skills/*/SKILL.md` and reads each skill's YAML frontmatter (`name`, `description`). The body is loaded only when the description matches the user's request — "progressive disclosure".
- **Other AI assistants** (Cursor, Continue, Codex, etc.) can read the same SKILL.md files as plain Markdown playbooks. Bodies are written in vendor-neutral imperative form so they work as checklists for any tool — only the frontmatter is Claude-specific metadata.
- **Humans** read this README and the individual SKILL.md files directly.

## Skills in this repo

| Skill | When it triggers | Lives in |
|---|---|---|
| [regen-js-client](./regen-js-client/SKILL.md) | Regenerating the NSwag-built V2 client in `packages/lf-repository-api-client-v2` (swagger download + override, NSwag run, post-regen verification, and the four traps: swagger-override file, baseUrl trailing-slash, jsdom multipart skip, OpenApiTag client-split). | [`regen-js-client/`](./regen-js-client/) |

## Authoring a new skill

1. **Structure** — one directory per skill:
   ```
   .claude/skills/<skill-name>/
   ├── SKILL.md            (required)
   ├── references/         (optional — detail loaded as needed)
   ├── scripts/            (optional — executable helpers)
   └── assets/             (optional — templates, etc.)
   ```
2. **YAML frontmatter** — `name` and `description` are required. Description in third person with specific trigger phrases the user would actually say. Skew slightly pushy on triggers — undertriggering is the common failure mode.
3. **Body style** — imperative/infinitive ("Run X", "Verify Y"). Aim for ≤ 500 lines; push deeper material into `references/` and link to it from SKILL.md.
4. **Vendor-neutral body** — don't reference Claude Code–specific tool names. Say "edit the file" / "run the command" so the playbook works for any assistant.
5. **Discoverability** — add a row to the table above.

## Cross-repo coordination

Server-side endpoint conventions (`[OpenApiTag]`, route shape, swagger metadata) live in [`site-api-repository/.claude/skills/add-v2-endpoint`](../../../site-api-repository/.claude/skills/add-v2-endpoint/SKILL.md). Keep this client's `regen-js-client` skill in sync with that one — a server-side tag drift breaks the JS client silently.
