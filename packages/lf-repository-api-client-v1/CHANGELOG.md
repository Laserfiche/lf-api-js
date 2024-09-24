## 1.1.4

### Features

- Added `RepositoriesClient.getSelfHostedRepositoryList` method that will enable self hosted users to get their repository list without an access token.
- Added the gzip compression header which will compress every API response to improve performance

### Maintenance

- Updated `lf-api-client-core` dependency to version `1.1.0` due to `jsrsasign` vulnerability

## 1.1.3

### Features

- `createFromAccessKey` now has an optional parameter `scope` to specify the requested scope(s) for the access token.

## 1.1.1

### Fixes

- The `ApiException` type now has a `ProblemDetails` property which contains additional information about the error.
- The `ProblemDetails` type now has additional properties from the response.
- `importDocument` v1 API can result in a partial success in some cases. The related exceptions can be found in
  `ProblemDetails.Extensions`:

```javascript
try {
    await _RepositoryApiClient.entriesClient.importDocument({
        ...importDocumentRequest
    });
} catch (e: any) {
    console.log(e?.message);
    if (e?.problemDetails?.extensions != null) {
      var partialSuccessResult: CreateEntryResult | undefined = e?.problemDetails?.extensions["createEntryResult"];
      var createdEntryId: number | undefined = partialSuccessResult?.operations?.entryCreate?.entryId;
    }
}
```

## 1.1.0

### Features

- Added support for Self-hosted API Server

### Fixes

- Fix `IEntriesClient.getDocumentContentType` return type from `Promise<void>` to `Promise<HttpResponseHead<void>>` to allow retrieving response headers.
- Fix `ISimpleSearchesClient.createSimpleSearchOperation` return type from `Promise<ODataValueOfIListOfEntry>` to `Promise<ODataValueContextOfIListOfEntry>` to more accurately represent the response. The `ODataValueContextOfIListOfEntry` type derives from the `ODataValueOfIListOfEntry` type.
- **[BREAKING]**: Fix `FuzzyType` enum values to have string values. Usage of the `FuzzyType` when creating a search using `ISearchesClient.createSearchOperation` does not need to change.

## 1.0.14

### Fixes

- Add missing `403` and `404` status codes to various APIs.
- Change `Entry` type to abstract. Should use the derived types like `Folder`, `Document`, `Shortcut`, and `RecordSeries`.
- Deprecate the `ServerSession` APIs. This applies to the following:
  - `serverSessionClient.createServerSession`
  - `serverSessionClient.refreshServerSession`
  - `serverSessionClient.invalidateServerSession`
- Fixed an issue with optional header parameters being set as empty strings, such as in `exportDocument`
- **[BREAKING]**: `IEntriesClient`
  - Rename `moveOrRenameDocument` to `moveOrRenameEntry` to better represent its capability.
