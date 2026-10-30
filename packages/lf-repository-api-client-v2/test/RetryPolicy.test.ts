// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { RepositoryApiClientHttpHandler, getRetryDelayMs } from '../index.js';

// TFS 725694: a 429 or 503 is retried once after its Retry-After, other transient errors after a short random
// delay, and only idempotent methods are retried. No server: fetch is stubbed.
describe('Retry policy', () => {
  const requestHandler: any = {
    beforeFetchRequestAsync: async () => ({ regionalDomain: 'example.com' }),
    afterFetchResponseAsync: async () => false,
  };

  function respond(status: number, retryAfter?: string): Response {
    const headers = new Headers();
    if (retryAfter !== undefined) {
      headers.set('Retry-After', retryAfter);
    }
    return new Response(null, { status, headers });
  }

  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  async function send(method: string): Promise<{ response: Response; elapsedMs: number }> {
    const handler = new RepositoryApiClientHttpHandler(requestHandler);
    const start = Date.now();
    const pending = handler.httpHandler('https://api.example.com/repository/v2/Repositories', { method });
    await vi.runAllTimersAsync();
    const response = await pending;
    return { response, elapsedMs: Date.now() - start };
  }

  test('503 with Retry-After is retried once after that delay', async () => {
    fetchMock.mockResolvedValueOnce(respond(503, '10')).mockResolvedValueOnce(respond(200));

    const { response, elapsedMs } = await send('GET');

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(elapsedMs).toBe(10_000);
  });

  test('429 with Retry-After is retried once after that delay', async () => {
    fetchMock.mockResolvedValueOnce(respond(429, '5')).mockResolvedValueOnce(respond(200));

    const { response, elapsedMs } = await send('GET');

    expect(response.status).toBe(200);
    expect(elapsedMs).toBe(5_000);
  });

  test('503 without Retry-After is retried after a short random delay', async () => {
    fetchMock.mockResolvedValueOnce(respond(503)).mockResolvedValueOnce(respond(200));

    const { response, elapsedMs } = await send('GET');

    expect(response.status).toBe(200);
    expect(elapsedMs).toBeGreaterThanOrEqual(200);
    expect(elapsedMs).toBeLessThanOrEqual(1_000);
  });

  test('Retry-After above 30 s is not waited for: the response is returned', async () => {
    fetchMock.mockResolvedValueOnce(respond(503, '31'));

    const { response } = await send('GET');

    expect(response.status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('429 without Retry-After is not retried', async () => {
    fetchMock.mockResolvedValueOnce(respond(429));

    const { response } = await send('GET');

    expect(response.status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test.each(['POST', 'PATCH', 'DELETE'])('%s is not retried on a 5xx', async (method) => {
    fetchMock.mockResolvedValueOnce(respond(503, '1'));

    const { response } = await send(method);

    expect(response.status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('only one retry: a second failure is returned', async () => {
    fetchMock.mockResolvedValueOnce(respond(500)).mockResolvedValueOnce(respond(500));

    const { response } = await send('PUT');

    expect(response.status).toBe(500);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('Retry-After as an HTTP date', () => {
    const in20s = new Date(Date.now() + 20_000).toUTCString();

    const delay = getRetryDelayMs(respond(503, in20s), { method: 'GET' });

    expect(delay).toBeGreaterThan(15_000);
    expect(delay).toBeLessThanOrEqual(20_000);
  });
});
