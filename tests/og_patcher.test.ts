import { assertEquals } from "@std/assert";
import { patchOGPath } from "$urutau/lib/og_patcher.ts";

Deno.test("should replace the OpenGraph route correctly", (): void => {
    const slug: string = "give-me-radioactive-toy";
    const templateContent: string = `content="/posts/@/index.png"`;
    const expectedSubstitute: string = `content="/posts/${slug}/index.png"`;

    const initialContent: string = `
        <meta property="og:image" ${templateContent}>
        <p>Somewhere, but not here.</p>
    `;
    const expectedContent: string = `
        <meta property="og:image" ${expectedSubstitute}>
        <p>Somewhere, but not here.</p>
    `;

    console.info(
        `Testing with parameters:
- slug: ${slug}
- image content template: ${templateContent}
- expected substitution: ${expectedSubstitute}`,
    );

    const result: string = patchOGPath(initialContent, slug);

    assertEquals(
        result.trim(),
        expectedContent.trim(),
        "Standard case replacement not met! Fix the damned implementation!",
    );
});

Deno.test("should replace the OpenGraph route correctly for subroutes", (): void => {
    const slug: string = "give-me-radioactive-toy";
    const templateContent: string = `content="/posts/news/@/index.png"`;
    const expectedSubstitute: string =
        `content="/posts/news/${slug}/index.png"`;

    const initialContent: string = `
        <meta property="og:image" ${templateContent}>
        <p>Somewhere, but not here.</p>
    `;
    const expectedContent: string = `
        <meta property="og:image" ${expectedSubstitute}>
        <p>Somewhere, but not here.</p>
    `;

    console.info(
        `Testing with parameters:
- slug: ${slug}
- image content template: ${templateContent}
- expected substitution: ${expectedSubstitute}`,
    );

    const result: string = patchOGPath(initialContent, slug);

    assertEquals(
        result.trim(),
        expectedContent.trim(),
        "Subroutes case replacement not met! Fix the damned implementation!",
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

Deno.test("should replace correctly for deep nested categories", (): void => {
    const slug: string = "nested-post-slug";
    const initialContent: string = `
        <meta property="og:image" content="/archive/2024/articles/@/index.png">
    `;
    const expectedContent: string = `
        <meta property="og:image" content="/archive/2024/articles/${slug}/index.png">
    `;

    const result: string = patchOGPath(initialContent, slug);

    assertEquals(
        result.trim(),
        expectedContent.trim(),
        "Failed to replace path in deeply nested category structure.",
    );
});

Deno.test("should handle different base paths (e.g., /tutorial)", (): void => {
    const slug: string = "setup-deno-env";
    const initialContent: string = `
        <meta property="og:image" content="/tutorials/@/index.png">
    `;
    const expectedContent: string = `
        <meta property="og:image" content="/tutorials/${slug}/index.png">
    `;

    const result: string = patchOGPath(initialContent, slug);

    assertEquals(
        result.trim(),
        expectedContent.trim(),
        "Failed to replace path with a non-/posts base URL.",
    );
});

Deno.test("should replace correctly with a slug containing hyphens and numbers", (): void => {
    const slug: string = "project-x-2024-update";
    const initialContent: string = `
        <meta property="og:image" content="/posts/@/index.png">
    `;
    const expectedContent: string = `
        <meta property="og:image" content="/posts/${slug}/index.png">
    `;

    const result: string = patchOGPath(initialContent, slug);

    assertEquals(
        result.trim(),
        expectedContent.trim(),
        "Failed to handle slug with hyphens and numbers.",
    );
});

Deno.test("should NOT replace similar but incorrect patterns", (): void => {
    const slug: string = "safe-slug";
    const initialContent: string = `
        <meta property="og:image" content="/posts/index.png">
        <link rel="icon" href="/@/favicon.ico">
        <meta property="og:url" content="/posts/@/not-index.html">
    `;
    const expectedContent: string = initialContent;

    const result: string = patchOGPath(initialContent, slug);

    assertEquals(
        result.trim(),
        expectedContent.trim(),
        "Incorrectly replaced a pattern that was close but didn't match the exact placeholder.",
    );
});

Deno.test("should NOT replace if the placeholder changes from '@'", (): void => {
    const slug: string = "new-system";
    const initialContent: string = `
        <meta property="og:image" content="/posts/[SLUG]/index.png">
        <p>Using a new placeholder: [SLUG]</p>
    `;
    // Se espera que el contenido no cambie porque la RegEx solo busca '/@/'.
    const expectedContent: string = initialContent;

    const result: string = patchOGPath(initialContent, slug);

    assertEquals(
        result.trim(),
        expectedContent.trim(),
        "Incorrectly replaced a placeholder that was not '@'!",
    );
});
