# CHANGELOG

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
