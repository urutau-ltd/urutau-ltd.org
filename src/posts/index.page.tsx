import { Data } from "lume/types.ts";
import { createPostsArchiveUrl, createTagUrl } from "$urutau/lib/url_utils.ts";
import { escape as escapeHtml } from "@std/html";
import { PaginationInfo } from "lume/plugins/paginate.ts";

export const title: string = "Archivo de publicación";
export const type: string = "page";
export const layout: string = "layouts/blog.tsx";
export const description: string =
    "Archivo del blog de Urutaú Limited con todas las publicaciones ordenadas por fecha.";
const POSTS_PER_PAGE: number = 10;

const formatDate = (date: Date): string => {
    return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
};

const renderPaginationNav = (
    pagination: NonNullable<Lume.Data["pagination"]>,
): string => {
    if (pagination.totalPages <= 1) {
        return "";
    }

    const pageLinks: string = Array.from(
        { length: pagination.totalPages },
        (_value: unknown, index: number): string => {
            const page: number = index + 1;
            const href: string = createPostsArchiveUrl(page);
            const isCurrent: boolean = page === pagination.page;

            return isCurrent
                ? `<strong><a class="<button>" aria-current="page" href="${href}">${page}</a></strong>`
                : `<a href="${href}">${page}</a>`;
        },
    ).join(" ");

    return `
<nav aria-label="Paginación del blog" class="blog-pagination">
    <p><strong>Página ${pagination.page}</strong> de ${pagination.totalPages}</p>
    <p>
        ${
        pagination.previous
            ? `<a href="${pagination.previous}">← Anterior</a>`
            : "<span>← Anterior</span>"
    }
        ${pageLinks}
        ${
        pagination.next
            ? `<a href="${pagination.next}">Siguiente →</a>`
            : "<span>Siguiente →</span>"
    }
    </p>
</nav>`;
};

const renderArchivePage = (
    posts: Data[],
    pagination: NonNullable<Lume.Data["pagination"]>,
): string => {
    const postItems: string = posts.map((post: Data, index: number): string => {
        const safeTitle: string = escapeHtml(String(post.title ?? post.url));
        const safeDescription: string = escapeHtml(String(
            post.description ||
                "Haz clic en el título para leer el artículo completo.",
        ));
        const safeUrl: string = String(post.url ?? "/posts/");
        const tags: string[] = Array.isArray(post.tags) ? post.tags : [];
        const tagLinks: string = tags.map((tag: string): string =>
            `<chip class="info"><a href="${createTagUrl(tag)}">${
                escapeHtml(tag)
            }</a></chip>`
        ).join("\n");

        return `
        <article
            class="crowded box"
            aria-labelledby="post-${index + 1}"
        >
            <h3 id="post-${index + 1}">
                <a href="${safeUrl}">
                    ${safeTitle}
                </a>
            </h3>
            ${
            post.date instanceof Date
                ? `<time datetime="${post.date.toISOString()}">Publicado el: ${
                    formatDate(post.date)
                }</time>`
                : ""
        }
            <div class="container margin">
                ${tagLinks}
            </div>
            <p class="bold">
                ${safeDescription}
            </p>
        </article>`;
    }).join("\n");

    return `
<main style="--line-length: 60rem">
    <h1>${title}</h1>
    <h2 id="feed-label">
        El blog actual contiene: ${pagination.totalResults} artículos disponibles
    </h2>
    <p>
        Mostrando la página ${pagination.page} de ${pagination.totalPages}.
    </p>
    
    <section role="feed" aria-labelledby="feed-label" aria-busy="false">
        ${postItems}
    </section>
    ${renderPaginationNav(pagination)}
</main>`;
};

export default function* (data: Lume.Data) {
    const posts: Data[] = data.search.pages("type=post", "date=desc");
    const pages: Lume.Data[] = data.paginate(posts, {
        size: POSTS_PER_PAGE,
        url: createPostsArchiveUrl,
    }) as Lume.Data[];

    for (const page of pages) {
        const pagination: PaginationInfo = page.pagination as NonNullable<
            Lume.Data["pagination"]
        >;
        yield {
            ...page,
            content: renderArchivePage(page.results as Data[], pagination),
            layout,
            pagefind: true,
            title: pagination.page === 1
                ? title
                : `${title} - Página ${pagination.page}`,
            type,
        };
    }
}
