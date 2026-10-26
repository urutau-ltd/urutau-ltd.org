# CHANGELOG

## v1.5.2-first-light

- Expand the wiki with documentation for Aile, Bellbird, Vexilo, forge-cli and
  vite-plugin-librejs
- Add verification, diagnostic and workflow pages that go beyond the project
  READMEs
- Improve the wiki index with project descriptions and accurate page counts
- Move Gavia to the discontinued archive and add forge-cli and
  vite-plugin-librejs to the software catalog
- Remove the Nyctibius wiki page and update its software entry
- Bump the service worker cache version to invalidate the old application shell

## v1.5.1-first-light

- Add `scripts/launch-flatpak.scm` to launch the ungoogled-chromium flatpak with
  the Chrome DevTools Protocol debug port for the `chrome-devtools` MCP server
- Add experimental maak support porting the Makefile targets to `maak.scm`
- Add a `maak` package (v0.8.3) to the Guix manifest
- Fill the missing Guix development shell tools: `findutils`, `grep`, `sed`,
  `gawk`, `diffutils`, `perl-readonly`, `flatpak` and `nix`
- Replace the deprecated `perltidy` with `perl-tidy`
- Complete the service worker shell precache and skip the first-install reload
- Fix the Docker image build and align the version label with v1.5.1
- Fix `make fmt` calling the removed `pfmt.pl`
- Emit `/.well-known/` at the correct path by limiting `slugifyUrls` to HTML
- Drop the broken Windows PWA icon entries from the manifest
- Add the missing.css scripts to the LibreJS table
- Move the unpublished essay to `drafts/`
- Fix the OpenCode article and review commands
- Update to Lume 3.3.3, bump the Deno image to 2.9.8, `markdown-it-anchor` to 10
  and the TOC plugin to 1.0.8

## v1.5.0-first-light

- Improve built in MCP server security/quality of life
- Add a better monospaced font for code examples
- Integrate Missing.CSS JavaScript tools for ARIA patterns
- Update to Lume 3.3.1
  - Replace `markdown-it-toc-done-right` for my revived plugin
    `markdown-it-toc-revived` to match the new Lume types.
- Add Reading information to articles via `readingInfo` Lume Plugin
- Use correct practices for `llms.txt` file

## v1.4.0-first-light

- Replace some logic with brand new Lume plugins
- Add a provisional server for Docker migration
- Improve deno @std/ support
- Fix a bug on the `debt_harverster` script where a leading `.` would be a
  mistaken incorporation into the RegExp for `SKIPPED_DIRS` map.
- Add a theme switcher
- Improved legibility and styles
- Improved ARIA patterns

## v1.3.1-first-light

- Improve bs generator support via OpenCode
- Upgrade to Lume v3.3.0
- Fixed type declarations and updated dependencies

## v1.3.0-first-light

- Moved the software page into its own folder to prepare the site for wiki-style
  growth
- Added a dedicated wiki section with project indexes for site search
- Added a dedicated wiki layout with project navigation, breadcrumbs and search
- Documentation version bump
- Took ages to do
- Testing robot adoption
- Migrated to _"Lora"_ font for better reading experience

## v1.2.1-first-light

- Fixed public website email bugs
- Improved PWA service worker for a better offline experience
- Improved `llm.txt`
- Add more software and recommends

## v1.2.0-first-light

- Deterministic OG images
- Better contact obfuscation for the public website email
- Add `security.txt`, `/.well-known/security.txt`, `llm.txt` and `/jslicense/`
- Externalize site scripts and improve partial LibreJS compatibility
- Service worker caching cleaned up a bit
- Removed the recursive OG patcher build noise by fixing the source path instead

### Internal tools

- `nyc doctor` now catches metadata mistakes, taxonomy collisions and obvious
  public email leaks
- `nyc add` now writes the correct OG image path for new posts
- Tag/author generation shares one deduplicated taxonomy pipeline

## v1.1.2-first-light

- Fix 404 on 404 error page (yes, as absurd as it sounds)
- Add OG Images for non blog posts

## v1.1.1-first-light

- Add a table of contents for posts
- Documentation improvements
- Look and spacing removed (had to delete `class="airy"`)
- Added RSS/JSON subscription links
- Fixed OG images in some entries

### Internal tools

- `nyc` tool is now `v2.0.0`
- `genmail.sh` is now `genmail.pl` at `v1.0.0`

## v1.1.0-first-light

- Assets improved
- OpenGraph images + patcher script
- PWA Capabilities
- `nyc` CLI bug fixes
- Improved error 404 look
- Internal library + unit testing
- JSX Components for easier building/reading
- Autogenerators for `tags` and `author` posts

## v1.0.0-first-light

- Stable site deployed
