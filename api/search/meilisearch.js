import { getSearchIndexName } from './dictionaries.js';

export function getMeilisearchConfig() {
  return {
    host: process.env.MEILISEARCH_HOST || '',
    apiKey: process.env.MEILISEARCH_API_KEY || '',
    index: getSearchIndexName()
  };
}

export function isMeilisearchConfigured() {
  const config = getMeilisearchConfig();
  return Boolean(config.host);
}

async function meiliFetch(path, options = {}) {
  const config = getMeilisearchConfig();
  if (!config.host) {
    throw new Error('MEILISEARCH_HOST is not configured');
  }

  const url = `${config.host.replace(/\/$/, '')}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Meilisearch request failed (${response.status}): ${text}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

export async function meiliHealth() {
  return meiliFetch('/health', { method: 'GET' });
}

export async function meiliEnsureIndex() {
  const config = getMeilisearchConfig();
  try {
    await meiliFetch(`/indexes/${encodeURIComponent(config.index)}`, { method: 'GET' });
    return;
  } catch {
    await meiliFetch('/indexes', {
      method: 'POST',
      body: JSON.stringify({
        uid: config.index,
        primaryKey: 'entityId'
      })
    });
  }
}

export async function meiliUpdateSettings(settings) {
  const config = getMeilisearchConfig();
  return meiliFetch(`/indexes/${encodeURIComponent(config.index)}/settings`, {
    method: 'PATCH',
    body: JSON.stringify(settings)
  });
}

export async function meiliUpdateSynonyms(synonyms) {
  const config = getMeilisearchConfig();
  return meiliFetch(`/indexes/${encodeURIComponent(config.index)}/settings/synonyms`, {
    method: 'PUT',
    body: JSON.stringify(synonyms)
  });
}

export async function meiliDeleteAllDocuments() {
  const config = getMeilisearchConfig();
  return meiliFetch(`/indexes/${encodeURIComponent(config.index)}/documents`, {
    method: 'DELETE'
  });
}

export async function meiliAddDocuments(documents) {
  if (!Array.isArray(documents) || documents.length === 0) {
    return null;
  }
  const config = getMeilisearchConfig();
  return meiliFetch(`/indexes/${encodeURIComponent(config.index)}/documents`, {
    method: 'POST',
    body: JSON.stringify(documents)
  });
}

export async function meiliDeleteDocuments(documentIds) {
  if (!Array.isArray(documentIds) || documentIds.length === 0) {
    return null;
  }
  const config = getMeilisearchConfig();
  return meiliFetch(`/indexes/${encodeURIComponent(config.index)}/documents/delete-batch`, {
    method: 'POST',
    body: JSON.stringify(documentIds)
  });
}

export async function meiliSearch(query, params = {}) {
  const config = getMeilisearchConfig();
  return meiliFetch(`/indexes/${encodeURIComponent(config.index)}/search`, {
    method: 'POST',
    body: JSON.stringify({
      q: query,
      ...params
    })
  });
}

export async function meiliGetTask(taskUid) {
  return meiliFetch(`/tasks/${taskUid}`, { method: 'GET' });
}

export async function meiliWaitForTask(taskUid, timeoutMs = 120000, intervalMs = 500) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const task = await meiliGetTask(taskUid);
    if (task.status === 'succeeded') return task;
    if (task.status === 'failed') {
      throw new Error(`Meilisearch task failed: ${task.error?.message || 'unknown error'}`);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`Timed out waiting for Meilisearch task ${taskUid}`);
}
