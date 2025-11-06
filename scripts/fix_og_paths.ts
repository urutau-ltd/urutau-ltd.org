import { join } from "@std/path";

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
    try {
        for await (const entry of Deno.readDir(targetDir)) {
            if (!entry.isDirectory) continue;

            const slug: string = entry.name;
            const indexPath: string = join(targetDir, slug, "index.html");

            try {
                const text: string = await Deno.readTextFile(indexPath);

                const contentRegex: RegExp = /\/posts\/@\/index\.png/g;

                if (contentRegex.test(text)) {
                    const replaced = text.replace(
                        contentRegex,
                        `/posts/${slug}/index.png`,
                    );
                    await Deno.writeTextFile(indexPath, replaced);
                    console.info(
                        `📝 Patched OG image path for post with slug: ${slug}`,
                    );
                }
            } catch (err: unknown) {
                if (err instanceof Deno.errors.NotFound) {
                    console.error(
                        `${indexPath} no such file or directory. Skipping...`,
                    );
                } else if (err instanceof Error) {
                    console.error(
                        `Error reading ${indexPath}: ${err.message}. Skipping...`,
                    );
                }
            }
        }
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error(
                `Error reading directory ${targetDir}: ${err.message}`,
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
