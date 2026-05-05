// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import { FileParameter, ImportEntryRequest } from '../../index.js';
import { SKIP_UNDER_JSDOM } from '../BaseTest.js';

describe.skipIf(SKIP_UNDER_JSDOM)('Import Document Integration Tests', () => {
    test('Import Document Throws Exception', async () => {
        const blob = new Blob([""], { type: "application/json" });
        const request = new ImportEntryRequest();
        request.autoRename = true;
        const edoc : FileParameter = {
            fileName: "RepositoryApiClientIntegrationTest JS GetDocumentContent",
            data: blob
          }
        try {
            await _RepositoryApiClient.entriesClient.importEntry({
                repositoryId, entryId: 1, file: edoc, request: request
            });
        } catch (e: any) {
            expect(e.problemDetails.title).not.toBeNull();
            expect(e.problemDetails.title).toEqual(e.message);
            expect(e.problemDetails.status).toBe(400);
            expect(e.status).toBe(400);
            expect(e.problemDetails.operationId).not.toBeNull();
            expect(e.problemDetails.type).not.toBeNull();
            expect(e.problemDetails.instance).not.toBeNull();
            expect(e.problemDetails.errorSource).not.toBeNull();
            expect(e.problemDetails.traceId).not.toBeNull();
        }
    });
  });
