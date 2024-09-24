// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
import { repositoryId } from '../TestHelper.js';
import {
  ODataValueContextOfIListOfFieldValue,
  ODataValueContextOfIListOfEntry,
  ODataValueContextOfIListOfWEntryLinkInfo,
  ODataValueContextOfIListOfWTagInfo
} from '../../index.js';
import { _RepositoryApiClient } from '../CreateSession.js';
import 'isomorphic-fetch';

describe('Get Entry Tests', () => {
  let entryId: number = 1;

  test('Get Entry Listing for each paging', async () => {
    let maxPageSize = 10;
    let entries = 0;
    let pages = 0;
    const callback = async (response: ODataValueContextOfIListOfEntry) => {
      if (!response.value) {
        throw new Error('response.value is undefined');
      }
      entries += response.value.length;
      pages += 1;
      return true;
    };
    await _RepositoryApiClient.entriesClient.getEntryListingForEach({ callback, repoId: repositoryId, entryId, maxPageSize });
    expect(entries).toBeGreaterThan(0);
    expect(pages).toBeGreaterThan(0);
  });

  test('Get Entry Field for each paging', async () => {
    let maxPageSize = 10;
    let entries = 0;
    let pages = 0;
    const callback = async (response: ODataValueContextOfIListOfFieldValue) => {
      if (!response.value) {
        throw new Error('response.value is undefined');
      }
      entries += response.value.length;
      pages += 1;
      return true;
    };
    await _RepositoryApiClient.entriesClient.getFieldValuesForEach({ callback, repoId: repositoryId, entryId, maxPageSize });
    expect(entries).toBeGreaterThan(0);
    expect(pages).toBeGreaterThan(0);
  });

  test('Get Entry Links for each paging', async () => {
    let maxPageSize = 10;
    let entries = 0;
    let pages = 0;
    const callback = async (response: ODataValueContextOfIListOfWEntryLinkInfo) => {
      if (!response.value) {
        throw new Error('response.value is undefined');
      }
      entries += response.value.length;
      pages += 1;
      return true;
    };
    await _RepositoryApiClient.entriesClient.getLinkValuesFromEntryForEach({ callback, repoId: repositoryId, entryId, maxPageSize });
    expect(entries).toBeGreaterThan(0);
    expect(pages).toBeGreaterThan(0);
  });

  test('Get Entry Tags for each paging', async () => {
    let maxPageSize = 10;
    let entries = 0;
    let pages = 0;
    const callback = async (response: ODataValueContextOfIListOfWTagInfo) => {
      if (!response.value) {
        throw new Error('response.value is undefined');
      }
      entries += response.value.length;
      pages += 1;
      return true;
    };
    await _RepositoryApiClient.entriesClient.getTagsAssignedToEntryForEach({ callback, repoId: repositoryId, entryId, maxPageSize });
    expect(entries).toBeGreaterThan(0);
    expect(pages).toBeGreaterThan(0);
  });
});
