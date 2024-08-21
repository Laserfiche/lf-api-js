// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';
import { Blob as NodeBlob } from 'buffer';
import { FileParameter, ImportEntryRequest } from '../../index.js';
import { isBrowser } from '@laserfiche/lf-js-utils/dist/utils/core-utils.js';

describe('Import Document Integration Tests', () => {
    test('Import Document Throws Exception', async () => {
        let blob: any;
        if (isBrowser()){
            blob = new Blob([""], {
                type: "application/json",
              });
        } else {
            blob = new NodeBlob([""], {
                type: "application/json",
              });
        }
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
