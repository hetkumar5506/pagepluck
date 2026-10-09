# Changelog

All notable changes to PagePluck are documented here. This project follows [Semantic Versioning](https://semver.org/).

---

## 0.2.1 — 2026-10-09

### Added

- **Double-click to copy** on every image and SVG card preview. Assets are written to the clipboard in two formats at once: `image/png` for apps that paste pictures (Figma, Slack, Docs) and `text/plain` for editors (raw image URL, raw SVG markup).
- **Copy button** on every image and SVG card, so the copy action is discoverable and reachable by keyboard, not just by double-click.
- **Click-to-copy font names** in the Fonts tab — a single click on a font card copies its family name.
- **Light / dark theme toggle** in the top bar, beside Rescan. Dark remains the default; light is built on pure white (`#ffffff`) with its own surface, border, and text tokens.
- **Theme persistence** — the only value PagePluck stores, under `pagepluck:theme` in `localStorage`. It is applied before React mounts so light never flashes dark.
- **Theme-independent preview checkerboard** — asset previews always sit on a light checkerboard, so dark logos and black icons stay visible in dark mode.
- Empty state for the SVGs tab.

### Changed

- Asset card footers are now a `Copy` + `Save` pair instead of a lone `Save` button.
- Theming moved from `@media (prefers-color-scheme)` to an explicit `data-theme` attribute on `<html>`, so the OS setting no longer overrides your choice.
- Added the `clipboardWrite` permission to the manifest.

### Fixed

- Selection checkboxes now carry an accessible name (`Select <asset name>`) instead of being announced as an unlabelled checkbox.

---

## 0.2.0 — 2026-09-30

First audited release. See [`AUDIT.md`](AUDIT.md) for the full report.

### Added

- Individual selection, select-all, selected download, and complete-page download.
- Batch downloads into `Downloads/<PageName>_assets/` using Chrome's `uniquify` conflict policy.
- CSS sprite sheet recognition: repeated background URLs are exposed as individually cropped PNGs.
- `<video poster>` discovery and extraction of every URL in a computed `background-image`.
- Bounded DOM scan raised from 5,000 to 8,000 elements.
- Responsive monochrome interface with system light/dark adaptation, Reicon icons, focus styles, semantic labels, loading and error states, and reduced-motion handling.
- Playwright E2E suite covering all four routes plus a live HTTPS scan.

### Fixed

- Malformed side-panel HTML that allowed JavaScript to load while Chrome ignored the stylesheet.

---

## 0.1.0

Initial extraction prototype: scan a page, list images, SVGs, colors, and fonts in the Chrome side panel.
