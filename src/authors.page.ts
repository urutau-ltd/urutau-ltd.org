import { Data } from "lume/core/file.ts";
import { createAuthorUrl } from "$urutau/lib/url_utils.ts";

export const layout: string = "layout.tsx";

export default function* ({ search }: Lume.Data) {
    /* For some reason this function returns the tags
     array as a unknown[] type. Hence the cursed
    type annotations since we know this should be
    a string[] type
    */
    const allUniqueAuthors: string[] = search.values(
        "author",
        "type=post",
    ) as string[];

    for (const author of allUniqueAuthors) {
        const postsByAuthor: Data[] = search.pages(
            `author=${author}`,
            "date=desc",
        );

        if (postsByAuthor.length === 0) {
            continue;
        }

        yield {
            url: createAuthorUrl(author),
            title: `Artículos escritor por: ${author}`,
            posts: postsByAuthor,
            content: `
<h1>Artículos escritos por: ${author}</h1>
<ul>
${
                postsByAuthor.map((post) => {
                    return `
                <li>
                <a href="${post.url}">${post.title}</a>
                </li>
                `;
                }).join("")
            }
</ul>`,
        };
    }
}
