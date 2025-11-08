import { createAuthorUrl } from "$urutau/lib/url_utils.ts";

interface Props {
    author: string;
}

export const PostAuthor = ({ author }: Props): JSX.Component => {
    return (
        <chip>
            <a href={createAuthorUrl(author)}>
                {author}
            </a>
        </chip>
    );
};
