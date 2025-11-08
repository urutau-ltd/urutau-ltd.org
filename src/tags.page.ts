import { Data } from "lume/core/file.ts";
import { createTagUrl } from "$urutau/lib/url_utils.ts";

export const layout: string = "layout.tsx";

export default function* ({ search }: Lume.Data) {
    /* For some reason this function returns the tags
     array as a unknown[] type. Hence the cursed
    type annotations since we know this should be
    a string[] type
    */
    const allUniqueTags: string[] = search.values(
        "tags",
        "type=post",
    ) as string[];

    for (const tag of allUniqueTags) {
        const postsWithThisTag: Data[] = search.pages(
            tag,
            "date=desc",
        );

        if (postsWithThisTag.length === 0) {
            continue;
        }

        yield {
            url: createTagUrl(tag),
            title: `Posts con la etiqueta: ${tag}`,
            tag: tag,
            posts: postsWithThisTag,
            content: `
<h1>Posts etiquetados como ${tag}</h1>
<ul>
${
                postsWithThisTag.map((post) => {
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
