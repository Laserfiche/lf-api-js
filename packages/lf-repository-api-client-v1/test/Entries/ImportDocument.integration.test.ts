// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';
import { Blob as NodeBlob } from 'buffer';
import { CreateEntryResult, FileParameter, PostEntryWithEdocMetadataRequest } from '../../index.js';
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
        const request = new PostEntryWithEdocMetadataRequest();
        const edoc : FileParameter = {
            fileName: "RepositoryApiClientIntegrationTest JS GetDocumentContent",
            data: blob
          }
        const importDocumentRequest = {
            repoId: repositoryId,
            parentEntryId: 1,
            fileName: "test",
            autoRename: true,
            request: request,
            electronicDocument: edoc
            
        };
        try {
            await _RepositoryApiClient.entriesClient.importDocument({
                ...importDocumentRequest
            });
        } catch (e: any) {
            expect(e.problemDetails.title).toBeDefined();
            expect(e.problemDetails.title).toEqual(e.message);
            expect(e.problemDetails.status).toBe(400);
            expect(e.status).toBe(400);
            expect(e.problemDetails.operationId).toBeDefined();
            expect(e.problemDetails.type).toBeUndefined();
            expect(e.problemDetails.instance).toBeUndefined();
            expect(e.problemDetails.errorSource).toBeUndefined();
            expect(e.problemDetails.traceId).toBeUndefined();
            expect(Object.keys(e.problemDetails.extensions).length).toEqual(1);
            
            var partialSuccessResult: CreateEntryResult = <CreateEntryResult>e.problemDetails.extensions["createEntryResult"];
            expect(partialSuccessResult).toBeDefined();

            expect(e.message.includes(partialSuccessResult?.operations?.entryCreate?.exceptions?.at(0)?.message));
        }

    });
  });
