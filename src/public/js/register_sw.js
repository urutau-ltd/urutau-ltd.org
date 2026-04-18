// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2026 Urutau-Ltd <softwarelibre@urutau-ltd.org>

(() => {
    if (!("serviceWorker" in navigator)) {
        return;
    }

    globalThis.addEventListener("load", async () => {
        try {
            const registration = await navigator.serviceWorker.register(
                "/sw.js",
                {
                    type: "module",
                    scope: "/",
                    updateViaCache: "none",
                },
            );
            await registration.update();
        } catch (error) {
            console.error("SW: Failed to register service worker.", error);
        }
    });
})();
