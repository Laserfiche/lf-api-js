// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import {
  PagesContentRequest,
  ImportEntryRequest,
  FileParameter,
  StartDeleteEntryRequest,
} from '../../index.js';
import { SKIP_UNDER_JSDOM } from '../BaseTest.js';

// Story 702745 -- getPageTextOffsets and listPageWordLocations.
//
// These cover what only this codebase can break: that the routes are built correctly, that the
// four rectangle values reach the server as query parameters, and that a ProblemDetails response
// comes back deserialized. They deliberately do not chase a 200 from the word map: word locations
// exist only after OCR has run over a real scanned image, and the image fixture available here is
// a one-pixel PNG. The semantics of the map -- the offsets, the span, the annotation round trip --
// are covered against genuine OCR output in the server's SiteApiRepositoryREST suite.
//
// Every rectangle below is dimensionally valid unless the test is about rejecting it, so a
// document whose page has text but no word locations answers 404 rather than 400. That difference
// is what makes these assertions able to tell "the parameters arrived" from "they did not".
//
// The rejections are matched on the rejected member's name inside problemDetails.title, not on
// problemDetails.extensions.instanceDetail, which is where the dotnet suite reads it: this
// client's ProblemDetails.init in lf-api-client-core-js declares an extensions field and never
// assigns it, so it is always undefined here. The member name is a substitution argument in the
// localized message, so it survives translation even though the sentence around it does not.
//
// The 404 cases additionally assert operationId, which init does populate. Without it they would
// pass against a server that has neither route deployed, since a missing route is also a 404.
describe.skipIf(SKIP_UNDER_JSDOM)('Page Word Locations Integration Tests', () => {
  let createdEntryId: number = 0;

  async function createDocumentWithTextPage(name: string): Promise<number> {
    const blob = new Blob([''], { type: 'text/plain' });
    const importRequest = new ImportEntryRequest();
    importRequest.name = name;
    importRequest.autoRename = true;
    const file: FileParameter = { fileName: name + '.txt', data: blob };
    const entry = await _RepositoryApiClient.entriesClient.importEntry({
      repositoryId,
      entryId: 1,
      file,
      request: importRequest,
    });
    const entryId = entry.id!;

    const createPagesRequest = new PagesContentRequest();
    createPagesRequest.textPages = ['Integration test page text content'];
    await _RepositoryApiClient.entriesClient.createPages({
      repositoryId,
      entryId,
      request: createPagesRequest,
    });

    return entryId;
  }

  afterEach(async () => {
    if (createdEntryId !== 0) {
      const request = new StartDeleteEntryRequest();
      await _RepositoryApiClient.entriesClient.startDeleteEntry({
        repositoryId,
        entryId: createdEntryId,
        request,
      });
      createdEntryId = 0;
    }
  });

  test('ListPageWordLocations on a page without word locations returns 404', async () => {
    createdEntryId = await createDocumentWithTextPage(
      'RepositoryApiClientIntegrationTest JS ListPageWordLocations NoLocations'
    );

    try {
      await _RepositoryApiClient.entriesClient.listPageWordLocations({
        repositoryId,
        entryId: createdEntryId,
        pageNumber: 1,
      });
      throw new Error('Should have thrown');
    } catch (e: any) {
      expect(e.status).toBe(404);
      // operationId, not just the status: a server without this route deployed also answers 404,
      // so the status alone would let this test pass against a build that has no such endpoint.
      expect(e.problemDetails.operationId).toBe('ListPageWordLocations');
    }
  });

  test('ListPageWordLocations on a missing entry returns 404', async () => {
    // No operationId assertion here: this 404 comes from the repository not finding the entry,
    // through CategorizeException, which does not carry the operation's own id. The two tests
    // that need to prove the route exists are the ones that reach a page.
    try {
      await _RepositoryApiClient.entriesClient.listPageWordLocations({
        repositoryId,
        entryId: 999999999,
        pageNumber: 1,
      });
      throw new Error('Should have thrown');
    } catch (e: any) {
      expect(e.status).toBe(404);
    }
  });

  test('GetPageTextOffsets accepts a whole rectangle and reaches the page', async () => {
    createdEntryId = await createDocumentWithTextPage(
      'RepositoryApiClientIntegrationTest JS GetPageTextOffsets ValidRectangle'
    );

    // 404, not 400: the rectangle passed validation and the request got as far as the page,
    // which has text but no word locations. A 400 here would mean a coordinate never arrived.
    // The operationId assertion is what separates this from the 404 an undeployed route returns.
    try {
      await _RepositoryApiClient.entriesClient.getPageTextOffsets({
        repositoryId,
        entryId: createdEntryId,
        pageNumber: 1,
        x: 10,
        y: 20,
        width: 100,
        height: 50,
      });
      throw new Error('Should have thrown');
    } catch (e: any) {
      expect(e.status).toBe(404);
      expect(e.problemDetails.operationId).toBe('GetPageTextOffsets');
    }
  });

  test('GetPageTextOffsets omitting width is rejected before the request is sent', async () => {
    createdEntryId = await createDocumentWithTextPage(
      'RepositoryApiClientIntegrationTest JS GetPageTextOffsets MissingWidth'
    );

    // The swagger marks the four rectangle parameters required, so the generated signature no
    // longer lets a caller leave one out - hence the cast, which is the thing under test. The
    // client rejects it locally rather than sending a request the server would answer with a 400,
    // so there is no status here: it never reached the wire.
    const argsWithoutWidth = {
      repositoryId,
      entryId: createdEntryId,
      pageNumber: 1,
      x: 10,
      y: 20,
      height: 50,
    } as any;

    // try/catch rather than .rejects: the generated guard runs before the method returns a
    // promise, so it throws synchronously and .rejects would never receive one.
    let thrown: any;
    try {
      await _RepositoryApiClient.entriesClient.getPageTextOffsets(argsWithoutWidth);
    } catch (e: any) {
      thrown = e;
    }

    expect(thrown).toBeDefined();
    expect(String(thrown.message)).toMatch(/width.*must be defined/);
    expect(thrown.status).toBeUndefined();
  });

  test('GetPageTextOffsets with an explicit null width returns 400 naming width', async () => {
    createdEntryId = await createDocumentWithTextPage(
      'RepositoryApiClientIntegrationTest JS GetPageTextOffsets NullWidth'
    );

    // The generated check is `=== undefined`, so an explicit null is still sent and the server
    // rejects it. This keeps the server-side 400 covered now that omission stops at the client.
    try {
      await _RepositoryApiClient.entriesClient.getPageTextOffsets({
        repositoryId,
        entryId: createdEntryId,
        pageNumber: 1,
        x: 10,
        y: 20,
        width: null,
        height: 50,
      });
      throw new Error('Should have thrown');
    } catch (e: any) {
      expect(e.status).toBe(400);
      expect(e.problemDetails.title).toContain('width');
    }
  });

  test('GetPageTextOffsets with a negative height returns 400 naming height', async () => {
    createdEntryId = await createDocumentWithTextPage(
      'RepositoryApiClientIntegrationTest JS GetPageTextOffsets NegativeHeight'
    );

    // The server rejects x, then y, then width, then height. A rejection that names height proves
    // the first three arrived carrying usable values and height arrived carrying -1 -- that is,
    // the values transit and not merely the keys.
    try {
      await _RepositoryApiClient.entriesClient.getPageTextOffsets({
        repositoryId,
        entryId: createdEntryId,
        pageNumber: 1,
        x: 0,
        y: 0,
        width: 100,
        height: -1,
      });
      throw new Error('Should have thrown');
    } catch (e: any) {
      expect(e.status).toBe(400);
      expect(e.problemDetails.title).toContain('height');
    }
  });

  test('GetPageTextOffsets with a zero width returns 400 naming width', async () => {
    createdEntryId = await createDocumentWithTextPage(
      'RepositoryApiClientIntegrationTest JS GetPageTextOffsets ZeroWidth'
    );

    try {
      await _RepositoryApiClient.entriesClient.getPageTextOffsets({
        repositoryId,
        entryId: createdEntryId,
        pageNumber: 1,
        x: 0,
        y: 0,
        width: 0,
        height: 50,
      });
      throw new Error('Should have thrown');
    } catch (e: any) {
      expect(e.status).toBe(400);
      expect(e.problemDetails.title).toContain('width');
    }
  });
});
