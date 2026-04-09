import HtmlDocument from "$urutau/components/HtmlDocument.tsx";
import SiteFooter from "$urutau/components/siteFooter.tsx";
import SiteNavbar from "$urutau/components/siteNavbar.tsx";

export default (
    { title, children, lang, pagefind, url }: Lume.Data,
    _helpers: Lume.Helpers,
) => {
    return (
        <HtmlDocument title={title} lang={lang} pagefind={pagefind}>
            <div class="sidebar-layout">
                <SiteNavbar url={url} />
                <div>
                    <main>
                        {children}
                    </main>
                    <SiteFooter />
                </div>
            </div>
        </HtmlDocument>
    );
};
