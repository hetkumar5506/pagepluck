# PagePluck 0.2.0 audit

Date: 2026-09-30

## Result

**Approved for unpacked-extension testing.** TypeScript, production build, real-Chromium E2E routes, responsive styling assertion, selection behavior, live-site scan, and runtime dependency audit pass.

## Findings fixed

### Correctness

- Fixed malformed side-panel HTML that allowed JavaScript to load while Chrome ignored the stylesheet.
- Added individual selection, select-all, selected download, and complete-page download.
- Batch downloads use `Downloads/<PageName>_assets/` and Chrome's `uniquify` conflict policy.
- Recognized repeated CSS background URLs as sprite sheets and exposed each DOM usage as an individually cropped PNG.
- Added `<video poster>` discovery and extraction of every URL in a computed `background-image` value.
- Increased the bounded DOM scan from 5,000 to 8,000 elements.

### UI and accessibility

- Rebuilt the panel as a responsive monochrome interface with system light/dark adaptation.
- Added Reicon icons through direct imports so unused icons are excluded.
- Added visible focus styles, semantic labels, loading/error states, and reduced-motion handling.
- Added a 280 px compact layout, a single-column layout below 340 px, and a three-column asset grid above 520 px.
- Replaced the original yellow logo with a high-contrast black-and-white extraction mark.

### Asset accuracy

- Images: current `<img>` source, video posters, all computed background-image URLs, dimensions, type, filename, and repeated-sprite crops.
- Colors: text, background, four borders, SVG fill, and SVG stroke; displays normalized hex plus original computed value and usage count.
- Fonts: primary computed family, usage count, preview, and same-origin `@font-face` source when readable.
- SVG: serialized markup, accessible/id-based names, and rendered dimensions.

### Security and privacy

- No authentication, database, analytics, telemetry, cookies, or browser-storage persistence.
- Raw SVG markup is never mounted with `innerHTML`; previews use image-document data URLs.
- Cross-origin stylesheet access is attempted only for font metadata and safely skipped when blocked.
- Runtime dependency audit reports zero known vulnerabilities.

## Automated checks

```text
TypeScript strict check       PASS
Production Manifest V3 build  PASS
Stylesheet runtime assertion  PASS
Image multi-select            PASS
Images route                  PASS
SVG route                     PASS
Colors route                  PASS
Fonts route                   PASS
Live HTTPS scan               PASS (example.com)
npm runtime audit             PASS (0 vulnerabilities)
```

## Known boundaries

- CSS sprite cropping currently supports pixel background positions at the source image's natural scale. Sprites using percentage positions or scaled `background-size` may need a future scale-aware crop calculation.
- Cross-origin iframe contents and closed shadow roots remain inaccessible.
- Chrome-protected pages and the Chrome Web Store cannot be scanned.
- If Chrome's “Ask where to save each file” preference is enabled, Chrome may prompt during batch export; this is browser-controlled.
- The extension identifies fonts but does not bypass font licensing or access controls.
