import { Data } from "lume/core/file.ts";
import { PostTags } from "$urutau/components/shared/PostTags.tsx";
import { PostAuthor } from "$urutau/components/shared/PostAuthor.tsx";

export const title: string = "¡Bienvenid@!";
export const layout: string = "layout.tsx";

export default (data: Lume.Data, _helpers: Lume.Helpers): JSX.Component => {
    const posts: Data[] = data.search.pages("type=post", "date=desc", 3);

    const truncate = (input: string, limit: number): string => {
        if (input.length <= limit) {
            return input;
        }
        return input.slice(0, limit - 1) + "…";
    };

    return (
        <>
            <h1>{data.title}</h1>
            <p>
                Este sitio web es un espacio personal donde recopilaré diversos
                tipos de información, externa y propia.
            </p>
            <p>
                Consulta las últimas publicaciones del blog aquí. Puedes usar la
                barra de navegación lateral para consultar otros lugares en el
                sitio web.
                <br />
                <br />
                ¡Gracias por tu visita!
            </p>
            <div class="container margin">
                <div id="search">
                </div>
            </div>
            <section>
                <div class="flex-row flex-wrap:wrap">
                    {posts.map((post: Data, _index: number): JSX.Component => (
                        <article class="box flex-grow:2">
                            <h2>{post.title}</h2>
                            <h3>{post.description}</h3>
                            <hr />
                            <div class="margin-block">
                                Autor:&nbsp;
                                <PostAuthor author={post.author} />
                            </div>

                            <div class="margin-block">
                                <PostTags tags={post.tags} />
                            </div>
                            <p>
                                {truncate(post.content as string, 300)}
                            </p>
                            <a href={post.url}>
                                Leer más...
                            </a>
                        </article>
                    ))}
                </div>
            </section>
        </>
    );
};
