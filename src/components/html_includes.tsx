interface Props {
    pagefind?: boolean | undefined;
    title: string | undefined;
}

const HeadIncludes = ({ title }: Props): JSX.Component => {
    if (typeof title === "undefined") {
        title = "Got 'undefined' title on this component.";
    }

    return (
        <head>
            <title>{title}</title>
            <meta charset="UTF-8" />
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1, shrink-to-fit=no"
            />
            <meta name="referrer" content="no-referrer" />
            {/* CSS Files */}
            <link rel="stylesheet" href="/missing.css" />
            <link rel="stylesheet" href="/urutau.css" />
            <link rel="jslicense" href="/jslicense/" />
            <link rel="manifest" href="/manifest.json" />
            {/* MetaTags */}
            <meta name="title" content={title} />
            <meta name="robots" content="index, follow" />
            <meta name="language" content="Spanish" />
            <meta name="revisit-after" content="7 days" />
            <meta name="author" content="FuncProgLinux" />
            {/* PWA Attributes */}
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="theme-color" content="#A5D8FF" />
            <meta name="application-name" content="Urutaú Limited" />
            <meta name="apple-mobile-web-app-title" content="Urutaú Limited" />
            <meta
                name="apple-mobile-web-app-status-bar-style"
                content="blue"
            />
            <script defer src="/js/register-sw.js"></script>
            <script defer src="/js/contact-reveal.js"></script>
        </head>
    );
};

export default HeadIncludes;
