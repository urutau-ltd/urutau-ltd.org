import { createTagUrl } from "$urutau/lib/url_utils.ts";

interface Props {
    tags: string[];
}

/**
 * This component is used in both the urutau-ltd.org index page
 * and inside PostBody to render a list of missing.css chip elements
 * as a list of post tags.
 */
export const PostTags = ({ tags }: Props): JSX.Component => {
    return (
        <>
            {tags.map((tag: string): JSX.Component => (
                <chip class="info">
                    <a href={createTagUrl(tag)}>
                        {tag}
                    </a>
                </chip>
            ))}
        </>
    );
};
