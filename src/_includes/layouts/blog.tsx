import HtmlDocument from "$urutau/components/HtmlDocument.tsx";
import PostNavbar from "$urutau/components/posts/PostNav.tsx";
import SiteFooter from "$urutau/components/siteFooter.tsx";

export default (
    { title, children, lang }: Lume.Data,
    _helpers: Lume.Helpers,
) => (
    <HtmlDocument title={title} lang={lang} pagefind={true}>
        <PostNavbar />
        <div class="container margin:auto">
            <div id="search"></div>
        </div>
        {children}
        <SiteFooter />
    </HtmlDocument>
);
