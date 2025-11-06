import { PostMeta } from "$urutau/types";

const type: string = "post";
const layout: string = "layouts/post.tsx";
const openGraphLayout: string = "layouts/og.tsx";

const metas: Readonly<PostMeta> = {
    title: "=title || $h1 || Título por Defecto",
    description: "=description || Default Description",
    image: `=image || /posts/index.png`,
    lang: "es",
    site: "Urutaú Limited",
};

export { layout, metas, openGraphLayout, type };
