// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import {
  SearchContextHitCollectionResponse,
  EntryCollectionResponse,
  StartSearchEntryRequest,
  TaskCollectionResponse,
  TaskStatus,
} from '../../index.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';
import { CoreUtils } from '@laserfiche/lf-js-utils';

let taskId: string;
describe('Search Integration Tests', () => {
  beforeEach(async () => {
    taskId = '';
  });

  afterEach(async () => {
    if (taskId) {
      await _RepositoryApiClient.tasksClient.cancelTasks({
        repositoryId,
        taskIds: [taskId],
      });
    }
  });

  test('Get Search Context Hits', async () => {
    let request = new StartSearchEntryRequest();
    request.searchCommand = '({LF:Basic ~= "search text", option="DFANLT"})';
    var searchResponse =
      await _RepositoryApiClient.searchesClient.startSearchEntry({
        repositoryId,
        request,
      });
    taskId = searchResponse.taskId ?? '';

    expect(taskId).not.toBeNull();
    expect(taskId).not.toBe('');

    const listOfTasks: TaskCollectionResponse =
      await _RepositoryApiClient.tasksClient.listTasks({
        repositoryId,
        taskIds: [taskId],
      });
    const isComplete = listOfTasks.value
      ? listOfTasks.value[0].status === TaskStatus.Completed
      : false;

    if (!isComplete) {
      throw new Error('The search task did not complete in 60 seconds');
    }

    const searchResultsResponse =
      await _RepositoryApiClient.searchesClient.listSearchResults({
        repositoryId,
        taskId,
      });

    var searchResults = searchResultsResponse.value;
    if (!searchResults) {
      throw new Error('searchResults is undefined');
    }

    expect(searchResults).not.toBeNull();
    expect(searchResults.length > 0).toBeTruthy();
    let rowNum = searchResults[0].rowNumber;

    var contextHitResponse =
      await _RepositoryApiClient.searchesClient.listSearchContextHits({
        repositoryId,
        taskId,
        rowNumber: rowNum ?? -1,
      });
    var contextHits = contextHitResponse.value;

    expect(contextHits).not.toBeNull();
  });

  test('Get Search Results for each Paging', async () => {
    let maxPages = 3;
    let maxPageSize = 10;
    let searchRequest = new StartSearchEntryRequest();
    searchRequest.searchCommand =
      '({LF:Basic ~= "search text", option="DFANLT"})';

    let searchResponse =
      await _RepositoryApiClient.searchesClient.startSearchEntry({
        repositoryId,
        request: searchRequest,
      });

    taskId = searchResponse.taskId ?? '';

    expect(taskId).not.toBe('');
    expect(taskId).not.toBeNull();

    await CoreUtils.sleepAsync(10000);

    let searchResults = 0;
    let pages = 0;
    const callback = async (response: EntryCollectionResponse) => {
      if (!response.value) {
        throw new Error('response.value is undefined');
      }
      searchResults += response.value.length;
      pages += 1;
      return maxPages > pages;
    };

    await _RepositoryApiClient.searchesClient.listSearchResultsForEach({
      callback,
      repositoryId,
      taskId,
      maxPageSize,
    });

    expect(searchResults).toBeGreaterThan(0);
    expect(pages).toBeGreaterThan(0);
  });

  test('Get Search Context Hits for each Paging', async () => {
    let maxPages = 3;
    let maxPageSize = 10;
    let searchRequest = new StartSearchEntryRequest();
    searchRequest.searchCommand = '({LF:Basic ~= "search", option="DFANLT"})';
    let searchResponse =
      await _RepositoryApiClient.searchesClient.startSearchEntry({
        repositoryId,
        request: searchRequest,
      });
    taskId = searchResponse.taskId ?? '';

    expect(taskId).not.toBe('');
    expect(taskId).not.toBeNull();
    const listOfTasks: TaskCollectionResponse =
      await _RepositoryApiClient.tasksClient.listTasks({
        repositoryId,
        taskIds: [taskId],
      });
    const isComplete = listOfTasks.value
      ? listOfTasks.value[0].status === TaskStatus.Completed
      : false;

    if (!isComplete) {
      throw new Error('The search task did not complete in 60 seconds');
    }

    const searchResultsResponse =
      await _RepositoryApiClient.searchesClient.listSearchResults({
        repositoryId,
        taskId,
      });

    if (!searchResultsResponse || !searchResultsResponse.value) {
      throw new Error('searchResultsResponse.value is undefined');
    }
    var searchResults = searchResultsResponse.value;

    expect(searchResults).not.toBeNull();
    expect(searchResults.length > 0).toBeTruthy();

    let rowNum = searchResults[0].rowNumber ?? 0;
    let searchContextHits = 0;
    let pages = 0;
    const callback = async (response: SearchContextHitCollectionResponse) => {
      if (!response.value) {
        throw new Error('response.value is undefined');
      }
      searchContextHits += response.value.length;
      pages += 1;
      return maxPages > pages;
    };

    await _RepositoryApiClient.searchesClient.listSearchContextHitsForEach({
      callback,
      repositoryId,
      taskId,
      rowNumber: rowNum,
      maxPageSize,
    });

    expect(searchContextHits).toBeGreaterThan(0);
    expect(pages).toBeGreaterThan(0);
  });

  test('Get Search Results', async () => {
    let request = new StartSearchEntryRequest();
    request.searchCommand = '({LF:Basic ~= "search text", option="DFANLT"})';
    var searchResponse =
      await _RepositoryApiClient.searchesClient.startSearchEntry({
        repositoryId,
        request,
      });
    taskId = searchResponse.taskId ?? '';

    expect(taskId).not.toBeNull();
    expect(taskId).not.toBe('');

    const listOfTasks: TaskCollectionResponse =
      await _RepositoryApiClient.tasksClient.listTasks({
        repositoryId,
        taskIds: [taskId],
      });

    const isComplete = listOfTasks.value
      ? listOfTasks.value[0].status === TaskStatus.Completed
      : false;

    if (!isComplete) {
      throw new Error('The search task did not complete in 60 seconds');
    }

    const searchResultsResponse =
      await _RepositoryApiClient.searchesClient.listSearchResults({
        repositoryId,
        taskId,
      });
    const searchResults = searchResultsResponse.value;

    expect(searchResults).not.toBeNull();
  });
});
