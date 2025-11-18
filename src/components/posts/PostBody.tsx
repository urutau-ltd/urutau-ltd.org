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

/**
 * This component represents the "readable" portion of a blog post inside the
 * website. It's meant to be used only in the src/_includes/layouts/post.tsx
 * layout component.
 *
 * @returns {JSX.Component} a JSX component representing the post reading section
 */
const PostBody = (
    { title, description, author, tags, children, date }: Readonly<Props>,
): JSX.Component => {
    if (typeof title === "undefined") {
        title = "Got 'undefined' value for this component.";
    }

    if (typeof description === "undefined") {
        description = "Got 'undefined' value for this component.";
    }

    const dateOpts: Readonly<Intl.DateTimeFormatOptions> = {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
    };

    return (
        <main>
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
            <article>
                {children}
            </article>
        </main>
    );
};

export default PostBody;
