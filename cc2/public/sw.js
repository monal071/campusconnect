// Cache only the offline fallback and immutable Next.js assets. Never store
// authentication, API responses, or personalized HTML on a shared device.
const CACHE = "campusconnect-static-v2";
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add("/offline.html")));
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith("campusconnect-") && name !== CACHE).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () =>
      (await caches.match("/offline.html")) || new Response("You are offline. Please reconnect and retry.", { status: 503 })
    ));
    return;
  }
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) {
        await cache.put(request, response.clone());
        const keys = await cache.keys();
        if (keys.length > 120) {
          const oldest = keys.find((key) => new URL(key.url).pathname !== "/offline.html");
          if (oldest) await cache.delete(oldest);
        }
      }
      return response;
    })());
  }
});

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data?.json() || {}; } catch { data = { body: event.data?.text() }; }
  event.waitUntil(self.registration.showNotification(data.title || "CampusConnect", {
    body: data.body || "You have a new notification", icon: "/campusconnect-logo.svg", data: data.url || "/dashboard",
  }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "close") return;
  event.waitUntil((async () => {
    let destination = new URL("/dashboard", self.location.origin);
    try {
      const candidate = new URL(event.notification.data, self.location.origin);
      if (candidate.origin === self.location.origin) destination = candidate;
    } catch {}
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find((client) => client.url === destination.href);
    if (existing) return existing.focus();
    return self.clients.openWindow(destination.href);
  })());
});
