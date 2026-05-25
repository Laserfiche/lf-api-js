---
name: regen-js-client
description: This skill should be used when the user wants to "regenerate the JS V2 client", "regen lf-api-js", "update the JS swagger client", "refresh the lf-repository-api-client-v2 client", "pull new V2 methods into JS tests", or otherwise rebuild the NSwag-generated client in `lf-repository-api-client-v2`. Use it eagerly whenever a server-side V2 endpoint has just been added or modified — even if the user only says "sync the client" or "update the JS library". The skill bakes in four known traps (swagger-override file, baseUrl trailing-slash, jsdom multipart skip, OpenApiTag client-split) without which the regen silently breaks the entire test suite.
---

# Regenerate the JS V2 client

Procedural guide for refreshing the NSwag-generated client in `lf-api-js/packages/lf-repository-api-client-v2/` against a server's swagger.

## When to run this

- A new V2 endpoint was added (or an existing one's signature changed) in `site-api-repository`, and JS tests/consumers need to pick it up.
- `download_swagger.py` was last run against an older server build.
- Tests fail with `TypeError: _RepositoryApiClient.entriesClient.<method> is not a function` or `The abstract class 'Entry' cannot be instantiated.` (both are regen-side regressions — see Traps 1 and 4).

## Prerequisites

1. **A swagger source.** Either:
   - A locally running `site-api-repository` server (default: `http://localhost:11211/repository/`), OR
   - A swagger.json checked into `generate-client/swagger.json` (preferred for reproducible regens; see Phase 2 of work item #659276).
2. **`generate-client/swagger-override.json`** present in the repo. This file injects the `Entry` discriminator block that the server-emitted swagger lacks (see Trap 1).
3. **`.env` file** in `lf-api-js/packages/lf-repository-api-client-v2/` if running integration tests post-regen — see Trap 2.
4. **Python on PATH** — use `py` or `C:\Python314\python.exe` on Windows. Avoid `python3` (the Windows Store alias is broken).

## The regen command

From `lf-api-js/packages/lf-repository-api-client-v2/`:

```powershell
py generate-client/download_swagger.py `
    --swagger-url "http://localhost:11211/repository/swagger/v2/swagger.json" `
    --swagger-override-filepath "generate-client/swagger-override.json" `
    --output-filepath "generate-client/swagger.json"

# Then run NSwag against the downloaded swagger to regenerate the client TS:
npx nswag run generate-client/nswag.json
```

After regen: `pnpm install && pnpm build` from the package root.

## Trap 1 — `--swagger-override-filepath` is mandatory

`generate-client/swagger-override.json` injects an `Entry` schema with a `discriminator: { propertyName: "entryType", mapping: { Document, Folder, Shortcut } }` block. NSwag then generates discriminator dispatch in `Entry.fromJS` (`if (data["entryType"] === "Document") return Document.fromJS(...)`).

**Without the override:**
- The server-emitted swagger has only `"x-abstract": true` on Entry (no discriminator block — likely an OData→OpenAPI mapping bug).
- NSwag generates a throw-only `Entry.fromJS` body.
- Every operation that returns an `Entry` (`importEntry`, `getEntry`, `listEntries`, …) fails with `Error: The abstract class 'Entry' cannot be instantiated.` at deserialization time.

**Always pass `--swagger-override-filepath generate-client/swagger-override.json`.** Verify by grepping the regenerated `RepositoryClients.ts` for `Entry.fromJS` — the body should contain `if (data["entryType"] === "Document")`, not a bare `throw`.

## Trap 2 — `.env` baseUrl must NOT have a trailing slash

In `lf-api-js/packages/lf-repository-api-client-v2/.env`:

```
APISERVER_REPOSITORY_API_BASE_URL=http://localhost:11211/repository
                                                                  ^ NO trailing slash
```

**Why:** the NSwag-generated client builds URLs as `this.baseUrl + "/v2/Repositories/..."` — every method's path template starts with `/`. With baseUrl ending in `/`, every request hits `…/repository//v2/…` and the server 404s.

- Symptom: 99 of 100 V2 integration tests fail with `Error: Not Found`. The bare `GET /v2/Repositories` test (unauthenticated discovery) gives a recognizable 401-or-404; the rest 404 silently.
- The dotnet client tolerates a trailing slash (`StringUtils.trimEnd(baseUrl, '/')` in `createFromUsernamePassword`); the JS V2 path through `createFromAccessKey` does not normalize.
- When (re)creating a local `.env`, copy SP key / access key / repo ID from `site-api-repository/SiteAPIRepositoryTests/SharedTest/runSettings/local.runsettings` and `TestingConfig-local.json`, but explicitly write the base URL without a trailing slash.

## Trap 3 — jsdom multipart-Blob test wrapper

Every test suite in `lf-repository-api-client-v2/test/Entries/` that calls `entriesClient.importEntry({ ..., file: { data: blob } })` (or otherwise sends a multipart Blob upload) must be wrapped:

```ts
import { SKIP_UNDER_JSDOM } from "../BaseTest";

describe.skipIf(SKIP_UNDER_JSDOM)("ImportEntry", () => { ... });
```

`SKIP_UNDER_JSDOM` lives in `test/BaseTest.ts` and is wired to `isBrowser()` from `@laserfiche/lf-js-utils`.

**Why:** Vitest + jsdom + isomorphic-fetch hangs indefinitely on multipart Blob fetches (TFS #658052). Without the skip, every affected test sits ~120s before timing out — the V2 `test:browser` run is effectively unbounded.

**The 12 currently-wrapped files** (verify against current state when adding new ones): CheckInCheckOut, CopyPages, CreatePages, GetPageContent, GetPageInfo, ImportEntry, LockDocument, MovePages, ReplacePages, RotateImagePage, UpdateDocument, WritePage.

**Rules:**
- Any new V2 test that calls `importEntry`, `createPages`, `replacePages`, `writePage`, `updateDocument`, or otherwise sends a Blob in multipart form, **must** be wrapped with `describe.skipIf(SKIP_UNDER_JSDOM)`. No exceptions until #658052 closes.
- `BaseTest.CreateEntry` (JSON folder creation, no Blob) is safe under jsdom; tests that only use it do not need the wrapper.
- `pnpm test` is wired to `test:all` (node + browser). Local-only `pnpm test:node` was the original blind spot that let this regression class hide — don't drop back to it.
- **When #658052 closes:** flip `SKIP_UNDER_JSDOM = isBrowser()` to `false` in `BaseTest.ts`, validate, then sweep the 12 files to remove the wrappers and the per-file `SKIP_UNDER_JSDOM` imports in one go.

## Trap 4 — `[OpenApiTag]` splits the JS client into separate classes

`generate-client/nswag.json` sets `operationGenerationMode: "MultipleClientsFromFirstTagAndOperationId"`. **Every unique `[OpenApiTag]` value across server actions becomes its own JS client class.**

- All ~42 V2 actions in `ODataEntriesControllerV2.cs` use `[OpenApiTag("Entries")]`. They end up on a single `EntriesClient` accessible as `_RepositoryApiClient.entriesClient.<methodName>`. Test code and consumers depend on this layout.
- A single outlier tag like `[OpenApiTag("Entries - Document - Pages")]` makes NSwag emit a separate `Entries__Document__PagesClient` (double-underscore-separated, name derived from the tag) — and the method disappears from `EntriesClient`.

**Verification after regen:**

```powershell
# Should print exactly one client class declaration line under entriesClient pattern:
Select-String -Path "src/RepositoryClients.ts" -Pattern "^export class \w+Client"
```

If more than one server-facing client class shows up, the server side has a stray `[OpenApiTag]` value. Fix it in the controller (copy the tag from a peer in the same file) before continuing — re-regen.

The dotnet client (`lf-repository-api-client-dotnet`) uses a different NSwag config that produces a single combined client, so it's unaffected by this trap.

## Post-regen verification

1. `pnpm build` — TypeScript compilation must be clean.
2. `pnpm test:node` first as a fast sanity check, then `pnpm test:all` (or just `pnpm test`).
3. If `pnpm test` reports `TypeError: _RepositoryApiClient.entriesClient.<method> is not a function` → Trap 4.
4. If `pnpm test` reports `The abstract class 'Entry' cannot be instantiated.` → Trap 1.
5. If `pnpm test` reports widespread `Error: Not Found` → Trap 2.
6. If `pnpm test` hangs for ~120s per affected suite → Trap 3.

## Bumping and publishing

- The package version lives in `package.json`. Bump per semver based on the surface change (additive minor; breaking major; etc.).
- Update the changelog in this package's `CHANGELOG.md`.
- Publish is via the package's `publish` workflow on GitHub Actions — feature-branch previews and main releases follow distinct paths. The companion [`regen-dotnet-client` skill](../../../lf-repository-api-client-dotnet/.claude/skills/regen-dotnet-client/SKILL.md) covers the dotnet client publish workflow and the in-flight per-branch preview work (work item #659276 Phase 2); JS parity is on the roadmap as a follow-up to that work.

## Reference

The server-side `OpenApiTag` discipline lives in the [`add-v2-endpoint`](../../../../site-api-repository/.claude/skills/add-v2-endpoint/SKILL.md) skill — keep these two skills in sync. If a new server route exposes a new operation, regen this client the same day to keep test coverage current.
