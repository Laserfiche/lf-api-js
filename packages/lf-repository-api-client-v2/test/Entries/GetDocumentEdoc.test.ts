// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import {
  AuditEventType,
  Document,
  FileParameter,
  ImportEntryRequest,
  StartDeleteEntryRequest,
} from '../../index.js';
import { CreateEntry, SKIP_UNDER_JSDOM } from '../BaseTest.js';

const ROOT_FOLDER_ID = 1;

// US #718402 -- GET Document/Edoc: the electronic document in the response body, with optional single byte ranges.
//
// This suite is the only client-side layer that exercises the JS client's own handling of this operation: the Range
// request header, the 206 success branch and the FileResponse headers. The dotnet suites drive the dotnet client.
//
// The fixture is an imported document (Blob multipart upload), so the suite is gated with SKIP_UNDER_JSDOM (TFS #658052).
describe.skipIf(SKIP_UNDER_JSDOM)('GetDocumentEdoc', () => {
  // 100 distinct-enough bytes, so every range is checkable against a known oracle.
  const content = Array.from({ length: 10 }, (_, i) => `edoc-${i}-ab`).join('');
  const expected = new TextEncoder().encode(content);
  const size = expected.length;

  let createdEntryIds: number[] = [];
  let exportReasonId: number | undefined;

  beforeAll(async () => {
    const reasons = (await _RepositoryApiClient.auditReasonsClient.listAuditReasons({ repositoryId })).value ?? [];
    exportReasonId = reasons.find((r) => r.auditEventType === AuditEventType.ExportDocument)?.id;
  });

  afterEach(async () => {
    for (const entryId of createdEntryIds) {
      await _RepositoryApiClient.entriesClient.startDeleteEntry({
        repositoryId,
        entryId,
        request: new StartDeleteEntryRequest(),
      });
    }
    createdEntryIds = [];
  });

  async function importTestDocument(): Promise<number> {
    const request = new ImportEntryRequest();
    request.name = 'RepositoryApiClientIntegrationTest JS GetDocumentEdoc';
    request.autoRename = true;
    const edoc: FileParameter = { fileName: 'edoc.pdf', data: new Blob([content], { type: 'application/pdf' }) };
    const entry = await _RepositoryApiClient.entriesClient.importEntry({
      repositoryId,
      entryId: ROOT_FOLDER_ID,
      file: edoc,
      request,
    });
    createdEntryIds.push(entry.id!);
    return entry.id!;
  }

  function getEdoc(entryId: number, range?: string, auditReasonId: number | undefined = exportReasonId) {
    return _RepositoryApiClient.entriesClient.getDocumentEdoc({
      repositoryId,
      entryId,
      auditReasonId,
      auditReasonComment: auditReasonId === undefined ? undefined : 'GetDocumentEdoc JS test',
      range,
    });
  }

  async function bytesOf(blob: Blob): Promise<Uint8Array> {
    return new Uint8Array(await blob.arrayBuffer());
  }

  test('whole file returns 200 with the stored bytes, MIME type and file name', async () => {
    const entryId = await importTestDocument();
    const document = (await _RepositoryApiClient.entriesClient.getEntry({ repositoryId, entryId })) as Document;

    const response = await getEdoc(entryId);

    expect(response.status).toBe(200);
    expect(await bytesOf(response.data)).toEqual(expected);
    expect(document.electronicDocumentSize).toBe(size);
    expect(response.headers?.['content-type']).toBe(document.mimeType);
    expect(response.headers?.['accept-ranges']).toBe('bytes');
    expect(response.headers?.['content-range']).toBeUndefined();
    expect(response.fileName).toContain(document.name!);
  });

  test('closed ranges return 206 and concatenate to the whole file', async () => {
    const entryId = await importTestDocument();
    const third = Math.floor(size / 3);
    const ranges: [number, number][] = [
      [0, third - 1],
      [third, 2 * third - 1],
      [2 * third, size - 1],
    ];

    const parts: number[] = [];
    for (const [from, to] of ranges) {
      const response = await getEdoc(entryId, `bytes=${from}-${to}`);
      expect(response.status).toBe(206);
      expect(response.headers?.['content-range']).toBe(`bytes ${from}-${to}/${size}`);
      const body = await bytesOf(response.data);
      expect(body.length).toBe(to - from + 1);
      parts.push(...body);
    }

    expect(new Uint8Array(parts)).toEqual(expected);
  });

  test('open, suffix and past-the-end ranges', async () => {
    const entryId = await importTestDocument();

    const open = await getEdoc(entryId, `bytes=${size - 10}-`);
    expect(open.status).toBe(206);
    expect(open.headers?.['content-range']).toBe(`bytes ${size - 10}-${size - 1}/${size}`);
    expect(await bytesOf(open.data)).toEqual(expected.slice(size - 10));

    const suffix = await getEdoc(entryId, 'bytes=-10');
    expect(suffix.status).toBe(206);
    expect(await bytesOf(suffix.data)).toEqual(expected.slice(size - 10));

    // An end past the last byte is clamped to it.
    const pastEnd = await getEdoc(entryId, `bytes=0-${size + 1000}`);
    expect(pastEnd.status).toBe(206);
    expect(pastEnd.headers?.['content-range']).toBe(`bytes 0-${size - 1}/${size}`);
    expect(await bytesOf(pastEnd.data)).toEqual(expected);
  });

  test('range starting at or after the end returns 416 with the size', async () => {
    const entryId = await importTestDocument();

    await expect(getEdoc(entryId, `bytes=${size}-`)).rejects.toMatchObject({
      status: 416,
      headers: { 'content-range': `bytes */${size}` },
    });
  });

  test('multiple ranges return 400', async () => {
    const entryId = await importTestDocument();

    await expect(getEdoc(entryId, 'bytes=0-1,5-6')).rejects.toMatchObject({ status: 400 });
  });

  // No 'missing audit reason returns 400' case here: whether a reason is required is decided per LFS identity (its
  // success-audit mask), and this suite's service principal is not audited for exports, so the server accepts a request
  // without one. The dotnet REST suite (GetDocumentEdocTest_V2) covers it as an audited cloud user. Every request above
  // still sends auditReasonId and auditReasonComment, which exercises the JS client's query string.

  test('folder and missing entry return 404', async () => {
    const folder = await CreateEntry(_RepositoryApiClient, 'RepositoryApiClientIntegrationTest JS GetDocumentEdoc folder');
    createdEntryIds.push(folder.id!);

    await expect(getEdoc(folder.id!)).rejects.toMatchObject({ status: 404 });
    await expect(getEdoc(999999999)).rejects.toMatchObject({ status: 404 });
  });
});
