import { assertEquals } from "@std/assert";
import { createAuthorUrl, createTagUrl } from "$urutau/lib/url_utils.ts";

// createTagUrl ==>

Deno.test("should handle single-word tags correctly", (): void => {
    const result: string = createTagUrl("Deno");
    assertEquals(result, "/tags/deno/");
});

Deno.test("should handle multi-word tags (spaces) correctly", (): void => {
    const result: string = createTagUrl("Gnu Software");
    assertEquals(result, "/tags/gnu-software/");
});

Deno.test("createTagUrl handles mixed case tags correctly", (): void => {
    const result: string = createTagUrl("JavaScript Post");
    assertEquals(result, "/tags/javascript-post/");
});

Deno.test("createTagUrl handles leading/trailing whitespace", (): void => {
    const result: string = createTagUrl("  Tutoriales  ");
    assertEquals(result, "/tags/tutoriales/");
});

Deno.test("createTagUrl removes punctuation and accents", (): void => {
    const result: string = createTagUrl(" Guía, TypeScript! ");
    assertEquals(result, "/tags/guia-typescript/");
});

// createAuthorUrl ==>
Deno.test("should handle single-word tags correctly", (): void => {
    const result: string = createAuthorUrl("Deno");
    assertEquals(result, "/author/deno/");
});

Deno.test("createAuthorUrl handles leading/trailing whitespace", (): void => {
    const result: string = createAuthorUrl(
        "  EverHadTheFeelingYouveBeenHereBefore  ",
    );
    assertEquals(result, "/author/everhadthefeelingyouvebeenherebefore/");
});

Deno.test("createAuthorUrl normalizes spaces and punctuation", (): void => {
    const result: string = createAuthorUrl(" SeÑor Example, Jr. ");
    assertEquals(result, "/author/senor-example-jr/");
});
