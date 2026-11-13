// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import {
  AuditEventType,
  ExportEntryRequestImageEncoding,
  ExportEntryRequestImageFormat,
  ExportEntryRequestImageOptions,
  ExportEntryRequestPart,
  FileParameter,
  ImportEntryRequest,
  StartDeleteEntryRequest,
  StartExportEntryRequest,
  TaskProgress,
  TaskStatus,
} from '../../index.js';
import { SKIP_UNDER_JSDOM } from '../BaseTest.js';

// Bug 718314 / 729686: imageOptions.encoding on ExportAsync (startExportEntry), through the JS client's own enum
// serialization. The fixture is one colour JPEG page stored as uploaded, so the TIFF compression tag tells the encodings
// apart: AsStored copies it as JPEG inside the TIFF (7), Lossless writes LZW (5), Uncompressed writes 1.
//
// The fixture is uploaded as a Blob in multipart form, so the suite is gated with SKIP_UNDER_JSDOM (TFS #658052).
describe.skipIf(SKIP_UNDER_JSDOM)('ExportImageEncoding', () => {
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

  async function createJpegPageDocument(): Promise<number> {
    const request = new ImportEntryRequest();
    request.name = 'RepositoryApiClientIntegrationTest JS ExportImageEncoding';
    request.autoRename = true;
    const empty: FileParameter = { fileName: 'empty.txt', data: new Blob([''], { type: 'text/plain' }) };
    const entry = await _RepositoryApiClient.entriesClient.importEntry({
      repositoryId,
      entryId: 1,
      file: empty,
      request,
    });
    createdEntryIds.push(entry.id!);
    const jpeg = Uint8Array.from(atob(COLOUR_JPEG_PAGE_BASE64), (c) => c.charCodeAt(0));
    await _RepositoryApiClient.entriesClient.createPages({
      repositoryId,
      entryId: entry.id!,
      imageFiles: [{ fileName: 'page1.jpg', data: new Blob([jpeg], { type: 'image/jpeg' }) }],
    });
    return entry.id!;
  }

  async function exportTiff(entryId: number, encoding?: ExportEntryRequestImageEncoding): Promise<Uint8Array> {
    const imageOptions = new ExportEntryRequestImageOptions();
    imageOptions.format = ExportEntryRequestImageFormat.MultiPageTIFF;
    imageOptions.encoding = encoding;
    const request = new StartExportEntryRequest();
    request.part = ExportEntryRequestPart.Image;
    request.imageOptions = imageOptions;
    request.auditReasonId = exportReasonId;
    request.auditReasonComment = exportReasonId === undefined ? undefined : 'ExportImageEncoding JS test';
    const started = await _RepositoryApiClient.entriesClient.startExportEntry({ repositoryId, entryId, request });

    const progress = await waitForTask(started.taskId!);
    expect(progress.status, JSON.stringify(progress.errors)).toBe(TaskStatus.Completed);
    // The download link is single-use: fetch it exactly once.
    const response = await fetch(progress.result!.uri!);
    expect(response.ok).toBe(true);
    return new Uint8Array(await response.arrayBuffer());
  }

  async function waitForTask(taskId: string): Promise<TaskProgress> {
    const deadline = Date.now() + 150_000;
    for (;;) {
      const progress = (await _RepositoryApiClient.tasksClient.listTasks({ repositoryId, taskIds: [taskId] })).value![0];
      const done = progress.status === TaskStatus.Completed || progress.status === TaskStatus.Failed
        || progress.status === TaskStatus.Cancelled;
      if (done || Date.now() > deadline) {
        return progress;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  /** The Compression tag (259) of every page (IFD) of a TIFF file. */
  function tiffPageCompressions(d: Uint8Array): number[] {
    const view = new DataView(d.buffer, d.byteOffset, d.byteLength);
    const little = d[0] === 0x49 && d[1] === 0x49;
    expect(little || (d[0] === 0x4d && d[1] === 0x4d), 'not a TIFF').toBe(true);
    const result: number[] = [];
    let offset = view.getUint32(4, little);
    while (offset !== 0) {
      const count = view.getUint16(offset, little);
      for (let i = 0; i < count; i++) {
        const entry = offset + 2 + 12 * i;
        if (view.getUint16(entry, little) === 259) {
          result.push(view.getUint16(entry + 8, little));
        }
      }
      offset = view.getUint32(offset + 2 + 12 * count, little);
    }
    return result;
  }

  test('omitted encoding exports AsStored: the JPEG page is copied as JPEG inside the TIFF', async () => {
    const entryId = await createJpegPageDocument();

    const compressions = tiffPageCompressions(await exportTiff(entryId));

    // An API server from before Bug 729686, or the UncompressedTiffExportDefault rollback flag, writes uncompressed (1).
    expect(compressions).toEqual([7]);
  });

  test('Lossless writes the JPEG page as LZW, never JPEG inside the TIFF', async () => {
    const entryId = await createJpegPageDocument();

    const compressions = tiffPageCompressions(await exportTiff(entryId, ExportEntryRequestImageEncoding.Lossless));

    expect(compressions).toEqual([5]);
  });

  test('Uncompressed keeps the output from before the AsStored default', async () => {
    const entryId = await createJpegPageDocument();

    const compressions = tiffPageCompressions(await exportTiff(entryId, ExportEntryRequestImageEncoding.Uncompressed));

    expect(compressions).toEqual([1]);
  });
});

// A small colour JPEG page, the same fixture as the server REST suite's ExportTestImages.ColourJpegPage.
const COLOUR_JPEG_PAGE_BASE64 = '/9j/4AAQSkZJRgABAQEAyADIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAHgAeADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDnqKKK+vPlQooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiinom/POMVlWrQoQdSo7JG+Gw1XFVVRoq8nsvx6jKKl8j/a/SjyP9r9K4P7awP8AP+D/AMj1v9Ws0/59f+TR/wAyKipfI/2v0o8j/a/Sj+2sD/P+D/yD/VrNP+fX/k0f8yKipfI/2v0o8j/a/Sj+2sD/AD/g/wDIP9Ws0/59f+TR/wAyKipfI/2v0o8j/a/Sj+2sD/P+D/yD/VrNP+fX/k0f8yKipfI/2v0o8j/a/Sj+2sD/AD/g/wDIP9Ws0/59f+TR/wAyKipfI/2v0o8j/a/Sj+2sD/P+D/yD/VrNP+fX/k0f8yKipfI/2v0o8j/a/Sj+2sD/AD/g/wDIP9Ws0/59f+TR/wAyKipfI/2v0o8j/a/Sj+2sD/P+D/yD/VrNP+fX/k0f8yKipfI/2v0o8j/a/Sj+2sD/AD/g/wDIP9Ws0/59f+TR/wAyKipfI/2v0o8j/a/Sj+2sD/P+D/yD/VrNP+fX/k0f8yKipfI/2v0o8j/a/Sj+2sD/AD/g/wDIP9Ws0/59f+TR/wAyKipfI/2v0o8j/a/Sj+2sD/P+D/yD/VrNP+fX/k0f8yKipfI/2v0o8j/a/Sj+2sD/AD/g/wDIP9Ws0/59f+TR/wAyKipfI/2v0o8j/a/Sj+2sD/P+D/yD/VrNP+fX/k0f8yKipfI/2v0o8j/a/Sj+2sD/AD/g/wDIP9Ws0/59f+TR/wAyKipfI/2v0o8j/a/Sj+2sD/P+D/yD/VrNP+fX/k0f8yKipfI/2v0o8j/a/Sj+2sD/AD/g/wDIP9Ws0/59f+TR/wAyKipfI/2v0o8j/a/Sj+2sD/P+D/yD/VrNP+fX/k0f8yKipfI/2v0o8j/a/Sj+2sD/AD/g/wDIP9Ws0/59f+TR/wAyKipfI/2v0o8j/a/Sj+2sD/P+D/yD/VrNP+fX/k0f8yKipfI/2v0o8j/a/Sj+2sD/AD/g/wDIP9Ws0/59f+TR/wAyKipfI/2v0o8j/a/Sj+2sD/P+D/yD/VrNP+fX/k0f8yKinvHsGc5pld1DEU8RD2lJ3X9dzy8XhK2EqeyrxtL5P8gooorY5gooooAKKKKACiiigAooooAKKKKACpYP4qiqWD+KvLzr/cZ/L80e7w1/yNKX/b3/AKSyaiiivgz9WCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAI5vuD61BU833B9agr7fIf8Ac16s/MOKv+Ri/RBRRRXsnzYUUUUAFFFFABRRRQAUUUUAFFFFABUsH8VRVLB/FXl51/uM/l+aPd4a/wCRpS/7e/8ASWTUUUV8GfqwUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQBHN9wfWoKnm+4PrUFfb5D/ua9WfmHFX/Ixfogooor2T5sKKKKACiiigAooooAKKKKACiiigAqWD+Koqlg/iry86/3Gfy/NHu8Nf8AI0pf9vf+ksmooor4M/VgooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigCOb7g+tQVPN9wfWoK+3yH/c16s/MOKv8AkYv0QUUUV7J82FFFFABRRRQAUUUUAFFFFABRRRQAVLB/FUVSwfxV5edf7jP5fmj3eGv+RpS/7e/9JZNRRRXwZ+rBRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAEc33B9agqeb7g+tQV9vkP+5r1Z+YcVf8AIxfogooor2T5sKKKKACiiigAooooAKKKKACiiigAqWD+Koqlg/iry86/3Gfy/NHu8Nf8jSl/29/6Syaiiivgz9WCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAI5vuD61BU833B9agr7fIf9zXqz8w4q/5GL9EFFFFeyfNhRRRQAUUUUAFFFFABRRRQAUUUUAFSwfxVFUsH8VeXnX+4z+X5o93hr/kaUv8At7/0lk1FFFfBn6sFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUARzfcH1qCp5vuD61BX2+Q/7mvVn5hxV/yMX6IKKKK9k+bCiiigAooooAKKKKACiiigAooooAKlg/iqKpYP4q8vOv8AcZ/L80e7w1/yNKX/AG9/6Syaiiivgz9WCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAI5vuD61BU833B9agr7fIf9zXqz8w4q/5GL9EFFFFeyfNhRRRQAUUUUAFFFFABRRRQAUUUUAFPjcJnOeaZRWOIoQxFN0qmz/4c6cJi6mErRr0viX6qxP5y+ho85fQ1BRXmf2Dg+z+89v/AFqzHuvuJ/OX0NHnL6GoKKP7BwfZ/eH+tWY919xP5y+ho85fQ1BRR/YOD7P7w/1qzHuvuJ/OX0NHnL6GoKKP7BwfZ/eH+tWY919xP5y+ho85fQ1BRR/YOD7P7w/1qzHuvuJ/OX0NHnL6GoKKP7BwfZ/eH+tWY919xP5y+ho85fQ1BRR/YOD7P7w/1qzHuvuJ/OX0NHnL6GoKKP7BwfZ/eH+tWY919xP5y+ho85fQ1BRR/YOD7P7w/wBasx7r7ifzl9DR5y+hqCij+wcH2f3h/rVmPdfcT+cvoaPOX0NQUUf2Dg+z+8P9asx7r7ifzl9DR5y+hqCij+wcH2f3h/rVmPdfcT+cvoaPOX0NQUUf2Dg+z+8P9asx7r7ifzl9DR5y+hqCij+wcH2f3h/rVmPdfcT+cvoaPOX0NQUUf2Dg+z+8P9asx7r7ifzl9DR5y+hqCij+wcH2f3h/rVmPdfcT+cvoaPOX0NQUUf2Dg+z+8P8AWrMe6+4n85fQ0ecvoagoo/sHB9n94f61Zj3X3E/nL6Gjzl9DUFFH9g4Ps/vD/WrMe6+4n85fQ0ecvoagoo/sHB9n94f61Zj3X3E/nL6Gjzl9DUFFH9g4Ps/vD/WrMe6+4n85fQ0ecvoagoo/sHB9n94f61Zj3X3EkkgdcDPWo6KK9HDYanhqfs6ex42NxtXG1fbVtwoooroOQKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD/9k=';
