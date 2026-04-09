import { buildTaxonomyPages } from "$urutau/lib/taxonomy_utils.ts";
import { createTagUrl } from "$urutau/lib/url_utils.ts";

export const layout: string = "layout.tsx";

export default function* ({ search }: Lume.Data) {
    yield* buildTaxonomyPages(search, {
        field: "tags",
        kind: "etiquetas",
        createHeading: (label: string): string =>
            `Posts etiquetados como ${label}`,
        createQuery: (tag: string): string => tag,
        createTitle: (label: string): string =>
            `Posts con la etiqueta: ${label}`,
        createUrl: createTagUrl,
        extendPageData: (
            group: { label: string },
        ): Record<string, unknown> => ({
            tag: group.label,
        }),
    });
}
