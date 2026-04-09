// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright © 2026 Urutau-Ltd <softwarelibre@urutau-ltd.org>

(() => {
    const initPagefind = () => {
        const container = document.getElementById("search");

        if (!container || typeof globalThis.PagefindUI !== "function") {
            return;
        }

        if (container.dataset.pagefindReady === "true") {
            return;
        }

        container.dataset.pagefindReady = "true";

        new globalThis.PagefindUI({
            element: "#search",
            showImages: false,
            excerptLength: 0,
            showEmptyFilters: true,
            showSubResults: false,
            resetStyles: false,
            bundlePath: "/pagefind/",
            baseUrl: "/",
        });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initPagefind, {
            once: true,
        });
    } else {
        initPagefind();
    }
})();
