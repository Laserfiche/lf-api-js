// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
// [AI-Generated] by claude-opus-5-5 v0.001 on 2026-11-17

// A request from a CI runner to the dev CA cloud API occasionally stalls in transit and never
// reaches the server. The client's fetch has no timeout, so the test then waits out its whole
// 200 s testTimeout and fails. installFetchTimeout wraps the global fetch the client calls, so a
// stalled request is aborted after TEST_REQUEST_TIMEOUT_MS and the client's existing retry sends
// it again once.
//
// Only methods that are safe to send twice get the timeout. The client retries any request whose
// fetch throws, whatever its method, so aborting a POST or PATCH could apply it twice when the
// first copy did reach the server. Those keep the old behavior and wait out the test timeout.
//
// The slowest dev CA call from CI is about 2 s (Tasks long-poll), so 60 s leaves headroom.
const TEST_REQUEST_TIMEOUT_MS: number = 60_000;
const SAFE_TO_RESEND_METHODS: string[] = ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'];
const INSTALLED_MARKER: string = '__lfApiJsTestFetchTimeout';

/** Returns a fetch that aborts a safe-to-resend request with no response headers after timeoutMs. */
export function withFetchTimeout(fetchImpl: typeof fetch, timeoutMs: number): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const method: string = (init?.method ?? 'GET').toUpperCase();
    // A Request object or a caller-supplied signal (such as the token client's own timeout) is left alone.
    if (input instanceof Request || init?.signal || SAFE_TO_RESEND_METHODS.indexOf(method) < 0) {
      return fetchImpl(input, init);
    }
    const controller = new AbortController();
    const timerId = setTimeout(() => {
      const timeoutError = new Error(`No response within ${timeoutMs} ms; the test fetch timeout aborted the request.`);
      timeoutError.name = 'TimeoutError';
      controller.abort(timeoutError);
    }, timeoutMs);
    try {
      return await fetchImpl(input, { ...init, signal: controller.signal });
    } finally {
      // Response headers arrived (or the request failed): stop the timer so reading a slow body is not aborted.
      clearTimeout(timerId);
    }
  };
}

/** Wraps the global fetch with withFetchTimeout once per test environment. */
export function installFetchTimeout(): void {
  if (Object.prototype.hasOwnProperty.call(globalThis.fetch, INSTALLED_MARKER)) {
    return;
  }
  const wrappedFetch = withFetchTimeout(globalThis.fetch.bind(globalThis), TEST_REQUEST_TIMEOUT_MS);
  Object.defineProperty(wrappedFetch, INSTALLED_MARKER, { value: true });
  globalThis.fetch = wrappedFetch;
}
