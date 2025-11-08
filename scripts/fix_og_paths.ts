import { join } from "@std/path";
import { patchOGPath } from "$urutau/lib/og_patcher.ts";

/**
 * This function is a workaround to fix the OpenGraph paths not being accessible from the metas plugin with the
 * og_images plugin in Lume static site generator. It scans through the specified target directory,
 * looks for post directories, and updates the OG image paths in the index.html files to include the correct slug.
 *
 * This can be used as both a hook and a standalone script. See the README for usage instructions.
 *
 * @param {string} targetDir - The target directory containing post directories.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete either successfully or with an error.
 */
export const fixOGPaths = async (
    targetDir: string = "./output/posts",
): Promise<void> => {
    console.info(
        `🔎 Scanning ${targetDir} for OpenGraph placeholders...`,
    );

    // This acts as a flag, it's kinda bloat but prettier output was never
    // never a sin in my book.
    let foundMatch: boolean = false;

    try {
        for await (const entry of Deno.readDir(targetDir)) {
            if (!entry.isDirectory) continue;

            const slug: string = entry.name;
            const indexPath: string = join(targetDir, slug, "index.html");

            try {
                const text: string = await Deno.readTextFile(indexPath);
                const replaced: string = patchOGPath(text, slug);

                if (replaced !== text) {
                    await Deno.writeTextFile(indexPath, replaced);
                    console.info(
                        `✅ Post with slug '${slug}' found/patched!`,
                    );
                    foundMatch = true;
                } else {
                    console.info(
                        `➡️ Skipped post with slug: ${slug} (already patched or no match found)`,
                    );
                    foundMatch = true;
                }
            } catch (err: unknown) {
                if (err instanceof Deno.errors.NotFound) {
                    console.warn(
                        `⚠️ ${indexPath} no such file or directory. Skipping for recursive search...`,
                    );

                    const categoryPath: string = join(targetDir, entry.name);

                    console.info(
                        `⬇️ Category directory found! Digging down to: ${entry.name}/...`,
                    );

                    await fixOGPaths(categoryPath);

                    continue;
                } else if (err instanceof Error) {
                    console.error(
                        `❌ Error reading ${indexPath}: ${err.message}. Skipping...`,
                    );
                }
            }
        }

        // Increasing for & try/catch complexity as if TypeScript wasn't
        // unbearably slow already...
        if (!foundMatch && targetDir !== "./output/posts") {
            console.warn(
                `⚠️ No posts found at ${targetDir} level! Going up again...`,
            );
        } else {
            console.info(
                `✅ Finished scanning ${targetDir}...`,
            );
        }
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error(
                `❌ Error reading directory ${targetDir}: ${err.message}`,
            );
            throw err;
        } else {
            throw err;
        }
    }
};

if (import.meta.main) {
    const arg: string = Deno.args[0] ?? "./output/posts";
    await fixOGPaths(arg);
}
