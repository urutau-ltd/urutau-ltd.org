import Site from "lume/core/site.ts";
import base_path from "lume/plugins/base_path.ts";
import codeHighlight from "lume/plugins/code_highlight.ts";
import feed from "lume/plugins/feed.ts";
import googleFonts from "lume/plugins/google_fonts.ts";
import jsx from "lume/plugins/jsx.ts";
import lume from "lume/mod.ts";
import metas from "lume/plugins/metas.ts";
import ogImages from "lume/plugins/og_images.ts";
import pageFind from "lume/plugins/pagefind.ts";
import postcss from "lume/plugins/postcss.ts";
import redirects from "lume/plugins/redirects.ts";
import robots from "lume/plugins/robots.ts";
import seo from "lume/plugins/seo.ts";
import sitemap from "lume/plugins/sitemap.ts";
import slugifyUrls from "lume/plugins/slugify_urls.ts";

// Additional highlight.JS languages
import lang_awk from "highlight.js/lib/languages/awk";
import lang_bash from "highlight.js/lib/languages/bash";
import lang_c from "highlight.js/lib/languages/c";
import lang_cpp from "highlight.js/lib/languages/cpp";
import lang_css from "highlight.js/lib/languages/css";
import lang_diff from "highlight.js/lib/languages/diff";
import lang_dockerfile from "highlight.js/lib/languages/dockerfile";
import lang_go from "highlight.js/lib/languages/go";
import lang_http from "highlight.js/lib/languages/http";
import lang_ini from "highlight.js/lib/languages/ini";
import lang_javascript from "highlight.js/lib/languages/javascript";
import lang_json from "highlight.js/lib/languages/json";
import lang_lisp from "highlight.js/lib/languages/lisp";
import lang_makefile from "highlight.js/lib/languages/makefile";
import lang_markdown from "highlight.js/lib/languages/markdown";
import lang_nginx from "highlight.js/lib/languages/nginx";
import lang_nix from "highlight.js/lib/languages/nix";
import lang_perl from "highlight.js/lib/languages/perl";
import lang_rust from "highlight.js/lib/languages/rust";
import lang_scheme from "highlight.js/lib/languages/scheme";
import lang_shell from "highlight.js/lib/languages/shell";
import lang_sql from "highlight.js/lib/languages/sql";
import lang_typescript from "highlight.js/lib/languages/typescript";
import lang_xml from "highlight.js/lib/languages/xml";
import lang_yaml from "highlight.js/lib/languages/yaml";

import { ErrorMessage } from "lume/plugins/seo/mod.ts";

const site: Site = lume({
    location: new URL("https://urutau-ltd.org"),
    src: "./src",
    dest: "./output",
    watcher: {
        "ignore": [
            "/.git",
        ],
    },
});

/* Enable JSX/TSX Support */
site.use(jsx());

site.use(pageFind({
    ui: {
        resetStyles: false,
    },
}));

site.ignore(
    "README.md",
);

site.use(redirects());

site.use(googleFonts({
    fonts:
        "https://fonts.googleapis.com/css2?family=Sen:wght@400..800&display=swap",
    cssFile: "/urutau.css",
}));

site.use(metas());
site.use(ogImages());

site.use(postcss());
site.add("npm:missing.css@1.2.0", "missing.css");

/* Normalize resources base paths */
site.use(base_path());

/* Highlight.js Syntax highlighter */
site.use(codeHighlight({
    languages: {
        atom: lang_xml,
        awk: lang_awk,
        bash: lang_bash,
        c: lang_c,
        cc: lang_cpp,
        console: lang_shell,
        containerfile: lang_dockerfile,
        cpp: lang_cpp,
        css: lang_css,
        cts: lang_typescript,
        cxx: lang_cpp,
        diff: lang_diff,
        docker: lang_dockerfile,
        dockerfile: lang_dockerfile,
        gawk: lang_awk,
        go: lang_go,
        h: lang_c,
        hh: lang_cpp,
        hpp: lang_cpp,
        html: lang_xml,
        http: lang_http,
        https: lang_http,
        hxx: lang_cpp,
        javascript: lang_javascript,
        js: lang_javascript,
        json5: lang_json,
        json: lang_json,
        jsonc: lang_json,
        lisp: lang_lisp,
        mak: lang_makefile,
        make: lang_makefile,
        makefile: lang_makefile,
        markdown: lang_markdown,
        mawk: lang_awk,
        md: lang_markdown,
        mk: lang_makefile,
        mkd: lang_markdown,
        mkdown: lang_markdown,
        mts: lang_typescript,
        nawk: lang_awk,
        nginx: lang_nginx,
        nix: lang_nix,
        patch: lang_diff,
        perl: lang_perl,
        pl: lang_perl,
        pm: lang_perl,
        podman: lang_dockerfile,
        rs: lang_rust,
        rss: lang_xml,
        rust: lang_rust,
        scheme: lang_scheme,
        scm: lang_scheme,
        sh: lang_bash,
        shell: lang_shell,
        sql: lang_sql,
        svg: lang_xml,
        toml: lang_ini,
        ts: lang_typescript,
        tsx: lang_typescript,
        typescript: lang_typescript,
        xhtml: lang_xml,
        xml: lang_xml,
        yml: lang_yaml,
        zsh: lang_bash,
    },
    theme: [{
        name: "atom-one-dark",
        cssFile: "/urutau.css",
        placeholder: "/* dark */",
    }, {
        name: "atom-one-light",
        cssFile: "/urutau.css",
        placeholder: "/* light */",
    }],
}));

site.add("styles.css", "urutau.css");
site.add("public/img/", "img/");
site.add("public/manifest.json", "manifest.json");

site.use(sitemap());

/* Slug-ify resources */
site.use(slugifyUrls({
    extensions: "*",
    replace: {
        "Á": "A",
        "É": "E",
        "Í": "I",
        "Ó": "O",
        "Ú": "U",
        "á": "a",
        "é": "e",
        "í": "i",
        "ó": "o",
        "ú": "u",
    },
}));

/* Generate the site's RSS feed */
site.use(feed({
    output: ["/posts.rss", "/posts.json"],
    query: "type=post",
    info: {
        title: "=site.title",
        description: "=site.description",
        lang: "es",
        authorName: "FuncProgLinux",
    },
    items: {
        title: "=title",
        description: "=excerpt",
    },
}));

site.use(robots({
    disallow: "*",
}));

site.use(seo({
    output: (reports: Map<string, ErrorMessage[]>): void => {
        if (!reports.size) {
            console.info("No SEO errors found!");
        } else {
            console.error(
                `${reports.size} pages found with SEO errors!`,
            );
        }
    },
}));

export default site;
