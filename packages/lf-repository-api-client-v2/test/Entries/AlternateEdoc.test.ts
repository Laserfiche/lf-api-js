// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import {
  Document,
  FileParameter,
  ImportEntryRequest,
  StartDeleteEntryRequest,
} from '../../index.js';
import { SKIP_UNDER_JSDOM } from '../BaseTest.js';

const ROOT_FOLDER_ID = 1;

// REQ-DOC-006 -- alternate electronic documents: named binary streams stored alongside a document's
// primary electronic document.
//
// This suite is the only client-side layer that exercises the JS client's own URL builder,
// FormData/multipart path and fromJS/toJSON round trip for this surface. The two dotnet suites both
// drive the *dotnet* generated client and execute none of it.
//
// Every test here needs a real document to hang streams off, and importing one is a Blob multipart
// upload, so the whole suite is gated with SKIP_UNDER_JSDOM (TFS #658052) -- writeAlternateEdoc is
// itself multipart, so the gate would be required regardless.
describe.skipIf(SKIP_UNDER_JSDOM)('Alternate Electronic Documents', () => {
  let createdEntryId: number | undefined;

  afterEach(async () => {
    if (createdEntryId !== undefined) {
      await _RepositoryApiClient.entriesClient.startDeleteEntry({
        repositoryId,
        entryId: createdEntryId,
        request: new StartDeleteEntryRequest(),
      });
      createdEntryId = undefined;
    }
  });

  async function importTestDocument(): Promise<number> {
    const blob = new Blob(['integration test content'], { type: 'application/pdf' });
    const request = new ImportEntryRequest();
    request.name = 'RepositoryApiClientIntegrationTest JS AlternateEdoc';
    request.autoRename = true;
    const edoc: FileParameter = { fileName: 'test.pdf', data: blob };
    const entry = await _RepositoryApiClient.entriesClient.importEntry({
      repositoryId,
      entryId: ROOT_FOLDER_ID,
      file: edoc,
      request,
    });
    return entry.id!;
  }

  function payload(text: string, mimeType = 'text/plain'): FileParameter {
    return { fileName: 'altedoc.txt', data: new Blob([text], { type: mimeType }) };
  }

  test('write creates the stream and reports its name, MIME type and size', async () => {
    createdEntryId = await importTestDocument();
    const content = 'alternate edoc content';

    const written = await _RepositoryApiClient.entriesClient.writeAlternateEdoc({
      repositoryId,
      entryId: createdEntryId,
      name: 'audio1',
      file: payload(content),
      mimeType: 'text/plain',
    });

    expect(written.name).toBe('audio1');
    expect(written.mimeType).toBe('text/plain');
    expect(written.size).toBe(content.length);
  });

  test('get info returns what write reported', async () => {
    createdEntryId = await importTestDocument();
    const content = 'sidecar json payload';
    await _RepositoryApiClient.entriesClient.writeAlternateEdoc({
      repositoryId,
      entryId: createdEntryId,
      name: 'sidecar',
      file: payload(content, 'application/json'),
      mimeType: 'application/json',
    });

    const info = await _RepositoryApiClient.entriesClient.getAlternateEdocInfo({
      repositoryId,
      entryId: createdEntryId,
      name: 'sidecar',
    });

    expect(info.name).toBe('sidecar');
    expect(info.mimeType).toBe('application/json');
    expect(info.size).toBe(content.length);
  });

  test('list returns every stream on the document', async () => {
    createdEntryId = await importTestDocument();
    await _RepositoryApiClient.entriesClient.writeAlternateEdoc({
      repositoryId,
      entryId: createdEntryId,
      name: 'streamA',
      file: payload('first'),
    });
    await _RepositoryApiClient.entriesClient.writeAlternateEdoc({
      repositoryId,
      entryId: createdEntryId,
      name: 'streamB',
      file: payload('second'),
    });

    const listing = await _RepositoryApiClient.entriesClient.listAlternateEdocs({
      repositoryId,
      entryId: createdEntryId,
    });

    const names = (listing.value ?? []).map((s) => s.name).sort();
    expect(names).toEqual(['streamA', 'streamB']);
  });

  // Write is create-or-replace, not additive: the second write must replace the content in full
  // rather than append or fail. A client that sent the wrong verb or path would show up here.
  test('write to an existing name replaces its content in full', async () => {
    createdEntryId = await importTestDocument();
    const first = 'short';
    const second = 'a considerably longer replacement body';

    await _RepositoryApiClient.entriesClient.writeAlternateEdoc({
      repositoryId,
      entryId: createdEntryId,
      name: 'replace1',
      file: payload(first),
    });
    const replaced = await _RepositoryApiClient.entriesClient.writeAlternateEdoc({
      repositoryId,
      entryId: createdEntryId,
      name: 'replace1',
      file: payload(second),
    });

    expect(replaced.size).toBe(second.length);

    const listing = await _RepositoryApiClient.entriesClient.listAlternateEdocs({
      repositoryId,
      entryId: createdEntryId,
    });
    expect((listing.value ?? []).filter((s) => s.name === 'replace1')).toHaveLength(1);
  });

  test('delete removes the stream and it stops being listed', async () => {
    createdEntryId = await importTestDocument();
    await _RepositoryApiClient.entriesClient.writeAlternateEdoc({
      repositoryId,
      entryId: createdEntryId,
      name: 'gone1',
      file: payload('to be deleted'),
    });

    await _RepositoryApiClient.entriesClient.deleteAlternateEdoc({
      repositoryId,
      entryId: createdEntryId,
      name: 'gone1',
    });

    const listing = await _RepositoryApiClient.entriesClient.listAlternateEdocs({
      repositoryId,
      entryId: createdEntryId,
    });
    expect((listing.value ?? []).map((s) => s.name)).not.toContain('gone1');
  });

  // hasAlternateEdocs is opt-in on a single-entry GET, per the REQ-DOC-002 introspection contract.
  // It lets a client decide whether to enumerate at all without a second call.
  test('hasAlternateEdocs reflects whether the document has any', async () => {
    createdEntryId = await importTestDocument();

    const before = (await _RepositoryApiClient.entriesClient.getEntry({
      repositoryId,
      entryId: createdEntryId,
      select: 'hasAlternateEdocs',
    })) as Document;
    expect(before.hasAlternateEdocs).toBe(false);

    await _RepositoryApiClient.entriesClient.writeAlternateEdoc({
      repositoryId,
      entryId: createdEntryId,
      name: 'flagtest',
      file: payload('content'),
    });

    const after = (await _RepositoryApiClient.entriesClient.getEntry({
      repositoryId,
      entryId: createdEntryId,
      select: 'hasAlternateEdocs',
    })) as Document;
    expect(after.hasAlternateEdocs).toBe(true);
  });

  // Names are matched exactly -- no case folding anywhere in the pipeline -- so a name that differs
  // only in case is a different stream and must not be found.
  test('a name differing only in letter case is not found', async () => {
    createdEntryId = await importTestDocument();
    await _RepositoryApiClient.entriesClient.writeAlternateEdoc({
      repositoryId,
      entryId: createdEntryId,
      name: 'CaseTest',
      file: payload('content'),
    });

    await expect(
      _RepositoryApiClient.entriesClient.getAlternateEdocInfo({
        repositoryId,
        entryId: createdEntryId,
        name: 'casetest',
      })
    ).rejects.toMatchObject({ status: 404 });
  });

  // The reserved internal stream is reported as absent rather than rejected, so a caller cannot
  // tell it apart from a name the document simply does not have.
  test('the reserved summary_json stream is reported as not found', async () => {
    createdEntryId = await importTestDocument();

    await expect(
      _RepositoryApiClient.entriesClient.getAlternateEdocInfo({
        repositoryId,
        entryId: createdEntryId,
        name: 'summary_json',
      })
    ).rejects.toMatchObject({ status: 404 });
  });

  test('a name longer than 15 characters is rejected with 400', async () => {
    createdEntryId = await importTestDocument();

    await expect(
      _RepositoryApiClient.entriesClient.writeAlternateEdoc({
        repositoryId,
        entryId: createdEntryId,
        name: 'x'.repeat(16),
        file: payload('content'),
      })
    ).rejects.toMatchObject({ status: 400 });
  });
});
