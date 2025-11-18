/**
 * Service Worker script that implements caching strategies for offline
 * support and improved performance.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API}
 *
 * @info This service worker makes use of the 'any' type annotations because Deno doesn't
 *   have built-in types for Service Workers yet. Once Deno adds support for Service Worker
 *  types, these annotations can be updated to use the appropriate types.
 */

/** @type {any} */
const sw = self;

/**
 * Cache version string. Bump the version to invalidate every cache bucket.
 * @type {string}
 */
const CACHE_VERSION = "urutau-v1.1.1";

/**
 * Cache name that stores the application shell and other immutable assets.
 * @type {string}
 */
const STATIC_CACHE_NAME = `static-assets-${CACHE_VERSION}`;

/**
 * Cache name for HTML pages (posts, entries, landing pages, etc.).
 * @type {string}
 */
const PAGES_CACHE_NAME = `pages-${CACHE_VERSION}`;

/**
 * Document served when every other strategy fails.
 * Changing this path also requires adding it to {@link APP_SHELL_URLS}.
 * @type {string}
 */
const FALLBACK_DOCUMENT_URL = "/404.html";

/**
 * Maximum number of page entries to keep in the {@link PAGES_CACHE_NAME}.
 * @type {number}
 */
const MAX_PAGE_ENTRIES = 40;

/**
 * Static asset pattern used for cache lookups (CSS, JS, fonts, images, etc.).
 * @type {RegExp}
 */
const STATIC_ASSET_PATTERN =
    /\.(?:css|js|png|jpg|jpeg|gif|svg|webp|woff2?|eot|ttf|otf)$/;

/**
 * Hostnames treated as development environments. We keep caching logic relaxed
 * locally to make debugging easier.
 * @type {Set<string>}
 */
const DEV_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);

/**
 * Flag indicating whether we are developing locally.
 * @type {boolean}
 */
const isLocalhost = DEV_HOSTNAMES.has(sw.location.hostname);

/**
 * List of URLs to precache so the core site works when the network is gone.
 * Make sure to keep this list in sync with any changes in your layout shell.
 * @type {string[]}
 */
const APP_SHELL_URLS = [
    "/",
    "/index.html",
    "/404.html",
    "/missing.css",
    "/urutau.css",
    "/img/urutau.png",
    "/favicon.ico",
];

/**
 * Creates a generic offline response for requests without a better fallback.
 * @returns {Response}
 */
const createOfflineResponse = () =>
    new Response(
        "Offline. Revisa tu conexión a internet o intenta más tarde.", // In spanish since the user might read this and the app is in spanish anyways
        {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        },
    );

/**
 * Logs information when running locally for easier debugging.
 * @param {...unknown} args
 * @returns {void}
 */
const log = (...args) => {
    if (isLocalhost) {
        console.log("[SW]", ...args);
    }
};

/**
 * Determines if a request is a same-origin GET that we are allowed to cache.
 * @param {Request} request
 * @returns {boolean}
 */
const shouldHandleRequest = (request) => {
    if (request.method !== "GET") {
        return false;
    }

    /** @type {URL} */
    const requestUrl = new URL(request.url);
    return requestUrl.origin === sw.location.origin;
};

/**
 * Determines if the request expects an HTML document (navigations & posts).
 * @param {Request} request
 * @returns {boolean}
 */
const isHtmlNavigationRequest = (request) => {
    if (request.mode === "navigate") {
        return true;
    }

    /** @type {string} */
    const acceptHeader = request.headers.get("accept") || "";
    return acceptHeader.includes("text/html");
};

/**
 * Determines if the response can be safely stored in a cache bucket.
 * @param {Response} response
 * @returns {boolean}
 */
const isCacheableResponse = (response) =>
    Boolean(
        response &&
            response.status === 200 &&
            (response.type === "basic" || response.type === "default"),
    );

/**
 * Returns the offline fallback document or undefined when not cached yet.
 * @returns {Promise<Response | undefined>}
 */
const getFallbackDocument = async () => {
    /** @type {Cache} */
    const staticCache = await caches.open(STATIC_CACHE_NAME);
    return (await staticCache.match(FALLBACK_DOCUMENT_URL)) ||
        staticCache.match("/");
};

/**
 * Removes the oldest entries from a cache so it never grows unbounded.
 * @param {string} cacheName
 * @param {number} maxEntries
 * @returns {Promise<void>}
 */
const trimCache = async (cacheName, maxEntries) => {
    if (maxEntries < 1) {
        return;
    }

    /** @type {Cache} */
    const cache = await caches.open(cacheName);

    /** @type {Readonly<Request[]>} */
    const keys = await cache.keys();
    if (keys.length <= maxEntries) {
        return;
    }

    /** @type {Request[]} */
    const keysToDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(keysToDelete.map((key) => cache.delete(key)));
};

/**
 * Stale-while-revalidate strategy for immutable static assets.
 * Responds immediately with a cached copy (if any) while updating the cache in
 * the background for future visits.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
const staleWhileRevalidate = async (request) => {
    /** @type {Cache} */
    const cache = await caches.open(STATIC_CACHE_NAME);

    /** @type {Response | undefined} */
    const cachedResponse = await cache.match(request);

    /** @type {Promise<Response>} */
    const fetchAndUpdate = fetch(request).then(async (response) => {
        if (isCacheableResponse(response)) {
            await cache.put(request, response.clone());
        }
        return response;
    });

    if (cachedResponse) {
        fetchAndUpdate.catch(() => {});
        return cachedResponse;
    }

    return fetchAndUpdate.catch(async () => {
        /** @type {Response | undefined} */
        const fallback = await getFallbackDocument();
        return fallback || createOfflineResponse();
    });
};

/**
 * Network-first strategy for HTML pages (blog posts, entries, etc.).
 * Falls back to cached content when offline, then to the offline document.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
const networkFirstPage = async (request) => {
    /** @type {Cache} */
    const cache = await caches.open(PAGES_CACHE_NAME);

    try {
        /** @type {Response} */
        const response = await fetch(request);
        if (isCacheableResponse(response)) {
            await cache.put(request, response.clone());
            await trimCache(PAGES_CACHE_NAME, MAX_PAGE_ENTRIES);
        }
        return response;
    } catch (error) {
        log("Network navigation failed, falling back to cache.", error);

        /** @type {Response | undefined} */
        const cached = await cache.match(request);
        if (cached) {
            return cached;
        }

        /** @type {Response | undefined} */
        const fallback = await getFallbackDocument();
        return fallback || createOfflineResponse();
    }
};

/**
 * Removes every cache that does not match the current list of valid names.
 * @returns {Promise<void>}
 */
const cleanupLegacyCaches = async () => {
    /** @type {Set<string>} */
    const validCacheNames = new Set([STATIC_CACHE_NAME, PAGES_CACHE_NAME]);

    /** @type {string[]} */
    const cacheNames = await caches.keys();
    await Promise.all(
        cacheNames.map((cacheName) => {
            if (!validCacheNames.has(cacheName)) {
                return caches.delete(cacheName);
            }
            return undefined;
        }),
    );
};

/**
 * Handles the `install` lifecycle event. Pre-caches the application shell so
 * the most important assets stay available while offline.
 * @param {any} event
 * @returns {void}
 */
const handleInstall = (event) => {
    sw.skipWaiting();
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => cache.addAll(APP_SHELL_URLS))
            .then(() => log("Precaching completed."))
            .catch((error) => {
                console.warn("[SW] Precaching failed:", error);
            }),
    );
};

/**
 * Handles the `activate` lifecycle event.
 * - Takes control of uncontrolled pages.
 * - Cleans caches that belong to older versions.
 * @param {any} event
 * @returns {void}
 */
const handleActivate = (event) => {
    sw.clients.claim();
    event.waitUntil(
        cleanupLegacyCaches().catch((error) => {
            console.warn("[SW] Cache cleanup failed:", error);
        }),
    );
};

/**
 * Handles fetch events with different caching strategies per resource type.
 * @param {any} event
 * @returns {void}
 */
const handleFetch = (event) => {
    const { request } = event;

    if (isLocalhost) {
        if (request.url.includes("hot-reload")) {
            return;
        }
        event.respondWith(fetch(request));
        return;
    }

    if (!shouldHandleRequest(request)) {
        return;
    }

    if (isHtmlNavigationRequest(request)) {
        event.respondWith(networkFirstPage(request));
        return;
    }

    /** @type {URL} */
    const requestUrl = new URL(request.url);

    if (STATIC_ASSET_PATTERN.test(requestUrl.pathname)) {
        event.respondWith(staleWhileRevalidate(request));
        return;
    }

    event.respondWith(
        fetch(request).catch(async () => {
            const fallback = await getFallbackDocument();
            return fallback || createOfflineResponse();
        }),
    );
};

/**
 * Lightweight message handler so the page can trigger lifecycle shortcuts.
 * Example usage inside the client:
 * navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
 * @param {any} event
 * @returns {void}
 */
const handleMessage = (event) => {
    if (!event.data) {
        return;
    }
    if (event.data.type === "SKIP_WAITING") {
        sw.skipWaiting();
    }
};

sw.addEventListener("install", handleInstall);
sw.addEventListener("activate", handleActivate);
sw.addEventListener("fetch", handleFetch);
sw.addEventListener("message", handleMessage);
