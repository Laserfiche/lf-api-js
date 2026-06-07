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
import { CreateEntry, getDeleteEntryAuditReasonId } from './BaseTest.js';
import {
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
  /** Deletes the top-level entry created here (children/targets cascade). */
  cleanup: () => Promise<void>;
}

async function deleteEntry(client: IRepositoryApiClient, entryId: number): Promise<void> {
  try {
    const request = new StartDeleteEntryRequest();
    // The repository requires an audit reason for DeleteEntry; without it the delete silently
    // fails and these cleanup entries accumulate in the shared repository.
    request.auditReasonId = await getDeleteEntryAuditReasonId(client);
    await client.entriesClient.startDeleteEntry({ repositoryId, entryId, request });
  } catch {
    // best-effort cleanup
  }
}

export async function setupPagingEntries(client: IRepositoryApiClient): Promise<PagingTestEntries> {
  // A single folder serves every list type: its >= MIN_ITEMS children cover listEntries and
  // double as link targets, and its own metadata covers listFields/listTags/listLinks. This
  // keeps the write volume low so back-to-back node + browser runs don't trip the repository
  // rate limiter.
  const folder = await CreateEntry(client, 'RepositoryApiClientIntegrationTest JS PagingSetup');
  const folderId = folder.id!;

  // Children — listed by listEntries and reused as link targets.
  const childIds: number[] = [];
  for (let i = 0; i < MIN_ITEMS; i++) {
    const child = await CreateEntry(client, `child${i}`, folderId);
    childIds.push(child.id!);
  }

  // Fields — MIN_ITEMS independent string-field values on the folder.
  const fieldDefs = (await client.fieldDefinitionsClient.listFieldDefinitions({ repositoryId })).value ?? [];
  const usableFields = fieldDefs.filter(
    (f) => f.fieldType === FieldType.String && !f.constraint && (f.length ?? 0) >= 1
  );
  if (usableFields.length < MIN_ITEMS) {
    throw new Error(`Need >= ${MIN_ITEMS} unconstrained string field definitions; found ${usableFields.length}`);
  }
  const setFieldsRequest = new SetFieldsRequest();
  setFieldsRequest.fields = usableFields.slice(0, MIN_ITEMS).map((f) => {
    const u = new FieldToUpdate();
    u.name = f.name!;
    u.values = ['a'];
    return u;
  });
  await client.entriesClient.setFields({ repositoryId, entryId: folderId, request: setFieldsRequest });

  // Tags — MIN_ITEMS informational tags on the folder.
  const tagDefs = (await client.tagDefinitionsClient.listTagDefinitions({ repositoryId })).value ?? [];
  const usableTags = tagDefs.filter(
    (t) => t.isSecure === false && !(t.name ?? '').includes('Automatically select tags')
  );
  if (usableTags.length < MIN_ITEMS) {
    throw new Error(`Need >= ${MIN_ITEMS} informational tag definitions; found ${usableTags.length}`);
  }
  const setTagsRequest = new SetTagsRequest();
  setTagsRequest.tags = usableTags.slice(0, MIN_ITEMS).map((t) => t.name!);
  await client.entriesClient.setTags({ repositoryId, entryId: folderId, request: setTagsRequest });

  // Links — link the folder to each of its children.
  const linkDefs = (await client.linkDefinitionsClient.listLinkDefinitions({ repositoryId })).value ?? [];
  if (linkDefs.length === 0) {
    throw new Error('Need >= 1 link definition');
  }
  const setLinksRequest = new SetLinksRequest();
  setLinksRequest.links = childIds.map((childId, i) => {
    const link = new LinkToUpdate();
    // Reuse a single link definition across distinct targets; fall back to distinct
    // definitions if the repo offers them (covers one-to-one link definitions).
    link.linkDefinitionId = (linkDefs[i] ?? linkDefs[0]).id!;
    link.otherEntryId = childId;
    return link;
  });
  await client.entriesClient.setLinks({ repositoryId, entryId: folderId, request: setLinksRequest });

  return {
    entriesFolderId: folderId,
    fieldsEntryId: folderId,
    linksEntryId: folderId,
    tagsEntryId: folderId,
    cleanup: async () => {
      await deleteEntry(client, folderId);
    },
  };
}
