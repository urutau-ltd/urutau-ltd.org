# Urutaú Limited Website

> v1.5.2 (First Light)

Here lies the source code of the _Urutaú Limited_ pseudo-organization. This
website acts just as a _"formal"_ presentation card and it's used for blogging
and nothing more interesting than that.

> [!IMPORTANT]
> Since v1.3.0
> [bullshit generators](https://www.gnu.org/philosophy/words-to-avoid.html#ArtificialIntelligence)
> have been dragged here and are used as tools inside this codebase.
>
> This is an adoption phase to see if there's a stomachable way to integrate
> these here. Refer to the [ROBOT.md](ROBOT.md) file to read the ruleset the
> robots should follow. The `AGENTS` file is a symlink to said file because I
> refuse to legitimize marketing hype, and I absolutely hate big-tech asshatery
> polluting the language.
>
> Also, there's a "skill" to make the robot less messy. It's based on
> [Ponytail](https://github.com/DietrichGebert/ponytail) and it's LARP(ed)
> enough to pretend it works "kinda fine".

## Features

- `missing.css` as minimalistic CSS library
- Almost [slow types](https://jsr.io/docs/about-slow-types) free
- **ZERO** tracking
- Licensed AGPL-3.0+ (where applicable) to ensure your freedom ;)
- Browser screenreader friendly
- Partial LibreJS compatibility through `/jslicense/`
  - Yes, you can read and audit and learn from most application logic! Enforce
    your rights!

## Usage

Run `make` to see targets and their documentation

```bash
=== [URUTAU LIMITED GNU MAKEFILE + PERL BUILD SYSTEM v1.5.2] ===

Usage:
  make [target] [variables]

Target(s):
  build                         Builds the productive lume Site
  ci                            Checks the code quality
  compose-down                  Take down the podman compose services
  compose-restart               Restart the podman compose services
  compose-up                    Bring up the podman compose services
  dev                           Starts a watch server for lume to show changes
  env                           Starts a development guix shell for this channel
  fmt                           Format the source code with deno fmt
  image                         Make a runtime podman image for this site
  lint                          Lint source code across the repository
  oci-run                       Test the built image locally by running it
  push-image                    Push OCI image to the container registry
  serve                         Serve the pre-built site using Lume's production server

Variable(s):
  MAKE_DIR                      The directory where the build system Makefiles are stored (default: build-system)
  USER_HOME                      (default: $${HOME})
  DENO_BIN_DIR                   (default: $(USER_HOME)/.deno/bin)
  TAG                            (default: sl.urutau-ltd.org/urutau-ltd/urutau-ltd:latest)

Example(s):
  make dev
  make fmt
```

There's also an experimental [maak](https://codeberg.org/jjba23/maak) port of
the same build automation; run `maak --list` to see the tasks. The Makefiles
remain authoritative.

## Usage with Guix

> [!IMPORTANT]
> GNU Guix has no official Deno package. Some hacks had to be done inside this
> repository to ensure integration with the development environment. While not
> ideal, it was the only way to use Deno without resorting to the nonfree
> channel.

This being said, take in mind that VSCode-based editors and JS/TS in general are
pretty dogshit-tier technologies on non FHS-systems.

Which is to be expected from everything touched by Microslop or Web Developers
in general.

1. You **must** have a `deno` installation on your home directory. Any other
   directory other than `$HOME/.deno/bin` won't work. See
   [this issue](https://github.com/denoland/deno/issues/2630) for more details.

Run commands with the provided Makefile + Perl build system:

1. Open a new Guix shell development environment

```shell
$ make env
```

> [!NOTE]
> The shell environment doesn't persist changes by default to build things in a
> docker --no-cache kind of way. If you wish to change this, make sure to add
> `--expose=$HOME/.cache/` to the `Makefile.dev` file inside the `build-system/`
> directory.

2. Now you can run other `make` targets for development:

```shell
fplinux@funguix make fmt
==> [LUME/FMT]: Formatting source code...
deno fmt
/home/fplinux/src/urutau-ltd.org/README.md
Checked 18 files
==> [LUME/FMT]: Finished formatting source code!
```

3. Open a development server

```shell
bash-5.2$ ~/src/urutau-ltd.org [env]$ make dev
==> [LUME/DEV]: Starting a dev loop for lume site...
Task serve deno task lume -s
Task lume deno run -P=lume lume/cli.ts "-s"
Warning Permissions in the config file is an experimental feature and may change in the future.
A new release of Deno is available: 2.5.4 → 2.5.5 Run `deno upgrade` to install it.
Loading config file file:///home/fplinux/src/urutau-ltd.org/_config.ts
6 pages found with SEO errors!
🔥 /fonts/sen-normal-400-800-latin-ext.woff2 <- (generated)
🔥 /fonts/sen-normal-400-800-latin.woff2 <- (generated)
🔥 /about/ <- /about/index.md
🔥 /404.html <- /404.md
🔥 /posts/hello-lume/ <- /posts/hello-lume.md
🔥 /posts/guix-appimages/ <- /posts/guix-appimages.md
🔥 / <- /index.page.tsx
🔥 /privacy-policy/ <- /privacy-policy/index.md
🔥 /recommends/ <- /recommends.md
🔥 /urutau.css <- /styles.css
🔥 /style.css <- (generated)
🔥 /sitemap.xml <- (generated)
🔥 /robots.txt <- (generated)
🔥 /posts.rss <- (generated)
🔥 /posts.json <- (generated)
🔥 /missing.css <- /missing.css
🔥 /manifest.json <- /public/manifest.json
🍾 Site built into ./output
  17 files generated in 0.29 seconds

  Server started at:
  http://localhost:3001/ (local)
  http://192.168.68.117:3001/ (network)
```

4. Same for building the site

```shell
bash-5.2$ make build
Task build deno task lume
Task lume deno run -P=lume lume/cli.ts
Warning Permissions in the config file is an experimental feature and may change in the future.
Loading config file file:///home/fplinux/src/urutau-ltd.org/_config.ts
6 pages found with SEO errors!
🔥 /fonts/sen-normal-400-800-latin-ext.woff2 <- (generated)
🔥 /fonts/sen-normal-400-800-latin.woff2 <- (generated)
🔥 /about/ <- /about/index.md
🔥 /404.html <- /404.md
🔥 /posts/hello-lume/ <- /posts/hello-lume.md
🔥 /posts/guix-appimages/ <- /posts/guix-appimages.md
🔥 / <- /index.page.tsx
🔥 /privacy-policy/ <- /privacy-policy/index.md
🔥 /recommends/ <- /recommends.md
🔥 /urutau.css <- /styles.css
🔥 /missing.css <- /missing.css
🔥 /style.css <- (generated)
🔥 /sitemap.xml <- (generated)
🔥 /robots.txt <- (generated)
🔥 /posts.rss <- (generated)
🔥 /posts.json <- (generated)
🔥 /manifest.json <- /public/manifest.json
🍾 Site built into ./output
  17 files generated in 8.03 seconds
```

### The `nyc` utility

This repository comes with a Perl script called `nyc`. It's only available
inside the `guix shell` environment because it's package declaration lives
inside the `manifest.scm` file. It's inspired by the `hugo` cli but it does a
much simpler jobset, it's meant to be used in this repository **only** so, if
you need features make use of your freedoms 1 and 3.

Inside the guix shell environment you can consult the usage of this tool by
running `nyc --help`.

One useful command lately is `nyc doctor`. It checks front matter, taxonomy URL
collisions, weird OG metadata mistakes and obvious public email leaks before
they waste your time. `make ci` runs it too.

## Building on Podman

Run `make image` to build the runtime Podman image.

Run `make oci-run` to run it locally on port 8000.

## The `genmail.pl` script

For the `contact.md` page you can generate an encoded email to prevent basic
bots and crawlers from extracting your address for spam. The Perl rewrite still
uses a reversible challenge, but it now ships a complete CLI so you can encode,
decode, or verify challenge strings without touching additional tools.

You can feed it through the `GENMAIL_TARGET` environment variable or pass
`--email` explicitly:

```bash
GENMAIL_TARGET=greenscreenmother@email.com ./genmail.pl
./genmail.pl --email greenscreenmother@email.com
```

When auditing existing entries the new options come in handy:

```bash
./genmail.pl --decode --challenge 'u2.17.part1.part2.part3.part4'
./genmail.pl --verify-challenge --challenge 'u2.17.part1.part2.part3.part4' --email greenscreenmother@email.com
```

For people and tools that care about policy files, the site also ships
`/.well-known/security.txt`, `/llms.txt` and `/jslicense/`.

## Browser debugging

`scripts/launch-flatpak.scm` launches the ungoogled-chromium flatpak with the
Chrome DevTools Protocol endpoint on port 9222 so the `chrome-devtools` MCP
server configured in `opencode.jsonc` can attach. It skips the launch when an
endpoint is already listening, and removes the throwaway profile
(`/tmp/urutau-debug`) once chromium exits.

## Deploy

It's a static site, go figure xD

## Stance on LLM contributions

While we do use LLM's this project is actively unwelcoming to any LLM
contributions whatsoever. This stance exists because a tool marketed as
reasoning or building trust costs maintainers real money and real time with
sometimes no recourse. This exclusion is the recourse.
