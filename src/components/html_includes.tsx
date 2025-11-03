interface Props {
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
                content="width=device-width, initial-scale=1"
            />
            {/* CSS Files */}
            <link rel="stylesheet" href="/missing.css" />
            <link rel="stylesheet" href="/urutau.css" />
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
            <link rel="manifest" href="manifest.json" />
            <script
                dangerouslySetInnerHTML={{
                    __html: `
            (() => {
                if ('serviceWorker' in navigator) {
                    globalThis.addEventListener("load", () => {
                        navigator.serviceWorker.register("/sw.js", {
                            type: "module",
                            scope: "/",
                        })
                        .then(
                            (reg) =>
                                console.info(
                                    \`SW: Registered correctly as a module!\`,
                                ),
                        )
                        .catch(
                            (err) =>
                                console.error(
                                    \`SW: Failed to register service worker: \${err}\`,
                                ),
                        );
                    });
                }
            })();
        `,
                }}
            />
        </head>
    );
};

export default HeadIncludes;
