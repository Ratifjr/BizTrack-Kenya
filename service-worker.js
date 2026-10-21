
const CACHE_NAME = "biztrack-shell-v1";

const APP_FILES = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json",
    "./icon.svg"
];

self.addEventListener("install", function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(APP_FILES);
        })
    );

    self.skipWaiting();
});

self.addEventListener("activate", function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames
                    .filter(function(name) {
                        return name.startsWith("biztrack-shell-") &&
                            name !== CACHE_NAME;
                    })
                    .map(function(name) {
                        return caches.delete(name);
                    })
            );
        })
    );

    self.clients.claim();
});

self.addEventListener("fetch", function(event) {
    if (event.request.method !== "GET") {
        return;
    }

    const requestUrl = new URL(event.request.url);

    if (requestUrl.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        fetch(event.request).then(function(response) {
            if (response.ok) {
                const copy = response.clone();

                caches.open(CACHE_NAME).then(function(cache) {
                    cache.put(event.request, copy);
                });
            }

            return response;
        }).catch(function() {
            return caches.match(event.request).then(function(cached) {
                return cached || caches.match("./index.html");
            });
        })
    );
});
