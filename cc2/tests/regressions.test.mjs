import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function importSource(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}
const { getPaginationParams, paginatedQuery } = await importSource('../lib/pagination.js');
const { fetchJSON } = await importSource('../utils/fetch-json.js');

test('pagination bounds malformed and oversized input', () => {
  for (const [query, expected] of [
    [{}, { page: 1, limit: 20, skip: 0 }],
    [{ page: 'bad', limit: 'bad' }, { page: 1, limit: 20, skip: 0 }],
    [{ page: '-2', limit: '-5' }, { page: 1, limit: 1, skip: 0 }],
    [{ page: '3', limit: '999' }, { page: 3, limit: 100, skip: 200 }],
  ]) assert.deepEqual(getPaginationParams({ query }), expected);
});

test('paginated data starts without waiting for the count', async () => {
  let completeCount;
  const cursor = { sort() { return this; }, skip() { return this; }, limit() { return this; },
    toArray() { completeCount(21); return Promise.resolve([{ id: 1 }]); } };
  const collection = { countDocuments: () => new Promise((resolve) => { completeCount = resolve; }), find: () => cursor };
  const result = await paginatedQuery(collection, {}, { page: 1, limit: 20 });
  assert.equal(result.totalPages, 2);
  assert.equal(result.hasMore, true);
  assert.deepEqual(result.data, [{ id: 1 }]);
});

test('JSON requests report server errors and HTML redirects', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ error: 'Please sign in' }), { status: 401, headers: { 'Content-Type': 'application/json' } }));
  await assert.rejects(fetchJSON('/api/test'), /Please sign in/);
  globalThis.fetch = async () => new Response('<html>Login</html>', { headers: { 'Content-Type': 'text/html' } });
  await assert.rejects(fetchJSON('/api/test'), /Unexpected server response/);
});

test('JSON requests time out and respect already cancelled requests', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, { signal }) => new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
  }));
  await assert.rejects(fetchJSON('/slow', { timeout: 5 }), /too long/);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(fetchJSON('/cancelled', { signal: controller.signal }), { name: 'AbortError' });
});

const swSource = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
function worker() {
  const handlers = {};
  const stored = new Map();
  const deleted = [];
  const cache = { add: async () => {}, match: async (request) => stored.get(request.url), put: async (request, response) => stored.set(request.url, response), keys: async () => [], delete: async () => {} };
  const context = { URL, Response, self: { location: { origin: 'https://campus.test' }, addEventListener: (name, fn) => { handlers[name] = fn; }, skipWaiting() {}, clients: { claim: async () => {} } },
    caches: { open: async () => cache, match: async () => new Response('Offline fallback'), keys: async () => ['campusconnect-dynamic-v1', 'unrelated-cache'], delete: async (name) => { deleted.push(name); } }, fetch: async () => new Response('Fresh') };
  vm.runInNewContext(swSource, context);
  return { handlers, context, stored, deleted };
}

test('worker leaves APIs, mutations, and external requests uncached', () => {
  const { handlers } = worker();
  for (const request of [
    { url: 'https://campus.test/api/auth/session', method: 'GET' },
    { url: 'https://campus.test/api/posts', method: 'POST' },
    { url: 'https://external.test/image.png', method: 'GET' },
    { url: 'https://campus.test/_next/data/build/profile.json', method: 'GET' },
  ]) handlers.fetch({ request, respondWith() { assert.fail('must use the network directly'); } });
});

test('worker gets fresh pages and provides a navigation-only offline fallback', async () => {
  const { handlers, context, stored } = worker();
  const request = { url: 'https://campus.test/dashboard', method: 'GET', mode: 'navigate' };
  let response;
  handlers.fetch({ request, respondWith(promise) { response = promise; } });
  assert.equal(await (await response).text(), 'Fresh');
  assert.equal(stored.size, 0);
  context.fetch = async () => { throw new Error('offline'); };
  handlers.fetch({ request, respondWith(promise) { response = promise; } });
  assert.equal(await (await response).text(), 'Offline fallback');
});

test('worker removes old app caches without deleting other apps caches', async () => {
  const { handlers, deleted } = worker();
  let pending;
  handlers.activate({ waitUntil(promise) { pending = promise; } });
  await pending;
  assert.deepEqual(deleted, ['campusconnect-dynamic-v1']);
});
