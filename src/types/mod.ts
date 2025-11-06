/**
 * This interface defines the metadata structure used in all
 * markdown entries inside posts/ directory, ideally you
 * shouldn't use this definition outside the src/posts/_data.ts file.
 */
export interface PostMeta {
    /**
     * The title of the blog entry
     * This will be used in the SEO meta tags and the
     * OpenGraph image.
     * @type {string}
     */
    title: string;

    /**
     * A brief description or excerpt of the blog entry
     * This will be used in the SEO meta tags and the
     * OpenGraph image.
     * @type {string}
     */
    description: string;

    /**
     * The URL or path to the image used for OpenGraph
     * This will be used in the SEO meta tags and the
     * OpenGraph image.
     * @type {string}
     */
    image: string;

    /**
     * The language of the blog entry, e.g., "en", "es", "fr", "pt"
     *
     * You wouldn't want to change this unless you're
     * writing blog entries in other languages. But there's
     * the i18n plugin for that.
     * @type {string}
     */
    lang: string;

    /**
     * The name of the site or blog
     * @type {string}
     */
    site: string;
}
