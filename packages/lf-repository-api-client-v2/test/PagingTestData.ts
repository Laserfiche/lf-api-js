// Copyright Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.
//
// Shared setup for the entry-listing paging tests (ListEntriesNextLink / ListEntriesForEach).
//
// These tests must NOT depend on metadata pre-configured on the repository root folder
// (entry 1) — that data drifts on the shared dev repo and makes the tests fail for reasons
// unrelated to the code under test. Instead, each run creates its own entries and populates
// them with >= 2 children / fields / links / tags so that maxpagesize=1 paging reliably
// produces a next link.
import { repositoryId } from './TestHelper.js';
import { CreateEntry } from './BaseTest.js';
import {
  Entry,
  FieldType,
  FieldToUpdate,
  SetFieldsRequest,
  SetTagsRequest,
  SetLinksRequest,
  LinkToUpdate,
  StartDeleteEntryRequest,
  IRepositoryApiClient,
} from '../index.js';

// Two pages' worth at maxpagesize=1: a next link only appears when count > pageSize.
const MIN_ITEMS = 2;

export interface PagingTestEntries {
  /** Folder with >= MIN_ITEMS child entries (for listEntries). */
  entriesFolderId: number;
  /** Entry with >= MIN_ITEMS field values (for listFields). */
  fieldsEntryId: number;
  /** Entry with >= MIN_ITEMS links (for listLinks). */
  linksEntryId: number;
  /** Entry with >= MIN_ITEMS tags (for listTags). */
  tagsEntryId: number;
  /** Deletes every top-level entry created here (children/targets cascade). */
  cleanup: () => Promise<void>;
}

async function deleteEntry(client: IRepositoryApiClient, entryId: number): Promise<void> {
  try {
    await client.entriesClient.startDeleteEntry({ repositoryId, entryId, request: new StartDeleteEntryRequest() });
  } catch {
    // best-effort cleanup
  }
}

export async function setupPagingEntries(client: IRepositoryApiClient): Promise<PagingTestEntries> {
  const topLevel: number[] = [];
  const stamp = 'JS PagingSetup';

  // --- Entries: a folder with MIN_ITEMS children ---
  const entriesFolder = await CreateEntry(client, `RepositoryApiClientIntegrationTest ${stamp} Entries`);
  topLevel.push(entriesFolder.id!);
  for (let i = 0; i < MIN_ITEMS; i++) {
    await CreateEntry(client, `child${i}`, entriesFolder.id!);
  }

  // --- Fields: an entry with MIN_ITEMS independent string-field values ---
  const fieldDefs = (await client.fieldDefinitionsClient.listFieldDefinitions({ repositoryId })).value ?? [];
  const usableFields = fieldDefs.filter(
    (f) => f.fieldType === FieldType.String && !f.constraint && (f.length ?? 0) >= 1
  );
  if (usableFields.length < MIN_ITEMS) {
    throw new Error(`Need >= ${MIN_ITEMS} unconstrained string field definitions; found ${usableFields.length}`);
  }
  const fieldsEntry = await CreateEntry(client, `RepositoryApiClientIntegrationTest ${stamp} Fields`);
  topLevel.push(fieldsEntry.id!);
  const setFieldsRequest = new SetFieldsRequest();
  setFieldsRequest.fields = usableFields.slice(0, MIN_ITEMS).map((f) => {
    const u = new FieldToUpdate();
    u.name = f.name!;
    u.values = ['a'];
    return u;
  });
  await client.entriesClient.setFields({ repositoryId, entryId: fieldsEntry.id!, request: setFieldsRequest });

  // --- Tags: an entry with MIN_ITEMS informational tags ---
  const tagDefs = (await client.tagDefinitionsClient.listTagDefinitions({ repositoryId })).value ?? [];
  const usableTags = tagDefs.filter(
    (t) => t.isSecure === false && !(t.name ?? '').includes('Automatically select tags')
  );
  if (usableTags.length < MIN_ITEMS) {
    throw new Error(`Need >= ${MIN_ITEMS} informational tag definitions; found ${usableTags.length}`);
  }
  const tagsEntry = await CreateEntry(client, `RepositoryApiClientIntegrationTest ${stamp} Tags`);
  topLevel.push(tagsEntry.id!);
  const setTagsRequest = new SetTagsRequest();
  setTagsRequest.tags = usableTags.slice(0, MIN_ITEMS).map((t) => t.name!);
  await client.entriesClient.setTags({ repositoryId, entryId: tagsEntry.id!, request: setTagsRequest });

  // --- Links: a folder linking to MIN_ITEMS target children ---
  const linkDefs = (await client.linkDefinitionsClient.listLinkDefinitions({ repositoryId })).value ?? [];
  if (linkDefs.length === 0) {
    throw new Error('Need >= 1 link definition');
  }
  const linksEntry = await CreateEntry(client, `RepositoryApiClientIntegrationTest ${stamp} Links`);
  topLevel.push(linksEntry.id!);
  const setLinksRequest = new SetLinksRequest();
  setLinksRequest.links = [];
  for (let i = 0; i < MIN_ITEMS; i++) {
    const target = await CreateEntry(client, `linkTarget${i}`, linksEntry.id!);
    const link = new LinkToUpdate();
    // Reuse a single link definition across distinct targets; fall back to distinct
    // definitions if the repo offers them (covers one-to-one link definitions).
    link.linkDefinitionId = (linkDefs[i] ?? linkDefs[0]).id!;
    link.otherEntryId = target.id!;
    setLinksRequest.links.push(link);
  }
  await client.entriesClient.setLinks({ repositoryId, entryId: linksEntry.id!, request: setLinksRequest });

  return {
    entriesFolderId: entriesFolder.id!,
    fieldsEntryId: fieldsEntry.id!,
    linksEntryId: linksEntry.id!,
    tagsEntryId: tagsEntry.id!,
    cleanup: async () => {
      for (const id of topLevel) {
        await deleteEntry(client, id);
      }
    },
  };
}
