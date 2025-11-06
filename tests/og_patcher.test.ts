import { assertEquals } from "@std/assert";
import { patchOGPath } from "$urutau/lib/og_patcher.ts";

Deno.test("should replace the OpenGraph route correctly", (): void => {
    const slug: string = "give-me-radioactive-toy";
    const initialContent: string = `
        <meta property="og:image" content="/posts/@/index.png">
        <p>Somewhere, but not here.</p>
    `;
    const expectedContent: string = `
        <meta property="og:image" content="/posts/give-me-radioactive-toy/index.png">
        <p>Somewhere, but not here.</p>
    `;

    const result: string = patchOGPath(initialContent, slug);

    assertEquals(
        result.trim(),
        expectedContent.trim(),
        "Standard case replacement not met! Fix the damned implementation!",
    );
});

Deno.test("should NOT change the content if no match is found", (): void => {
    const slug = "post-without-og-image";
    const initialContent = `
        <meta property="og:title" content="Title">
        <p>Ever had the feeling you've been here before?.</p>
    `;

    const result: string = patchOGPath(initialContent, slug);

    assertEquals(
        result.trim(),
        initialContent.trim(),
        "Initial content was changed even though there was no match! Fix this ASAP!",
    );
});

Deno.test("should handle multiple coincidences", (): void => {
    const slug: string = "post-multiple";
    const initialContent: string = `
        <meta property="og:image" content="/posts/@/index.png">
        <meta name="twitter:image" content="/posts/@/index.png">
    `;
    const expectedContent: string = `
        <meta property="og:image" content="/posts/post-multiple/index.png">
        <meta name="twitter:image" content="/posts/post-multiple/index.png">
    `;

    const result: string = patchOGPath(initialContent, slug);

    assertEquals(
        result.trim(),
        expectedContent.trim(),
        "Failed replacing multiple instances of OG paths.",
    );
});
