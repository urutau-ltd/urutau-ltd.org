import HeadIncludes from "$urutau/components/html_includes.tsx";
import SiteFooter from "$urutau/components/siteFooter.tsx";
import SiteNavbar from "$urutau/components/siteNavbar.tsx";

export default (
    { title, children, lang, url }: Lume.Data,
    _helpers: Lume.Helpers,
) => {
    return (
        <>
            {{ __html: "<!DOCTYPE html>" }}
            <html lang={lang}>
                <HeadIncludes title={title} />
                <body>
                    <div class="sidebar-layout">
                        <SiteNavbar url={url} />
                        <div>
                            <main>
                                {children}
                            </main>
                            <SiteFooter />
                        </div>
                    </div>
                </body>
            </html>
        </>
    );
};
