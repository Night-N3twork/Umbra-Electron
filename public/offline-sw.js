var cacheName = 'UmbraCache';
var filesToCache = [
  '/',
  '/index.html',
  '/assets/js/index.js',
  '/assets/css/index.css',
  '/assets/imgs/main.png',
  '/assets/imgs/music.png',
  '/offline-sw.js',
  '/assets/js/localforage.min.js'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(filesToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', function(e) {
  if (e.request.method === 'GET') {
    e.respondWith(
      fetch(e.request).then(function(networkResponse) {
        // Update the cache with the latest version of the file
        return caches.open(cacheName).then(function(cache) {
          cache.put(e.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(function() {
        // If the network request fails, try to serve the request from the cache
        return caches.match(e.request);
      })
    );
  } else {
    // For non-GET requests, just fetch from the network
    e.respondWith(fetch(e.request));
  }
});