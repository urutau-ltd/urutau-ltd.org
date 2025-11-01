# Urutaú Limited Website

Here lies the source code of the _Urutaú Limited_ pseudo-organization. This
website acts just as a _"formal"_ presentation card and it's used for blogging
and nothing more interesting than that.

## Features

- `missing.css` as minimalistic CSS library
- Almost [slow types](https://jsr.io/docs/about-slow-types) free.
- **ZERO** tracking
- Licensed AGPL-3.0+ (where applicable) to ensure your freedom ;)

## Usage

Run `make` to see targets and their documentation

```bash
=== [URUTAU LIMITED GNU MAKEFILE + PERL BUILD SYSTEM v1.1.0] ===

Usage:
  make [target] [variables]

Target(s):
  build                         Builds the productive lume Site
  ci                            Checks the code quality
  dev                           Starts a watch server for lume to show changes
  env                           Starts a development guix shell for this channel
  fmt                           Format the Guile Scheme source code of this repostory
  image                         Make a builder podman image for this site
  lint                          Lint source code across the repository
  oci-build                     Builds the site using the image
  push-image                    Push OCI image to the container registry

Variable(s):
  MAKE_DIR                      The directory where the build system Makefiles are stored (default: build-system)
  USER_HOME                      (default: $${HOME})
  DENO_BIN_DIR                   (default: $(USER_HOME)/.deno/bin)
  TAG                            (default: sl.urutau-ltd.org/urutau-ltd/builder:latest)

Example(s):
  make dev
  make fmt
```

## Usage with Guix

> [!IMPORTANT]
> GNU Guix has no official Deno package. Some hacks had to be done inside this
> repository to ensure integration with the development environment. While not
> ideal, it was the only way to use Deno without resorting to the nonfree
> channel.

1. You **must** have a `deno` installation on your home directory. Any other
   directory other than `$HOME/.deno/bin` won't work. See
   [this issue](https://github.com/denoland/deno/issues/2630) for more details.

Run commands with the provided Makefile + Perl build system:

1. Open a new Guix shell development environment

```shell
$ make dev
```

> [!NOTE]
> The shell environment doesn't persist changes by default to build things in a
> docker --no-cache kind of way. If you wish to change this, make sure to add
> `--expose=${{HOME}}/.cache/` to the `Makefile.dev` file inside the
> `build-system/` directory.

2. Now you can run other `make` targets for development:

```shell
fplinux@funguix make fmt
==> [LUME/FMT]: Formatting Scheme source code...
perl ./build-system/pfmt.pl
Searching and formatting Guix scheme code...
Found 1 to format!
Progress: 1 of 1 formatted files. [#############################################                                                                                                    
Finished formatting Guix Scheme files!
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

## Building on Podman

Run `make image` to build a Podman `builder` image.

Run `make oci-build` to build the lume site using the generated builder image.

## The `genmail.sh` script

For the `contact.md` page you can generate an encoded Email to prevent basic
bots and crawlers from extracting your address for spam. It won't stop humans
who understand some `GNU Bash` though. But forcing them to read code or think
the contact challenge for themselves could discourage some individuals, at least
the lazy/mediocre ones I'd like to think...

To use the script you must invoke it with the e-mail variable you wish to
encode:

```bash
GENMAIL_TARGET=greenscreenmother@email.com ./genmail.sh
```

## Deploy

It's a static site. Go figure xD
