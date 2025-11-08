import { PostTags } from "$urutau/components/shared/PostTags.tsx";
import { PostAuthor } from "../shared/PostAuthor.tsx";

interface Props {
    title: string | undefined;
    description: string | undefined;
    date: Date;
    author: string;
    tags: string[];
    children?: JSX.Children;
}

const PostBody = (
    { title, description, author, tags, children, date }: Props,
): JSX.Component => {
    if (typeof title === "undefined") {
        title = "Got 'undefined' value for this component.";
    }

    const dateOpts: Readonly<Intl.DateTimeFormatOptions> = {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
    };

    return (
        <main class="airy">
            <h1>{title}</h1>
            <p>
                {description}
                <br />
                <b>Escrito por</b>: &nbsp;
                <PostAuthor author={author} />
                &nbsp; el: &nbsp; {date.toLocaleDateString("es-MX", dateOpts)}
            </p>
            <div class="container">
                Etiquetas:&nbsp;
                <PostTags tags={tags} />
            </div>
            {children}
        </main>
    );
};

export default PostBody;
