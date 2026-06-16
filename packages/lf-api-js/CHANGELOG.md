<!--Copyright Laserfiche.
Licensed under the MIT License. See LICENSE in the project root for license information.-->

## 1.2.0

### Features

- Updated version of `lf-repository-api-client-v2` to `1.2.0`:
  - Add field definition administration methods: `createFieldDefinition`, `updateFieldDefinition`, `deleteFieldDefinition`, `getFieldListValues`, `replaceFieldListValues`, `getFieldContainingTemplates`, `getFieldAssignedEntryCount`, `getFieldProperties`, `updateFieldProperties`.
  - Add destructive field operations: `mergeFields` and `changeFieldType`, both gated by an explicit `allowDataLoss` flag.
  - Add template definition administration methods: `createTemplate`, `updateTemplate`, `deleteTemplate`, `getTemplateAssignedEntryCount`, `getTemplateProperties`, `updateTemplateProperties`, `addTemplateField`, `updateTemplateFieldProperties`, `removeTemplateField`, `moveTemplateField`.
  - `getEntry` accepts opt-in `includeChildInfo` (folder immediate-children counts) and `includeTotalSize` (document total stored size); both omitted unless requested.
  - New types: request/response DTOs for field and template definition administration, and the `childInfo` object on the entry response.
  
### Security

- Upgrade vulnerable dependencies: `brace-expansion` (^2.0.3), `flatted` (^3.4.0), `form-data` (4.0.4), `js-yaml` (4.1.1), `lodash` (^4.18.1), `markdown-it` (^14.1.1), `minimatch` (^9.0.7), `serialize-javascript` (7.0.5), `ws` (^8.20.1), `yaml` (^2.8.3), `ajv` (^8.18.0), `glob` (^10.5.0). Remove `inflight` (deprecated, memory-leaking).

## 1.1.0

### Features

- Updated version of `lf-repository-api-client-v2` to `1.1.0`:
  - Add electronic document methods: `updateDocument`, `updateDocumentUploadedParts`.
  - Add page manipulation methods: `createPages`, `replacePages`, `writePage`, `listPageInfos`, `movePages`, `copyPages`, `rotateImagePage`, `getPageImage`, `getPageText`, `generateText`.
  - `listPageInfos` returns a paginated `PageInfoCollectionResponse` (OData envelope with `value`/`odataCount`/`odataNextLink`); accepts `top`, `select`, `count`, `pageRange`, and the `Prefer: odata.maxpagesize=...` header. Default page size 150; clients follow `odataNextLink` for further pages.
  - Add check-in/check-out and lock methods: `lockDocument`, `getDocumentLockInfo`, `unlockDocument`, `putUnderVersionControl`, `checkOutDocument`, `checkInDocument`, `undoCheckOut`.
  - `importEntry` accepts an optional `imageFiles` parameter for combined edoc + image-page imports (additive, non-breaking).
  - New types: `FileResponse`, `PageInfoResponse`, `PageInfoCollectionResponse`, `LockInfo`, plus request DTOs for the new methods.

### Maintenance

- Migrate test framework from Jest to Vitest.

## 1.0.6

### Maintenance

- Update version of lf-api-client-core dependency

## 1.0.5

### Maintenance

- Update version of lf-js-utils dependency

## 1.0.4

### Maintenance

- Update version of lf-js-utils dependency

## 1.0.3

### Maintenance

- Update version of lf-js-utils dependency

## 1.0.2

### Maintenance

- Updated version of lf-js-utils dependency

## 1.0.1

- Initial release of parent API Client package
- Includes access to repository api clients for v1 and v2.
