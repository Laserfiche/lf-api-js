# Changelog

## 1.5.0

### Features

- Add alternate electronic document methods: `listAlternateEdocs`, `getAlternateEdocInfo`, `writeAlternateEdoc`, `deleteAlternateEdoc`, `writeAltEdocUploadedParts`. A document can carry named binary streams alongside its primary electronic document, and these travel with it through copy, move, versioning and briefcase operations. A write is create-or-replace and repeating an identical request is safe; the primary electronic document, the pages and the metadata are never touched. Names are at most 15 characters from a restricted ASCII set and are matched exactly, with no case folding — a write whose name differs from an existing stream's only in letter case is refused with 409 rather than performed.
- `ExportEntryRequestPart.AlternateEdoc` and `alternateEdocName` on both export request types, so a written stream can be read back. `exportEntry` and `startExportEntry` return the named stream through the same audited export flow used for the electronic document. Without these an alternate electronic document could be written through this client but never downloaded.
- `hasAlternateEdocs` on the document response reports whether a document carries any, so a caller can tell whether to enumerate without a second call. It is populated on a single-entry `getEntry` and is `null` in listing results, where the value is not determined — `null` means "not determined here" rather than "none".
- Add page word location methods: `getPageTextOffsets` returns the page text span covered by a rectangle drawn on a page image, as UTF-16 offsets plus the text; `listPageWordLocations` returns every word of a page in reading order with its text offsets and its rectangle, plus the geometry those coordinates use. Coordinates are raw unrotated image pixels, not display pixels, and `textEnd` is exclusive — the same convention text-linked annotations use, so a span read here writes straight back.

### Breaking changes

- **Overwrite requests must carry their collection member.** `setTags`, `setLinks`, `setFields` and the five access-control setters (`setEntryAccessControl`, `setFieldAccessControl`, `setDefaultFieldAccessControl`, `setTemplateAccessControl`, `setDefaultTemplateAccessControl`) are overwrite operations. A request whose body does not carry the collection member at all is now rejected with a `400` naming the expected member, instead of being applied as an empty collection. Previously such a request succeeded and cleared everything the entry, field or template had — and on the access-control routes, dropping an explicit Deny could let a trustee fall back to an inherited Allow, so a malformed request could widen access. Sending the member with an explicit empty array is unchanged and remains the documented way to clear.

### Behavior changes

- `exportEntry` and `startExportEntry` now answer `400` up front, instead of failing inside the export service with a `500`, when `part` is `Image` on a document whose pages carry no image data, or `Text` on a document whose pages carry no text. Text is extracted asynchronously after an import, so a document may briefly have pages and no text — poll `hasText` on `listPageInfos` and retry once it reports true. A document with no pages at all is not rejected here.
- The download link an export returns is single-use: the first GET returns the file and any later GET of the same link answers `404`, with no problem details, because that response comes from the download service rather than from the API. Save the content on the first download and start a new export if a download has to be retried.
- `moveTemplateField` returns `400` naming the valid range, instead of `500` with a raw framework message, when `newPosition` is past the last field.
- Operations the repository server does not support (error code `7002`) return `400` instead of `500`. The refusal is deterministic — the same request can never succeed against that server — so a `500` invited retries that could not help. The error code is unchanged, so the condition remains identifiable.
- `createAnnotation` and `updateAnnotation` responses now report the stored values for `pageNumber`, `creator`, `createdTime` and `lastModifiedTime`. Previously the create response reported page 1 regardless of the page annotated, a null creator and `0001-01-01T00:00:00Z` timestamps, and the update response reported the pre-update `lastModifiedTime`. Stored data was never affected.
- `createTemplate` is now all-or-nothing when given initial `fields`: if any initial field assignment fails the template is deleted before the error is returned, so a retry no longer fails with `409 Object already exists` for a name that was never successfully used.
- Cross-origin responses no longer include `Access-Control-Allow-Credentials`. Requests authenticated with a bearer `Authorization` header — the supported authentication for this API — are unaffected, because that header does not require the credentials grant. Only browser requests relying on browser-managed credentials (for example `fetch` with `credentials: 'include'`) are affected, and those were never a supported authentication path.

## 1.4.1

### Maintenance

- Update version of lf-js-utils dependency

## 1.4.0

### Features

- Add optional `folderPath` request property and `autoCreateFolderPath` query parameter to `createEntry`, `importEntry`, and `startImportUploadedParts`. When `autoCreateFolderPath` is `true`, any missing folders in `folderPath` are created; when `false` (default), a missing folder returns 404.

## 1.3.0

### Features

- Add Records Management methods: `getEntryRecordsManagementProperties`, `updateEntryRecordsManagementProperties`, `getEligibleRecords`, `getIndependentRecords`, `getAltRetentionEvents`, `getRecordSeriesProperties`, `updateRecordSeriesProperties`, `setRecordEvent`, `removeRecordEvent`, `createRecordSeries`, exposed on the new `recordsManagementClient`.
- Add unified access-rights/access-control methods for fields, templates, and entries: `get/setFieldAccessControl`, `getFieldRights`, `get/setDefaultFieldAccessControl`, `get/setEntryAccessControl`, `getEntryRights`, `getSessionRights`, `get/setTemplateAccessControl`, `getTemplateRights`, `get/setDefaultTemplateAccessControl`, `lookupTrustees`, `getTrusteeSecurity`, exposed on the new `accessControlClient`.
- Add User Areas methods: recent documents/folders, starred entries, personal collections, and user areas (`get/create/update/deleteUserArea`, `get/addUserAreaEntries`, etc.), exposed on the new `userAreasClient`.
- Add Annotations & Stamps methods: `list/get/create/update/deleteAnnotation`, annotation attachments/images, annotation reasons, and `list/get/create/update/deleteStamp` + stamp images, exposed on the new `annotationsClient` and `stampsClient`.
- New types: request/response DTOs and discriminated-union types (`Annotation`, `RecordsManagementProperties`) for all of the above.

## 1.2.1

### Security

- Upgrade `form-data` to `4.0.6` to update vulnerable transitive dependency.

## 1.2.0

### Features

- Add field definition administration methods: `createFieldDefinition`, `updateFieldDefinition`, `deleteFieldDefinition`, `getFieldListValues`, `replaceFieldListValues`, `getFieldContainingTemplates`, `getFieldAssignedEntryCount`, `getFieldProperties`, `updateFieldProperties`.
- Add destructive field operations: `mergeFields` and `changeFieldType`, both gated by an explicit `allowDataLoss` flag — a request that would lose data is rejected unless `allowDataLoss` is `true`.
- Add template definition administration methods: `createTemplate`, `updateTemplate`, `deleteTemplate`, `getTemplateAssignedEntryCount`, `getTemplateProperties`, `updateTemplateProperties`, `addTemplateField`, `updateTemplateFieldProperties`, `removeTemplateField`, `moveTemplateField`.
- `getEntry` accepts opt-in `includeChildInfo` (folder entries — immediate-children counts: `hasChildren`, `childCount`, `folderCount`, `documentCount`, `shortcutCount`) and `includeTotalSize` (document entries — full stored size including page data, distinct from `electronicDocumentSize`). Both are omitted from the response unless requested.
- New types: request/response DTOs for field and template definition administration, and the `childInfo` object on the entry response.

### Security

- Upgrade vulnerable dependencies: `brace-expansion` (^2.0.3), `flatted` (^3.4.0), `form-data` (4.0.6), `js-yaml` (4.1.1), `lodash` (^4.18.1), `markdown-it` (^14.1.1), `minimatch` (^9.0.7), `serialize-javascript` (7.0.5), `ws` (^8.20.1), `yaml` (^2.8.3), `ajv` (^8.18.0), `glob` (^10.5.0). Remove `inflight` (deprecated, memory-leaking).

## 1.1.0

### Features

- Add electronic document methods: `updateDocument`, `updateDocumentUploadedParts`.
- Add page manipulation methods: `createPages`, `replacePages`, `writePage`, `listPageInfos`, `movePages`, `copyPages`, `rotateImagePage`, `getPageImage`, `getPageText`, `generateText`.
- `listPageInfos` returns a paginated `PageInfoCollectionResponse` (OData envelope with `value`/`odataCount`/`odataNextLink`); accepts `top`, `select`, `count`, `pageRange`, and the `Prefer: odata.maxpagesize=...` header. Default page size 150; clients follow `odataNextLink` for further pages.
- Add check-in/check-out and lock methods: `lockDocument`, `getDocumentLockInfo`, `unlockDocument`, `putUnderVersionControl`, `checkOutDocument`, `checkInDocument`, `undoCheckOut`.
- `importEntry` accepts an optional `imageFiles` parameter for combined edoc + image-page imports (additive, non-breaking).
- New types: `FileResponse`, `PageInfoResponse`, `PageInfoCollectionResponse`, `LockInfo`, plus request DTOs for the new methods.

### Maintenance

- Migrate test framework from Jest to Vitest.

## 1.0.9

### Maintenance

- Update version of lf-js-utils dependency

## 1.0.8

### Maintenance

- Update minor versions of dependencies

## 1.0.7

### Maintenance

- Update version of lf-js-utils dependency

## 1.0.6

### Maintenance

- Updated version of lf-js-utils dependency

## 1.0.5

### Maintenance

- Fix issues where it depends on unpublished `@laserfiche/lf-api-client-core`

## [Deprecated] 1.0.4

### Maintenance

- Updated versioning on publish to for dependent libraries within this repository

## [Deprecated] 1.0.3

### Maintenance

- Moved code to `lf-api-js` repository from `lf-repository-api-client-js` repository

## 1.0.2

### Maintenance

- Updated minor versions of transitive dependencies to fix some vulnerability issues

## 1.0.1

### Maintenance

- Updated the version of `@laserfiche/lf-api-client-core` to `1.1.10` due to `jsrsasign` vulnerability

## 1.0.0

### Features

- Initial release of the [@laserfiche/lf-repository-api-client-v2](https://www.npmjs.com/package/@laserfiche/lf-repository-api-client-v2) npm package. See the [migration guide](https://github.com/Laserfiche/lf-repository-api-client-js/blob/HEAD/MIGRATION_GUIDE.md) for details on upgrading from the [@laserfiche/lf-repository-api-client](https://www.npmjs.com/package/@laserfiche/lf-repository-api-client) npm package.
