// @license magnet:?xt=urn:btih:0b31508aeb0634b347b8270c7bee4d411b5d4109&dn=agpl-3.0.txt AGPL-3.0-or-later
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2026 Urutau-Ltd <softwarelibre@urutau-ltd.org>

(() => {
    if (!("serviceWorker" in navigator)) {
        return;
    }

    /**
     * Reloads the page once when an existing page gets a new service
     * worker, so the fresh shell serves instead of the stale loaded
     * document. First installs are skipped and the reload flag
     * prevents a loop.
     */
    const hadController = Boolean(navigator.serviceWorker.controller);
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!hadController || refreshing) {
            return;
        }
        refreshing = true;
        globalThis.location.reload();
    });

    globalThis.addEventListener("load", async () => {
        try {
            await navigator.serviceWorker.register(
                "/sw.js",
                {
                    type: "module",
                    scope: "/",
                    updateViaCache: "none",
                },
            );
        } catch (error) {
            console.error("SW: Failed to register service worker.", error);
        }
    });
})();
// @license-end
