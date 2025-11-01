import HeadIncludes from "$urutau/components/html_includes.tsx";
import PostNavbar from "$urutau/components/posts/PostNav.tsx";
import SiteFooter from "$urutau/components/siteFooter.tsx";

export default (
    { title, children, lang }: Lume.Data,
    _helpers: Lume.Helpers,
) => (
    <>
        {{ __html: "<!DOCTYPE html>" }}
        <html lang={lang}>
            <HeadIncludes title={title} />
            <body>
                <PostNavbar />
                <div class="container margin:auto">
                    <div id="search"></div>
                </div>
                {children}
                <SiteFooter />
            </body>
        </html>
    </>
);
