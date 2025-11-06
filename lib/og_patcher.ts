/**
 * Do not use outside the og_paths module.
 * This regexp is used to replace the: /posts/@/index.png pattern
 */
const OG_PATH_REGEX: RegExp = /\/posts\/@\/index\.png/g;

/**
 * On primitive types level, this "patches" the HTML file path to the
 * OpenGraph image by replacing the placeholder with the slug.
 *
 * @param {string} content - The HTML content of the file to be processed.
 * @param {string} slug - The blog post slug (should be the directory name).
 * @returns {string} - a string containing the patched HTML path.
 */
export const patchOGPath = (content: string, slug: string): string => {
    const newPath: string = `/posts/${slug}/index.png`;

    if (OG_PATH_REGEX.test(content)) {
        return content.replace(OG_PATH_REGEX, newPath);
    }

    return content;
};
