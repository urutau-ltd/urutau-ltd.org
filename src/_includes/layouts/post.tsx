import HeadIncludes from "$urutau/components/html_includes.tsx";
import PostNavbar from "$urutau/components/posts/PostNav.tsx";
import PostBody from "$urutau/components/posts/PostBody.tsx";
import SiteFooter from "$urutau/components/siteFooter.tsx";

export default (
    { title, children, lang, description, author, tags, date }: Lume.Data,
    _helpers: Lume.Helpers,
) => (
    <>
        {{ __html: "<!DOCTYPE html>" }}
        <html lang={lang}>
            <HeadIncludes title={title} />
            <body>
                <PostNavbar />
                <PostBody
                    title={title}
                    description={description}
                    author={author}
                    tags={tags}
                    date={date}
                >
                    {children}
                </PostBody>
                <SiteFooter />
            </body>
        </html>
    </>
);
