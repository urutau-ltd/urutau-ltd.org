import { assertEquals } from "@std/assert";
import {
    dedupeTaxonomyPages,
    groupTaxonomyValues,
} from "$urutau/lib/taxonomy_utils.ts";
import { createTagUrl } from "$urutau/lib/url_utils.ts";
import { Data } from "lume/core/file.ts";

Deno.test("groupTaxonomyValues merges aliases that resolve to the same URL", (): void => {
    const groups = groupTaxonomyValues(
        ["TypeScript", "TypeSCript", "Deno"],
        createTagUrl,
    );

    assertEquals(groups, [
        {
            aliases: ["TypeScript", "TypeSCript"],
            label: "typescript",
            url: "/tags/typescript/",
        },
        {
            aliases: ["Deno"],
            label: "Deno",
            url: "/tags/deno/",
        },
    ]);
});

Deno.test("dedupeTaxonomyPages keeps one page per URL and sorts by date desc", (): void => {
    const pages: Data[] = [
        {
            date: new Date("2025-11-28"),
            title: "Older post",
            url: "/posts/older/",
        } as Data,
        {
            date: new Date("2026-04-08"),
            title: "Newest post",
            url: "/posts/newest/",
        } as Data,
        {
            date: new Date("2026-04-08"),
            title: "Newest post duplicate alias",
            url: "/posts/newest/",
        } as Data,
    ];

    assertEquals(
        dedupeTaxonomyPages(pages).map((page: Data) => page.url),
        ["/posts/newest/", "/posts/older/"],
    );
});
