// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { username, password, repositoryId, baseUrl } from '../../selfHostedTestHelpers.js';
import { BeforeFetchResult } from './BeforeFetchResult.js';
import { UsernamePasswordHandler } from './UsernamePasswordHandler.js';
import 'isomorphic-fetch';

/**
 * SelfHosted Integration Tests
 *
 * @group IntegrationTests/SelfHosted
 */

describe('UsernamePasswordHandler', () => {
  test('Correct config returns handler', () => {
    let httpRequestHandler = new UsernamePasswordHandler(repositoryId, username, password, baseUrl);
    expect(httpRequestHandler).toBeTruthy();
  });

  test('Before fetch request async returns new token', async () => {
    let httpRequestHandler = new UsernamePasswordHandler(repositoryId, username, password, baseUrl);
    const url = 'https://laserfiche.com/repository/';
    let request: RequestInit = {
      method: 'GET',
      headers: {},
    };
    let result: BeforeFetchResult = await httpRequestHandler.beforeFetchRequestAsync(url, request);
    expect(result).not.toBeNull;
    expect(result?.regionalDomain).not.toBeNull;
    expect((<any>request.headers)['Authorization'].toString().substring(0, 6)).toBe('Bearer');
    expect(
      (<any>request.headers)['Authorization']
        .toString()
        .substring(6, (<any>request.headers)['Authorization'].toString().length - 1)
    ).not.toBeNull;
  });

  test('Before fetch request async returns existing token', async () => {
    let httpRequestHandler = new UsernamePasswordHandler(repositoryId, username, password, baseUrl);
    const url = 'https://laserfiche.com/repository/';
    let request: RequestInit = {
      method: 'GET',
      headers: {},
    };
    let request2: RequestInit = {
      method: 'GET',
      headers: {},
    };
    let result: BeforeFetchResult = await httpRequestHandler.beforeFetchRequestAsync(url, request);
    let result2: BeforeFetchResult = await httpRequestHandler.beforeFetchRequestAsync(url, request2);
    let bearerTokenParameter: string = (<any>request.headers)['Authorization']
      .toString()
      .substring(6, (<any>request.headers)['Authorization'].toString().length - 1);
    let bearerTokenParameter2: string = (<any>request2.headers)['Authorization']
      .toString()
      .substring(6, (<any>request2.headers)['Authorization'].toString().length - 1);
    expect(result2).not.toBeNull;
    expect(result2.regionalDomain).not.toBeNull;
    expect((<any>request.headers)['Authorization'].toString().substring(0, 6)).toBe('Bearer');
    expect(bearerTokenParameter).toBe(bearerTokenParameter2);
  });

  test('Before fetch request async returns regional domain', async () => {
    let httpRequestHandler = new UsernamePasswordHandler(repositoryId, username, password, baseUrl);
    const url = 'https://laserfiche.com/repository/';
    let request: RequestInit = {
      method: 'GET',
      headers: {},
    };
    let result: BeforeFetchResult = await httpRequestHandler.beforeFetchRequestAsync(url, request);
    expect(result?.regionalDomain).toBeTruthy();
  });

  test.each([
    [repositoryId, 'fake123', password, 401],
    [repositoryId, username, 'fake123', 401],
    ['fake123', username, password, 404],
  ])(
    'Before fetch request async failed authentication throws exception',
    async (repositoryId, username, password, status) => {
      let httpRequestHandler = new UsernamePasswordHandler(repositoryId, username, password, baseUrl);
      let request: RequestInit = {
        method: 'GET',
        headers: {},
      };
      try {
        await httpRequestHandler.beforeFetchRequestAsync(baseUrl, request);
        return false;
      } catch (e: any) {
        expect(e.status).toBe(status);
        expect(e.message).toBeDefined();
        expect(e.problemDetails.title).toEqual(e.message);
        expect(e.problemDetails.operationId).toBeDefined();
        expect(e.problemDetails.type).toBeDefined();
        expect(e.problemDetails.instance).toBeDefined();
        expect(e.problemDetails.errorSource).toBeDefined();
        expect(e.problemDetails.traceId).toBeDefined();
        return true;
      }
    }
  );

  test('After fetch request async token removed when unauthorized', async () => {
    let httpRequestHandler = new UsernamePasswordHandler(repositoryId, username, password, baseUrl);
    const url = 'https://laserfiche.com/repository/';
    let request: RequestInit = {
      method: 'GET',
      headers: {},
    };
    const myResponse: ResponseInit = {
      headers: undefined,
      status: 401,
      statusText: 'UNAUTHORIZED',
    };
    let response2: Response = new Response(null, myResponse);
    let result: BeforeFetchResult = await httpRequestHandler.beforeFetchRequestAsync(url, request);
    let retry: boolean = await httpRequestHandler.afterFetchResponseAsync(url, response2, request);
    expect(retry).toBe(true);
    let request2: RequestInit = {
      method: 'GET',
      headers: {},
    };
    let result2: BeforeFetchResult = await httpRequestHandler.beforeFetchRequestAsync(url, request2);
    let bearerTokenParameter: string = (<any>request.headers)['Authorization']
      .toString()
      .substring(6, (<any>request.headers)['Authorization'].toString().length - 1);
    let bearerTokenParameter2: string = (<any>request2.headers)['Authorization']
      .toString()
      .substring(6, (<any>request2.headers)['Authorization'].toString().length - 1);
    expect(result2).not.toBeNull;
    expect(result2.regionalDomain).not.toBeNull;
    expect((<any>request.headers)['Authorization'].toString().substring(0, 6)).toBe('Bearer');
    expect(bearerTokenParameter2).not.toBeNull;
    expect(bearerTokenParameter).not.toBe(bearerTokenParameter2);
  });
});
