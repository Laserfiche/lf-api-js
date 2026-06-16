# Changelog

## 1.2.0

### Features

- Add field definition administration methods: `createFieldDefinition`, `updateFieldDefinition`, `deleteFieldDefinition`, `getFieldListValues`, `replaceFieldListValues`, `getFieldContainingTemplates`, `getFieldAssignedEntryCount`, `getFieldProperties`, `updateFieldProperties`.
- Add destructive field operations: `mergeFields` and `changeFieldType`, both gated by an explicit `allowDataLoss` flag — a request that would lose data is rejected unless `allowDataLoss` is `true`.
- Add template definition administration methods: `createTemplate`, `updateTemplate`, `deleteTemplate`, `getTemplateAssignedEntryCount`, `getTemplateProperties`, `updateTemplateProperties`, `addTemplateField`, `updateTemplateFieldProperties`, `removeTemplateField`, `moveTemplateField`.
- `getEntry` accepts opt-in `includeChildInfo` (folder entries — immediate-children counts: `hasChildren`, `childCount`, `folderCount`, `documentCount`, `shortcutCount`) and `includeTotalSize` (document entries — full stored size including page data, distinct from `electronicDocumentSize`). Both are omitted from the response unless requested.
- New types: request/response DTOs for field and template definition administration, and the `childInfo` object on the entry response.

### Security

- Upgrade vulnerable dependencies: `brace-expansion` (^2.0.3), `flatted` (^3.4.0), `form-data` (4.0.4), `js-yaml` (4.1.1), `lodash` (^4.18.1), `markdown-it` (^14.1.1), `minimatch` (^9.0.7), `serialize-javascript` (7.0.5), `ws` (^8.20.1), `yaml` (^2.8.3), `ajv` (^8.18.0), `glob` (^10.5.0). Remove `inflight` (deprecated, memory-leaking).

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
