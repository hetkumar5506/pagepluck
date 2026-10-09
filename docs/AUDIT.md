# PagePluck code-quality audit — 0.2.1

Date: 2026-10-09
Scope: full source review (`entrypoints/`, `lib/`, `tests/`, `wxt.config.ts`, build output) plus the 0.2.1 feature work.
Method: `ponytail` (lazy senior-dev review), `code-review-and-quality` (five-axis review), `frontend-ui-engineering`, and `web-design-guidelines`.

## Verdict

**Approved.** The codebase is small, strict, readable, and honest about its limits. There is no dead abstraction layer, no speculative configuration, and no runtime dependency doing a five-line job. 485 lines of source total.

| Axis | Grade | Summary |
| --- | --- | --- |
| Correctness | **B+** | Extraction logic is sound and defensive. Batch downloads can fail silently. |
| Readability & simplicity | **A-** | Dense but idiomatic. One 187-line component is the only structural smell. |
| Architecture | **A-** | Clean three-layer split (content script → message → panel). No leaks between layers. |
| Security & privacy | **A** | Least privilege, no egress, no `innerHTML`, cross-origin access wrapped. |
| Performance | **B** | Bounded scan, but 8,000 live `CSSStyleDeclaration` objects are held at once. |
| Accessibility | **A-** | Labels, roles, focus rings, reduced motion. Two gaps recorded below. |
| Test coverage | **B+** | Real Chromium E2E over all four routes; no unit layer, live-site test needs internet. |

---

## What the code does well

- **Zero speculative machinery.** No state library, no router, no i18n, no settings schema. The panel is one component with eight `useState` hooks, and that is genuinely enough.
- **Honest boundaries.** `content.ts` caps traversal at `MAX_ELEMENTS = 8_000`, skips cross-origin stylesheets with a comment explaining *why*, and the docs list what PagePluck cannot do.
- **Safe SVG handling.** Markup is serialized and previewed through a `data:image/svg+xml` image document — never `innerHTML` — so a hostile page cannot execute script in the panel.
- **Strict types.** `strict` + `noUncheckedIndexedAccess`; `tsc --noEmit` is clean. `lib/types.ts` is the single contract between the content script and the panel.
- **Real browser tests.** The Playwright suite loads the *built* extension in Chromium, drives the actual side panel, and asserts on extracted counts — not on mocks.
- **Least-privilege manifest.** Four permissions, each with a documented reason.

---

## Findings

Severity: **S1** fix now · **S2** fix soon · **S3** backlog · **OK** verified good.

### S1 — Batch downloads fail silently (correctness)

`downloadAll` / `downloadSelected` `await` each `chrome.downloads.download` in a `for` loop with no `try`/`catch`. If any single asset rejects — a sprite whose `fetch` is blocked, an `OffscreenCanvas` that cannot decode the bitmap — the loop throws, the rejection escapes the `onClick` handler, and the user gets **no toast and no error state**. The panel looks busy forever.

```ts
// entrypoints/sidepanel/App.tsx
for (const asset of assets) await (tab === 'images' ? saveImage(asset as ImageAsset) : saveSvg(asset as SvgAsset));
```

Suggested fix — collect results, always report:

```ts
let saved = 0;
for (const asset of assets) {
  try { await (tab === 'images' ? saveImage(asset as ImageAsset) : saveSvg(asset as SvgAsset)); saved += 1; } catch { /* skip */ }
}
setNotice(`${saved}/${assets.length} assets saved to Downloads/${folder}`);
```

### S2 — 8,000 live computed styles held in memory (performance)

`content.ts` builds `const styles = elements.map((element) => ({ element, style: getComputedStyle(element) }))` up front. `getComputedStyle` returns a **live** object, so the scan pins 8,000 `CSSStyleDeclaration` instances for the whole pass and then walks that array three more times (backgrounds, fonts, colors). On a heavy page this is the single largest allocation in the extension.

Suggested fix — fold the three passes into one `for` loop over `elements`, calling `getComputedStyle` once per element and reading everything from it. Same result, one object alive at a time.

### S2 — Unbounded font list (correctness / UX)

`colors` is capped with `.slice(0, 64)`; `fonts` is not. A page with many `@font-face` families or inline style churn can emit a very long list that the panel renders in full, with a live typography sample per row.

Suggested fix — cap `fonts` the same way (`.slice(0, 40)`), or virtualize the list.

### S2 — Tailwind is dead weight (bundle)

`style.css` starts with `@import "tailwindcss"` and the build pulls in `@tailwindcss/vite`, but **no Tailwind utility class is used anywhere** — every `className` in `App.tsx` is a custom class. Tailwind contributes ~10–15 kB of preflight/theme variables to the 27 kB stylesheet and a build-time dependency.

Note before removing it: the panel CSS currently *relies* on Tailwind preflight (`box-sizing: border-box`, `h1 { margin: 0 }`, unstyled buttons). Deleting the import requires adding a ~10-line reset first.

### S3 — One 187-line component (readability)

`App.tsx` owns scanning, selection, search, clipboard, downloads, and theming. It is still readable because each block is 3–10 lines, but it is at the edge. If a sixth concern lands, extract `lib/clipboard.ts` (the copy helpers) and a `usePageScan()` hook first — those are the two cleanest seams.

### S3 — Copy is serial and unbatched (performance, minor)

`pngBlob` fetches and decodes the source on every copy. Copying the same large hero image twice re-downloads it. A `Map<string, Promise<Blob>>` memo keyed by asset url would make repeat copies instant.

### S3 — `download` attribute on cross-origin font links (correctness, cosmetic)

`<a href={font.source} download>` is ignored for cross-origin URLs, so the link navigates instead of downloading. Harmless, but the affordance is misleading.

### S3 — Repo hygiene

- `releases/pagepluck-0.2.0-chrome.zip` is a build artifact committed to git. Prefer `.gitignore`ing `releases/*.zip`.
- `.agents/` (installed agent skills) is untracked; add it to `.gitignore` if you do not want the skill corpus in history.
- `docs/AUDIT.md` was a one-shot report rather than a living document until this release; it is now versioned alongside the changelog.

### OK — verified, no action

- **No network egress.** No `fetch` for telemetry, no beacons, no analytics, no remote config. The only outbound requests are asset bytes the user explicitly downloads or copies.
- **No `innerHTML`.** SVG markup only ever reaches the DOM as an `<img>` data URL.
- **Cross-origin stylesheet reads** are wrapped in `try`/`catch` with a comment naming the reason.
- **Message contract** is a single literal (`SCAN_PAGE`) shared by the content script and the panel.
- **Reduced motion, focus rings, roles, and labels** are in place for every interactive element.

---

## 0.2.1 change review

| # | Change | Files | Review |
| --- | --- | --- | --- |
| 1 | Double-click copies images and SVGs | `App.tsx` | Writes a `ClipboardItem` carrying both `text/plain` and `image/png`, then falls back to `writeText`. Rasterization failure cannot lose the text payload. `onDoubleClick` sits on the preview only, so it never collides with the checkbox or the Save button. |
| 2 | Font name copies on single click | `App.tsx` | Card body is a real `<button>` (keyboard reachable). The "Font source" `<a>` stays outside the button, so no nested interactive elements. |
| 3 | Light / dark theme | `lib/theme.ts`, `main.tsx`, `index.html`, `style.css` | Theme moved from `@media (prefers-color-scheme)` to a `data-theme` attribute. `main.tsx` applies the stored value before `createRoot`, so light never flashes dark. One `localStorage` key, documented as the only persisted value. |
| 4 | Legible previews in dark mode | `style.css` | `.checker` now uses fixed light colours instead of `var(--bg)`/`var(--soft)`, so the preview board is theme-independent — the way design tools do it. |
| 5 | Docs + version | `README.md`, `docs/CHANGELOG.md`, `docs/DEVELOPMENT.md`, `package.json` | Version 0.2.1. README gained an interaction cheat sheet, a theming section, and the `clipboardWrite` permission row. |
| 6 | Tests | `tests/e2e.mjs` | Added copy assertions for images/SVGs/fonts plus full theme-toggle coverage (default dark → light → pure-white background → persists across reload → back to dark). |

### Verification

```text
TypeScript strict check          PASS   (tsc --noEmit)
Production Manifest V3 build     PASS   (302 kB total, 27 kB CSS)
Clipboard & theme smoke checks   PASS   (17/17, jsdom harness)
Playwright E2E                   not run in this environment
                                        (cdn.playwright.dev unreachable; run `npm run check` locally)
```

> The E2E suite could not be executed in the audit sandbox because the Playwright browser CDN is blocked. To compensate, the copy and theme flows were driven through a jsdom harness with stubbed `chrome.tabs` and `navigator.clipboard`: 17 assertions covering double-click copy on both tabs, the Copy buttons, single-click copy on colors and fonts, notice dismissal, and the full theme round-trip including persistence. **Run `npm run check` on a machine with network access before releasing.**

---

## Known boundaries

- CSS sprite cropping supports pixel background positions at the source image's natural scale. Sprites using percentage positions or a scaled `background-size` need a scale-aware crop.
- Cross-origin iframe contents and closed shadow roots are inaccessible.
- Chrome-protected pages and the Chrome Web Store cannot be scanned.
- If Chrome's "Ask where to save each file" preference is on, Chrome may prompt during batch export; this is browser-controlled.
- PagePluck identifies fonts but does not bypass font licensing or access controls.
- Copying a raster of an SVG renders it at its on-page size, upscaled to at least 256 px on the long edge so small icons stay usable when pasted. Pixel-exact copies should use **Save** and open the `.svg` file.
- Some browsers taint a canvas after drawing an SVG image; if that happens the PNG is dropped and only the SVG markup is placed on the clipboard.

---

## Recommended order for the next pass

1. Wrap the download loops in `try`/`catch` and report `saved/total` (**S1**).
2. Collapse the three `styles` passes in `content.ts` into one loop (**S2**).
3. Cap the font list (**S2**).
4. Decide on Tailwind: keep it and start using utilities, or drop it and add a ten-line reset (**S2**).
