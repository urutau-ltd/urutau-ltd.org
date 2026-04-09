import HeadIncludes from "$urutau/components/html_includes.tsx";

interface Props {
    children?: JSX.Children;
    lang: string | undefined;
    pagefind?: boolean | undefined;
    title: string | undefined;
}

const HtmlDocument = (
    { title, lang, children, pagefind }: Props,
): JSX.Component => {
    return (
        <>
            {{ __html: "<!DOCTYPE html>" }}
            <html lang={lang}>
                <HeadIncludes title={title} pagefind={pagefind} />
                <body>
                    {children}
                </body>
            </html>
        </>
    );
};

export default HtmlDocument;
