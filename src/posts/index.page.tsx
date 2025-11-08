import { Data } from "lume/core/file.ts";
import { PostTags } from "$urutau/components/shared/PostTags.tsx";

export const title: string = "Archivo de publicación";
export const type: string = "page";
export const layout: string = "layouts/blog.tsx";

export default (data: Lume.Data): JSX.Component => {
    const posts: Data[] = data.search.pages("type=post", "date=desc");

    return (
        <main>
            <h1>{title}</h1>
            <h2>
                El blog actual contiene: {posts.length} artículos disponibles
            </h2>
            <figure>
                {posts.map((post: Data, index: number): JSX.Component => (
                    <article key={post.url}>
                        <section
                            role="feed"
                            aria-aria-labelledby="feed-label"
                            aria-busy="false"
                        >
                            <article
                                class="crowded box"
                                aria-aria-labelledby={`post-${index + 1}`}
                                tabindex="0"
                                aria-setsize={posts.length}
                            >
                                <h4>
                                    <a href={post.url}>
                                        {post.title}
                                    </a>
                                </h4>
                                {post.date && (
                                    <time datetime={post.date.toISOString()}>
                                        Publicado el:{" "}
                                        {post.date.toLocaleDateString("es-ES", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </time>
                                )}
                                <div class="container margin">
                                    <PostTags tags={post.tags} />
                                </div>
                                <p class="bold">
                                    {post.description ||
                                        "Haz clic en el título para leer el artículo completo."}
                                </p>
                            </article>
                        </section>
                    </article>
                ))}
            </figure>

            <nav>
            </nav>
        </main>
    );
};
