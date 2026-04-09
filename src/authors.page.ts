import { buildTaxonomyPages } from "$urutau/lib/taxonomy_utils.ts";
import { createAuthorUrl } from "$urutau/lib/url_utils.ts";

export const layout: string = "layout.tsx";

export default function* ({ search }: Lume.Data) {
    yield* buildTaxonomyPages(search, {
        field: "author",
        kind: "autores",
        createHeading: (label: string): string =>
            `Artículos escritos por: ${label}`,
        createQuery: (author: string): string => `author=${author}`,
        createTitle: (label: string): string =>
            `Artículos escritos por: ${label}`,
        createUrl: createAuthorUrl,
    });
}
