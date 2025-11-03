/** @type {string} */
const CACHE_VERSION = "urutau-v1.0.0";

/** @type {string} */
const STATIC_CACHE_NAME = `static-assets-${CACHE_VERSION}`;

/** @type {string} */
const PAGES_CACHE_NAME = `pages-${CACHE_VERSION}`;

/** @type {boolean} */
const isLocalhost = self.location.hostname === "localhost" ||
    self.location.hostname === "127.0.0.1";

/** @type {string[]} */
const APP_SHELL_URLS = [
    "/",
    "/index.html",
    "/404.html",
    "/missing.css",
    "/urutau.css",
    "/img/urutau.png",
    "/favicon.ico",
];

const staleWhileRevalidate = async (
    request,
) => {
    /** @type {Cache} */
    const cache = await caches.open(STATIC_CACHE_NAME);

    /** @type {Response | undefined} */
    const cachedResponse = await cache.match(request);

    /** @type {Promise<void | Response>} */
    const networkFetch = fetch(request).then(
        async (response) => {
            if (
                response && response.status === 200 && response.type === "basic"
            ) {
                await cache.put(request, response.clone());
            }
            return response;
        },
    ).catch(
        () => {},
    );

    return cachedResponse || networkFetch;
};

const handleInstall = (event) => {
    self.skipWaiting();
    if (isLocalhost) {
        console.log(`SW: Localhost detected. Skipping precaching.`);
    }

    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log(`SW: Applying precaching strategy.`);
                return cache.addAll(APP_SHELL_URLS);
            }),
    );
};

const handleActivate = (event) => {
    self.clients.claim();
    if (isLocalhost) {
        console.log("SW: Entorno local detectado. Saltando limpieza de caché.");
        return;
    }

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Limpia solo cachés que no coincidan con las versiones actuales
                    if (
                        cacheName !== STATIC_CACHE_NAME &&
                        cacheName !== PAGES_CACHE_NAME
                    ) {
                        console.log(
                            "SW: Producción. Eliminando caché antigua:",
                            cacheName,
                        );
                        return caches.delete(cacheName);
                    }
                }),
            );
        }),
    );
};

const handleFetch = (event) => {
    const request = event.request;
    const url = new URL(request.url);

    if (isLocalhost) {
        if (request.url.includes("hot-reload")) {
            return;
        }
        event.respondWith(fetch(request));
        return;
    }

    if (request.mode === "navigate" || request.destination === "document") {
        event.respondWith(
            fetch(request).catch(async () => {
                const cache = await caches.open(STATIC_CACHE_NAME);
                return cache.match("/404.html") || cache.match("/");
            }),
        );
        return;
    }

    const isStaticAsset =
        /\.(?:css|js|png|jpg|jpeg|gif|svg|webp|woff2?|eot|ttf|otf)$/.test(
            url.pathname,
        );
    if (isStaticAsset) {
        event.respondWith(staleWhileRevalidate(request));
        return;
    }

    event.respondWith(fetch(request));
};

self.addEventListener("install", handleInstall);
self.addEventListener("activate", handleActivate);
self.addEventListener("fetch", handleFetch);
