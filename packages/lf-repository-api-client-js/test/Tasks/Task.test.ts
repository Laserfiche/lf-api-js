// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import { Entry, StartDeleteEntryRequest, TaskStatus } from '../../index.js';
import { CreateEntry } from '../BaseTest.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Task Integration Tests', () => {
  test('Cancel Operation', async () => {
    let deleteEntry: Entry = await CreateEntry(
      _RepositoryApiClient,
      'RepositoryApiClientIntegrationTest JS CancelOperation'
    );
    let request = new StartDeleteEntryRequest();
    let result = await _RepositoryApiClient.entriesClient.startDeleteEntry({
      repositoryId,
      entryId: deleteEntry.id ?? -1,
      request,
    });
    let taskId = result.taskId;
    
    expect(taskId).not.toBeNull();
    expect(taskId).not.toBe('');
    
    try {
      await new Promise((r) => setTimeout(r, 5000));
      await _RepositoryApiClient.tasksClient.cancelTasks({ repositoryId, taskIds: [taskId!] });
    } catch (err: any) {
      expect(err.problemDetails.title.includes('Cannot cancel ended operation'));
    }
  });

  test('Get Operation Status', async () => {
    let deleteEntry: Entry = await CreateEntry(
      _RepositoryApiClient,
      'RepositoryApiClientIntegrationTest JS GetOperationStatus'
    );
    let request = new StartDeleteEntryRequest();
    let result = await _RepositoryApiClient.entriesClient.startDeleteEntry({
      repositoryId,
      entryId: deleteEntry.id ?? -1,
      request,
    });
    let taskId = result.taskId;
    
    expect(taskId).not.toBeNull();
    expect(taskId).not.toBe('');
    
    await new Promise((r) => setTimeout(r, 5000));
    let response = await _RepositoryApiClient.tasksClient.listTasks({
      repositoryId,
      taskIds: [taskId!],
    });
    
    expect(response).not.toBeNull();
    expect(response.value).not.toBeNull();
    expect(response.value!.length).toBeGreaterThan(0);

    let taskProgress = response.value![0];
    expect(taskProgress.status).toBe(TaskStatus.Completed);
    expect(taskProgress.percentComplete).toBe(100);
  });
});
