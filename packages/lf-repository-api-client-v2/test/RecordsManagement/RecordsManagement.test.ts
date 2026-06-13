// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId, _RepositoryApiClient } from '../CreateSession.js';
import { CreateEntry, deleteEntry } from '../BaseTest.js';
import {
  CreateRecordSeriesRequest,
  RecordEntryType,
  UpdateRecordSeriesPropertiesRequest,
  UpdateRecordsManagementPropertiesRequest,
} from '../../index.js';

// Parallel (JS) coverage for the V2 Records Management endpoints (PRD 6.5.D — REQ-RM-ENTRY-001/002/003,
// REQ-RM-FOLDER-001, REQ-RM-SERIES-001). The dotnet REST integration suite owns the exhaustive contract;
// these exercise the JS client end-to-end against a running server. No multipart upload, so they run under
// both vitest+node and vitest+jsdom.
//
// Each test creates its OWN folder (autoRename). PATCH auto-promotes that folder to a record folder, so the
// auto-promote test re-fetches with an independent GET to prove the promotion persisted. afterEach deletes
// the folder (best-effort — a promoted record folder / record series may resist deletion).
describe('Records Management (REQ-RM-ENTRY/FOLDER/SERIES)', () => {
  let createdEntryId: number | undefined;

  afterEach(async () => {
    if (createdEntryId !== undefined) {
      const entryId = createdEntryId;
      createdEntryId = undefined;
      try {
        await deleteEntry(_RepositoryApiClient, entryId);
      } catch {
        /* leftover is harmless */
      }
    }
  });

  async function createFolder(): Promise<number> {
    const folder = await CreateEntry(_RepositoryApiClient, 'JS RM Test Folder');
    createdEntryId = folder.id!;
    return createdEntryId;
  }

  test('getEntryRecordsManagementProperties on a plain folder returns 404', async () => {
    const entryId = await createFolder();
    await expect(
      _RepositoryApiClient.entriesClient.getEntryRecordsManagementProperties({ repositoryId, entryId })
    ).rejects.toMatchObject({ status: 404 });
  });

  test('updateEntryRecordsManagementProperties auto-promotes a folder to a record folder and persists', async () => {
    const entryId = await createFolder();

    const updated = await _RepositoryApiClient.entriesClient.updateEntryRecordsManagementProperties({
      repositoryId,
      entryId,
      request: new UpdateRecordsManagementPropertiesRequest({ isPermanent: true }),
    });
    expect(updated.recordType).toBe(RecordEntryType.RecordFolder);
    expect(updated.isPermanent).toBe(true);

    // Persistence verify: a fresh GET must reflect the promotion + applied property.
    const fetched = await _RepositoryApiClient.entriesClient.getEntryRecordsManagementProperties({
      repositoryId,
      entryId,
    });
    expect(fetched.recordType).toBe(RecordEntryType.RecordFolder);
    expect(fetched.isPermanent).toBe(true);
  });

  test('record folder queries return (non-null) collections', async () => {
    const entryId = await createFolder();
    await _RepositoryApiClient.entriesClient.updateEntryRecordsManagementProperties({
      repositoryId,
      entryId,
      request: new UpdateRecordsManagementPropertiesRequest({ isPermanent: true }),
    });

    const eligibleForDisposition = await _RepositoryApiClient.entriesClient.getEligibleRecords({
      repositoryId,
      entryId,
      forSelector: 'disposition',
    });
    const eligibleForTransfer = await _RepositoryApiClient.entriesClient.getEligibleRecords({
      repositoryId,
      entryId,
      forSelector: 'transfer',
    });
    const independent = await _RepositoryApiClient.entriesClient.getIndependentRecords({ repositoryId, entryId });
    const altEvents = await _RepositoryApiClient.entriesClient.getAltRetentionEvents({ repositoryId, entryId });

    expect(eligibleForDisposition.entryIds).toBeDefined();
    expect(eligibleForTransfer.entryIds).toBeDefined();
    expect(independent.entryIds).toBeDefined();
    expect(altEvents.events).toBeDefined();
  });

  test('getEligibleRecords without the for selector returns 400', async () => {
    const entryId = await createFolder();
    await expect(
      _RepositoryApiClient.entriesClient.getEligibleRecords({ repositoryId, entryId })
    ).rejects.toMatchObject({ status: 400 });
  });

  test('createRecordSeries then read and update its series properties', async () => {
    // A record series belongs to the repository's record file plan — it cannot be a child of a normal
    // folder (LFS enforces this). Create it under the repository root (the file-plan root) and record
    // the created series id for cleanup.
    const created = await _RepositoryApiClient.entriesClient.createRecordSeries({
      repositoryId,
      parentEntryId: 1,
      request: new CreateRecordSeriesRequest({ name: 'JS RM Test Series', code: 'RMS' }),
    });
    expect(created).toBeDefined();
    expect(created.id).toBeGreaterThan(0);
    createdEntryId = created.id!; // cleanup deletes the series (not the root)

    const seriesProps = await _RepositoryApiClient.entriesClient.getRecordSeriesProperties({
      repositoryId,
      entryId: created.id!,
    });
    expect(seriesProps).toBeDefined();

    const updatedSeries = await _RepositoryApiClient.entriesClient.updateRecordSeriesProperties({
      repositoryId,
      entryId: created.id!,
      request: new UpdateRecordSeriesPropertiesRequest({ isPermanent: true }),
    });
    expect(updatedSeries.isPermanent).toBe(true);
  });
});
