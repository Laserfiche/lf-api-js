---
name: regen-js-client
description: This skill should be used when the user wants to "regenerate the JS V2 client", "regen lf-api-js", "update the JS swagger client", "refresh the lf-repository-api-client-v2 client", "pull new V2 methods into JS tests", or otherwise rebuild the NSwag-generated client in `lf-repository-api-client-v2`. Use it eagerly whenever a server-side V2 endpoint has just been added or modified — even if the user only says "sync the client" or "update the JS library". The skill bakes in six known traps (swagger-override file, baseUrl trailing-slash, jsdom multipart skip, OpenApiTag client-split, the optional-multipart patch step, and the ClientBase.ts splice-into-index.ts ordering) without which the regen silently breaks the entire test suite or leaves new clients unreachable.
---

# Regenerate the JS V2 client

Procedural guide for refreshing the NSwag-generated client in `lf-api-js/packages/lf-repository-api-client-v2/` against a server's swagger.

## Why JS integration tests matter (they are not redundant with the dotnet suites)

The JS client is an **independent NSwag-generated TypeScript codebase** — its own URL builder,
`fromJS`/`toJSON` serialization, multipart/FormData path, discriminator dispatch, and baseUrl handling.
The two dotnet suites (`site-api-repository/SiteApiRepositoryREST` and
`lf-repository-api-client-dotnet/tests/integration`) both drive the *dotnet* generated client and
execute **none** of this code. So the JS suite (`test/`) is the **only** client-side layer that catches
JS-specific routing/serialization bugs — the class of bug that has historically surfaced **first in the
JS client**. When a new/changed endpoint lands, regen this client and add functional integration tests
the same day; that coverage is complementary, not overlap.

Validate new tests against a **local server** before the PR (throw-away regen + `.env`; Traps 2 and 3
below). Worked example: the folder-path feature's `CreateEntryFolderPath.test.ts` +
`ImportFolderPath.test.ts` (2026-07-23, 13/13 node). Full rationale:
`site-api-repository/docs/analysis-dotnet-integration-test-overlap.md`.

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

# Then run NSwag against the downloaded swagger to regenerate the client TS,
# followed by the multipart null-check patch (see Trap 5 — do not skip this):
npx nswag run generate-client/nswag.json
py generate-client/patch_optional_multipart.py
```

Equivalently, `npm run nswag` from the package root runs both of the above in one step (it's wired as `nswag run generate-client/nswag.json && node generate-client/run-patch.js`, and `run-patch.js` is just a Python-interpreter-finding wrapper around `patch_optional_multipart.py`). Prefer `npm run nswag` over calling `nswag` directly so you don't forget the patch step.

If you hand-edit `ClientBase.ts` (e.g. to wire up a new top-level client accessor — see Trap 6), do it **before** running the regen commands above, not after: `index.ts` is not just built alongside `ClientBase.ts`, its content is spliced in wholesale by NSwag at generation time, so edits made after the last regen are invisible until you regen again.

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

**A brand-new `[OpenApiTag]` value (not an existing one like `Entries`) means a brand-new top-level client class** (e.g. adding an `Annotations`/`Stamps` tag emits `AnnotationsClient`/`StampsClient`, entirely separate from `EntriesClient`). That new class is unreachable from `_RepositoryApiClient.*` until it's wired into `ClientBase.ts` — see Trap 6. Discovering a new class name here is the trigger to go do that.

## Trap 5 — `nswag` alone doesn't patch optional multipart parameters

`npx nswag run generate-client/nswag.json` on its own is **not** the full regen — it's half of the `npm run nswag` script, which is `nswag run generate-client/nswag.json && node generate-client/run-patch.js`. `run-patch.js` runs `generate-client/patch_optional_multipart.py`, which rewrites NSwag's generated null-checks for multipart form-data parameters.

- NSwag always emits `if (x === null || x === undefined) throw new Error("The parameter 'x' cannot be null.")` for every multipart property, regardless of whether the swagger schema actually marks it `required`. For a parameter the server accepts as absent (`imageFiles` on `importEntry`, optional request bodies on `createPages`/`replacePages`/`updateDocument`/`writePage`, etc.), this turns a legitimate omission into a client-side crash.
- `patch_optional_multipart.py` reads `swagger.json` + `index.ts` (both must already exist from the steps above) and rewrites each such block to `if (x !== null && x !== undefined) <append to FormData>` for parameters not in that operation's multipart `required` list. It's idempotent — safe to re-run.
- **Symptom if skipped:** any test that calls one of the affected methods *without* the optional param throws `Error: The parameter '<name>' cannot be null.` instead of succeeding. This looks like a real regression but is just a skipped regen step.
- Run `py generate-client/patch_optional_multipart.py` (or `npm run nswag`, which includes it) after **every** `nswag run` invocation, including re-runs triggered by a `ClientBase.ts` edit (Trap 6) — it patches `index.ts`, which regen just overwrote.

## Trap 6 — `ClientBase.ts` is spliced into `index.ts`, not just co-exported

`generate-client/nswag.json` sets `"extensionCode": "../ClientBase.ts"`. This is not a plain TypeScript import/re-export relationship — NSwag reads `ClientBase.ts` and **splices its contents directly into `index.ts` at generation time** (with `generated.` module-qualifier prefixes stripped, since both end up in the same file). `ClientBase.ts` is where the consumer-facing `IRepositoryApiClient`/`RepositoryApiClient` facade lives, wiring each generated per-tag client class (`AttributesClient`, `EntriesClient`, `TasksClient`, …) into a named accessor (`attributesClient`, `entriesClient`, `tasksClient`, …).

- **Whenever a regen introduces a brand-new top-level client class** (per Trap 4 — a genuinely new `[OpenApiTag]` value, not a rename), you must manually add three things to `ClientBase.ts`: the field in the `IRepositoryApiClient` interface, the `public` property declaration on `RepositoryApiClient`, and the constructor assignment (`this.xClient = new generated.XClient(this.baseUrl, http);` — use the plain `generated.IXClient`/`generated.XClient` pattern already used for `tasksClient`/`auditReasonsClient`/etc. unless the new client needs hand-written pagination helpers like `EntriesClient`/`AttributesClient` do). Forgetting this step leaves the new class fully generated in `index.ts` but completely unreachable via `_RepositoryApiClient.*` — this exact gap shipped in one PR (a new `Annotations`/`Stamps` regen that added the classes but never wired the accessors).
- **Edit-then-regen ordering matters.** Because the splice happens *during* generation, editing `ClientBase.ts` after your last `nswag run` has **no effect** on the built `index.ts` — the stale, pre-edit version is what's baked in. Symptom: `_RepositoryApiClient.newClient` is `undefined` at runtime (`TypeError: Cannot read properties of undefined (reading '<method>')`) even though `ClientBase.ts` clearly declares it. Fix: re-run `nswag run generate-client/nswag.json` (then re-run the Trap 5 patch, since it operates on the `index.ts` regen just overwrote) *after* the `ClientBase.ts` edit, not before.

## Post-regen verification

1. `pnpm build` — TypeScript compilation must be clean.
2. `pnpm test:node` first as a fast sanity check, then `pnpm test:all` (or just `pnpm test`).
3. If `pnpm test` reports `TypeError: _RepositoryApiClient.entriesClient.<method> is not a function` → Trap 4.
4. If `pnpm test` reports `The abstract class 'Entry' cannot be instantiated.` → Trap 1.
5. If `pnpm test` reports widespread `Error: Not Found` → Trap 2.
6. If `pnpm test` hangs for ~120s per affected suite → Trap 3.
7. If `pnpm test` reports `Error: The parameter '<name>' cannot be null.` for an omitted optional multipart param → Trap 5 (patch step skipped).
8. If `pnpm test`/`tsc` reports `TypeError: Cannot read properties of undefined (reading '<method>')` on a `_RepositoryApiClient.<newClient>` accessor that's clearly declared in `ClientBase.ts` → Trap 6 (regen ran before the `ClientBase.ts` edit, not after).

## Bumping and publishing

- The package version lives in `package.json`. Bump per semver based on the surface change (additive minor; breaking major; etc.).
- Update the changelog in this package's `CHANGELOG.md`.
- Publish is via the package's `publish` workflow on GitHub Actions — feature-branch previews and main releases follow distinct paths. The companion [`regen-dotnet-client` skill](../../../lf-repository-api-client-dotnet/.claude/skills/regen-dotnet-client/SKILL.md) covers the dotnet client publish workflow and the in-flight per-branch preview work (work item #659276 Phase 2); JS parity is on the roadmap as a follow-up to that work.

## Reference

The server-side `OpenApiTag` discipline lives in the [`add-v2-endpoint`](../../../../site-api-repository/.claude/skills/add-v2-endpoint/SKILL.md) skill — keep these two skills in sync. If a new server route exposes a new operation, regen this client the same day to keep test coverage current.
