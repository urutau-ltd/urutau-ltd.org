const SiteFooter = (): JSX.Component => {
    return (
        <footer>
            <p>
                <small>
                    © {new Date().getFullYear()}{" "}
                    Urutaú Limited. (Casi) todos los derechos reservados.
                    <chip>v1.1.2-first-light</chip>
                </small>
            </p>
            <p>
                Suscribirse via: (
                <a href="/posts.rss">
                    RSS 🔔
                </a>
                /
                <a href="/posts.json">
                    JSON 📣
                </a>
                )
            </p>
            <p>
                Excepto donde se indique lo contrario, el trabajo escrito,
                publicaciones, opiniones y parte del contenio visual se
                encuentran bajo la licencia &nbsp;
                <a
                    href="https://creativecommons.org/licenses/by-nd/4.0/deed.es"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Creative Commons Atribución/Reconocimiento-SinDerivados 4.0
                    Internacional (CC-BY-ND 4.0)
                </a>
                .
                <br />
                <br />
                El código fuente de este sitio web se encuentra bajo la licencia
                &nbsp;{" "}
                <a
                    href="https://spdx.org/licenses/AGPL-3.0-or-later.html"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    GNU Affero General Public License v3.0
                </a>
                &nbsp; o a tu elección, cualquier versión posterior de la misma
                licencia.
            </p>
            <p>
                Hecho con 💜 en{" "}
                <a
                    href="https://gnu.org/software/emacs"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    GNU Emacs
                </a>,
                <a
                    href="https://guix.gnu.org"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    GNU Guix
                </a>,{" "}
                <a
                    href="https://lume.land"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Lume
                </a>{" "}
                y{" "}
                <a
                    href="https://missing.style"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    missing.css
                </a>.
                <br />
                Este sitio se creó sin utilizar IA (LLMs).
            </p>
        </footer>
    );
};

export default SiteFooter;
