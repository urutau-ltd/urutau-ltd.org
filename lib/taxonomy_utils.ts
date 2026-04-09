import { Data } from "lume/core/file.ts";

interface TaxonomyGroup {
    aliases: string[];
    label: string;
    url: string;
}

interface TaxonomyPageSpec {
    field: string;
    kind: string;
    createHeading: (label: string) => string;
    createQuery: (value: string) => string;
    createTitle: (label: string) => string;
    createUrl: (value: string) => string;
    extendPageData?: (group: TaxonomyGroup) => Record<string, unknown>;
}

const getDateValue = (page: Data): number => {
    return page.date instanceof Date
        ? page.date.getTime()
        : Number.NEGATIVE_INFINITY;
};

const getUrlValue = (page: Data): string => {
    return typeof page.url === "string" ? page.url : "";
};

const getUrlLabel = (url: string): string => {
    const segments: string[] = url.split("/").filter(Boolean);
    return segments.at(-1) ?? url;
};

const escapeHtml = (value: string): string => {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
};

export const groupTaxonomyValues = (
    values: string[],
    createUrl: (value: string) => string,
): TaxonomyGroup[] => {
    const groups: Map<string, string[]> = new Map();

    for (const value of values) {
        const trimmedValue: string = value.trim();

        if (!trimmedValue) {
            continue;
        }

        const url: string = createUrl(trimmedValue);
        const aliases: string[] = groups.get(url) ?? [];

        if (!aliases.includes(trimmedValue)) {
            aliases.push(trimmedValue);
            groups.set(url, aliases);
        }
    }

    return Array.from(groups.entries()).map(([url, aliases]) => ({
        aliases,
        label: aliases.length === 1 ? aliases[0] : getUrlLabel(url),
        url,
    }));
};

export const dedupeTaxonomyPages = (pages: Data[]): Data[] => {
    const pageMap: Map<string, Data> = new Map();

    for (const page of pages) {
        const url: string = getUrlValue(page);

        if (!pageMap.has(url)) {
            pageMap.set(url, page);
        }
    }

    return Array.from(pageMap.values()).sort((left: Data, right: Data) => {
        const dateDiff: number = getDateValue(right) - getDateValue(left);

        if (dateDiff !== 0) {
            return dateDiff;
        }

        return getUrlValue(left).localeCompare(getUrlValue(right));
    });
};

const renderPostsList = (posts: Data[]): string => {
    return posts.map((post: Data) => {
        const title: string = typeof post.title === "string"
            ? post.title
            : getUrlValue(post);

        return `
                <li>
                <a href="${getUrlValue(post)}">${escapeHtml(title)}</a>
                </li>
                `;
    }).join("");
};

const renderAliasNote = (kind: string, aliases: string[]): string => {
    if (aliases.length < 2) {
        return "";
    }

    const aliasList: string = aliases.map(escapeHtml).join(", ");

    return `
<p>
<small>Nota: esta página agrupa variantes de ${
        escapeHtml(kind)
    } que resuelven a la misma URL: ${aliasList}.</small>
</p>`;
};

export function* buildTaxonomyPages(
    search: Lume.Data["search"],
    spec: TaxonomyPageSpec,
): Generator<Record<string, unknown>> {
    const values: string[] = search.values(spec.field, "type=post") as string[];
    const groups: TaxonomyGroup[] = groupTaxonomyValues(values, spec.createUrl);

    for (const group of groups) {
        const posts: Data[] = dedupeTaxonomyPages(
            group.aliases.flatMap((alias: string) =>
                search.pages(spec.createQuery(alias), "date=desc")
            ),
        );

        if (posts.length === 0) {
            continue;
        }

        if (group.aliases.length > 1) {
            console.warn(
                `Taxonomy URL collision for ${spec.kind}: ${
                    group.aliases.join(", ")
                } -> ${group.url}. Building one shared page.`,
            );
        }

        yield {
            url: group.url,
            title: spec.createTitle(group.label),
            posts,
            content: `
<h1>${escapeHtml(spec.createHeading(group.label))}</h1>
${renderAliasNote(spec.kind, group.aliases)}
<ul>
${renderPostsList(posts)}
</ul>`,
            ...spec.extendPageData?.(group),
        };
    }
}
