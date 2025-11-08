/**
 * Normally used in src/components, the tags.page.ts generator
 * and the authors.page.ts generator. Not anywhere else.
 * It serves its purpose as a tag normalizer, removing spaces and
 * replacing them with hyphens (-)
 *
 * @param {string} tag - The tag name (e.g "Tutoriales")
 * @returns {string} The slug URL (e.g "/tags/tutoriales")
 */
export const createTagUrl = (tag: string): string => {
    return `/tags/${tag.trim().toLowerCase().replace(/\s+/g, "-")}/`;
};

/**
 * Normally used in the authors.page.ts generator. Not anywhere else.
 * It serves its purpose as a URL normalizer, removing spaces and
 * replacing them with hyphens (-)
 *
 * @param {string} author - The author name (e.g "FuncProgLinux")
 * @returns {string} The slug URL (e.g "/author/funcproglinux")
 */
export const createAuthorUrl = (author: string): string => {
    return `/author/${author.trim().toLowerCase()}/`;
};
