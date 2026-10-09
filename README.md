# PagePluck — Web Asset & Design Token Exporter

> A modern, local-only Chrome Extension to inspect, pluck, copy, and export images, inline SVGs, CSS backgrounds, color palettes, and fonts from any webpage directly in your side panel.

<p align="center">
  <img src="assets/brand/social-preview.png" alt="PagePluck - Web Asset & Design Token Exporter Hero Banner" width="100%" />
</p>

<p align="center">
  <a href="https://github.com/hetkumar5506/pagepluck/stargazers"><img src="https://img.shields.io/github/stars/hetkumar5506/pagepluck?style=flat-square&color=yellow" alt="GitHub Stars" /></a>
  <a href="https://github.com/hetkumar5506/pagepluck/network/members"><img src="https://img.shields.io/github/forks/hetkumar5506/pagepluck?style=flat-square&color=blue" alt="GitHub Forks" /></a>
  <a href="https://github.com/hetkumar5506/pagepluck/blob/main/LICENSE"><img src="https://img.shields.io/github/license/hetkumar5506/pagepluck?style=flat-square&color=green" alt="MIT License" /></a>
  <a href="https://github.com/hetkumar5506/pagepluck/releases"><img src="https://img.shields.io/badge/version-0.2.1-6C5CE7?style=flat-square" alt="Version 0.2.1" /></a>
  <a href="https://wxt.dev/"><img src="https://img.shields.io/badge/built%20with-WXT-6C5CE7?style=flat-square" alt="Built with WXT" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /></a>
</p>

**PagePluck** is a high-performance, developer- and designer-friendly browser extension built on Manifest V3. Designed as a Chrome side panel, it lets you inspect any live webpage and pluck out design tokens, vector graphics, image assets, color swatches, and typography styles without digging into complex DevTools element trees.

🛡️ **100% Local & Privacy-First**: No remote API calls, no analytics trackers, no databases, and no account requirements. Everything executes inside your local browser context.

---

## 🆕 What's new in 0.2.1

| | Feature | What it does |
| --- | --- | --- |
| 📋 | **Double-click to copy** | Double-click any image or SVG card and it lands on your clipboard instantly — no download, no dialog. |
| 🔤 | **Font name on click** | Single-click any font card to copy its family name. |
| 🌗 | **Light / dark theme** | A new toggle beside **Rescan** in the top bar. Light mode is built on pure white (`#ffffff`). |
| 👁️ | **Always-legible previews** | Asset previews now sit on a light checkerboard in both themes, so black-on-black icons stay visible. |
| ♿ | **Labelled checkboxes** | Every selection checkbox now carries an accessible name. |

See [`docs/CHANGELOG.md`](docs/CHANGELOG.md) for the full history.

---

## 📑 Table of Contents

- [Why PagePluck?](#-why-pagepluck)
- [Key Features](#-key-features)
- [Interaction Cheat Sheet](#-interaction-cheat-sheet)
- [How It Works](#-how-it-works)
- [Tech Stack & Architecture](#-tech-stack--architecture)
- [Installation & Quick Start](#-installation--quick-start)
- [Usage Guide](#-usage-guide)
- [Theming](#-theming)
- [Available Commands](#-available-commands)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Project Architecture](#-project-architecture)
- [Security & Permissions](#-security--permissions)
- [Contributing](#-contributing)
- [License](#-license)

---

## 💡 Why PagePluck?

When inspecting websites for design research, asset recovery, or frontend development, extracting assets manually through browser DevTools is tedious:

- Inspecting and copying raw SVG markup from nested DOM trees takes time.
- CSS background images and sprite sheets are hidden behind deep style rules.
- Color palettes and font families are scattered across multiple CSS stylesheets.
- Saving a file to disk just to paste one icon somewhere is a wasted round trip.

**PagePluck solves this instantly**: click the extension icon to reveal all assets categorized cleanly in your browser side panel — then download them *or* copy them straight to your clipboard.

---

## ✨ Key Features

### 🖼️ Image & Media Extractor
- Detects all HTML `<img>` elements, `<video>` posters, and every URL in a computed `background-image`.
- Intelligent CSS sprite sheet inspection with support for single-crop exports.
- Supports batch download, single-click save, and **clipboard copy**.

### ⚡ Inline SVG Icon Extractor
- Discovers and serializes inline `<svg>` elements on the fly.
- Previews SVG icons safely inside side panel cards.
- **Copy the raw markup** (paste straight into Figma, your editor, or a codebase) or export a pure `.svg` file.

### 🎨 Color Palette & Hex Picker
- Ranks computed foreground, background, border, `fill`, and `stroke` colors by frequency of use across the DOM.
- Instant click-to-copy in HEX, with the original computed value shown underneath.
- Visual swatch previews for rapid theme auditing.

### 🔤 Font & Typography Inspector
- Scans computed `font-family` declarations across all rendered text.
- Displays element usage counts and live interactive typography preview samples.
- **Click any font card to copy its family name.**

### 🌗 Light & Dark Panel
- Ships dark-first. Flip to a **pure-white light theme** with one click in the top bar.
- Your choice is remembered the next time the panel opens.

### 🖥️ Persistent Side Panel Workflow
- Powered by the Chrome `sidePanel` API: inspect the page while actively scrolling, clicking, and interacting with the target site.

---

## ⌨️ Interaction Cheat Sheet

| Where | Gesture | Result |
| --- | --- | --- |
| **Images** → card preview | **Double-click** | Copies the image to your clipboard (PNG for image apps, URL for editors) |
| **Images** → `Copy` button | Single click | Same as above |
| **Images** → `Save` button | Single click | Downloads the file via Chrome's Save-as dialog |
| **SVGs** → card preview | **Double-click** | Copies the SVG to your clipboard (raw markup **and** a rasterized PNG) |
| **SVGs** → `Copy` / `Save` | Single click | Copy markup, or download a `.svg` file |
| **Colors** → any swatch | Single click | Copies the HEX value (e.g. `#112233`) |
| **Fonts** → any card | Single click | Copies the font family name (e.g. `Arial`) |
| Top bar → **Sun / Moon** | Single click | Toggles light ⇄ dark |
| Top bar → **Refresh** | Single click | Rescans the active tab |

> **How does "copy an image" work?** PagePluck writes a *multi-format* clipboard entry. Apps that accept images (Figma, Slack, Google Docs, Photoshop) paste the PNG; code editors and Figma's SVG paste take the plain-text payload — the raw `data:`/`https:` URL for images, and the full `<svg>…</svg>` markup for vectors.

---

## 🔬 How It Works

```text
Target Webpage DOM
       │
       ▼
 WXT Content Script (Isolated Context)
       ├── Scans up to 8,000 DOM elements
       ├── Extracts <img>, SVG, and CSS background assets
       ├── Aggregates & deduplicates computed colors & fonts
       │
       ▼ (runtime message: SCAN_PAGE)
 React 19 Side Panel UI
       ├── Instant search, preview, and filtering
       ├── Double-click to copy  ·  click-to-copy tokens
       ├── Light / dark theme
       └── Download assets individually or in batches
```

---

## 🛠️ Tech Stack & Architecture

- **Framework**: [WXT](https://wxt.dev/) (Next-generation Chrome Extension framework for Manifest V3)
- **UI Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode, `noUncheckedIndexedAccess`)
- **Styling**: CSS custom properties themed through a `data-theme` attribute, with [Tailwind CSS v4](https://tailwindcss.com/) in the pipeline
- **Icons**: [Reicon](https://reicon.dev/) (tree-shaken through direct imports)
- **End-to-End Testing**: [Playwright](https://playwright.dev/) running in real Chromium

---

## 🚀 Installation & Quick Start

### Prerequisites
- **Node.js**: `>= 22.0.0`
- **npm**: `>= 10.0.0`
- Google Chrome, Brave, Arc, Edge, or any Chromium browser.

### 1. Clone the repository
```bash
git clone https://github.com/hetkumar5506/pagepluck.git
cd pagepluck
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run development build
```bash
npm run dev
```
WXT will watch source files and compile the extension into `.output/chrome-mv3`.

### 4. Load the extension in Chrome
1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click **Load unpacked**.
4. Select the `.output/chrome-mv3` folder inside the `pagepluck` directory.
5. Pin **PagePluck** from the Chrome extension puzzle piece menu.

---

## 📖 Usage Guide

1. Open any standard website (e.g. `https://github.com` or `https://unsplash.com`).
2. Click the **PagePluck** icon in your toolbar.
3. The Chrome side panel opens automatically.
4. Switch between the tabs:
   - **Images**: Browse raster assets, posters, and background images.
   - **SVGs**: Preview icons — double-click to copy the markup, or download individual vector files.
   - **Colors**: Click any swatch to copy its HEX value to your clipboard.
   - **Fonts**: Click any font to copy its family name.
5. Tick the checkboxes to build a selection, then use **Download selected**.
6. Click **Rescan** anytime if dynamic content loads or after navigating to another page.

> **Note**: Chrome restricts extension scripts on internal pages such as `chrome://`, `edge://`, `about:blank`, and the Chrome Web Store.

---

## 🌗 Theming

PagePluck is dark by default. The **Sun / Moon** button next to **Rescan** flips between the two:

| Theme | Background | Surface | Border | Text |
| --- | --- | --- | --- | --- |
| **Dark** (default) | `#09090b` | `#0f0f11` | `#27272a` | `#fafafa` |
| **Light** | `#ffffff` (pure white) | `#fafafa` | `#e4e4e7` | `#09090b` |

- The choice is stored under the `pagepluck:theme` key in `localStorage` so the panel reopens in the theme you picked. It is the **only** thing PagePluck persists — asset data is still never written to disk.
- Asset previews always render on a light checkerboard, regardless of theme, so dark logos and black icons remain visible.

---

## 💻 Available Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start development mode with HMR and automatic extension reloads |
| `npm run build` | Produce an optimized production build in `.output/chrome-mv3` |
| `npm run typecheck` | Run TypeScript compiler type validation (`tsc --noEmit`) |
| `npm run test:e2e` | Build, then launch real Chromium with Playwright to verify extraction, copy, and theming |
| `npm run check` | Run typecheck, E2E tests, and dependency security audits |
| `npm run zip` | Bundle the production extension into a store-ready `.zip` package |
| `npm run clean` | Remove `.output`, `.wxt`, and test reports |

---

## 🧪 Testing & Quality Assurance

PagePluck includes an automated Playwright suite that drives the real extension inside Chromium — verifying DOM extraction, background image parsing, SVG serialization, side panel messaging, **clipboard copy behaviour**, and **theme toggling**:

```bash
# Install Chromium browser binary (first time only)
npx playwright install chromium

# Run the test suite
npm run test:e2e
```

What the suite asserts:

```text
Scan of fixture page (images / svgs / colors / fonts counts)
Stylesheet actually loaded in the panel
Image multi-select + "Download selected (3)" enabled
Double-click copies an image payload
Double-click copies SVG markup
Font single-click copies the family name
Default theme is dark → toggles to light → background is pure white
Theme preference survives a panel reload
Live HTTPS scan (example.com)
```

---

## 📁 Project Architecture

```text
pagepluck/
├── entrypoints/
│   ├── background.ts          # Service worker managing side panel toggle
│   ├── content.ts             # DOM content script for asset harvesting
│   └── sidepanel/             # React application mounted in Chrome side panel
│       ├── App.tsx            # Main state, tabs, filtering, copy & downloads
│       ├── index.html         # Side panel shell (boots with data-theme="dark")
│       ├── main.tsx           # Applies the stored theme, mounts React
│       └── style.css          # Design system, tokens & CSS rules
├── lib/
│   ├── types.ts               # Shared TypeScript models and IPC contracts
│   └── theme.ts               # Theme type + localStorage read/apply helpers
├── public/
│   └── icon/                  # Extension icons (16px, 32px, 48px, 128px)
├── assets/brand/              # Vector and high-res master branding
├── test-pages/                # Controlled HTML fixtures for testing edge cases
├── tests/                     # Playwright integration & E2E tests
├── docs/                      # Audit, changelog and developer notes
├── releases/                  # Packaged store-ready ZIPs
├── wxt.config.ts              # Manifest V3 metadata & build configs
├── tsconfig.json              # Strict TypeScript configuration
├── LICENSE                    # MIT License
└── package.json               # Dependencies and build scripts
```

---

## 🔒 Security & Permissions

PagePluck is built strictly following the principle of least privilege:

| Permission | Reason |
| --- | --- |
| `sidePanel` | Allows rendering the user interface alongside the active browser tab |
| `downloads` | Saves selected images and SVG files to your local `Downloads` directory |
| `clipboardWrite` | Puts copied assets, hex values, and font names on your clipboard |
| `<all_urls>` | Required to inspect DOM elements, inline SVGs, and computed styles on arbitrary pages |

- **Zero Network Egress**: The extension contains no analytics, telemetry, beacons, or remote API calls. The only outbound requests are the asset bytes you explicitly choose to download or copy.
- **Ephemeral Asset Data**: Extracted page data lives in React memory and is cleared when the side panel closes. The single exception is the `pagepluck:theme` string in `localStorage`.
- **No `innerHTML`**: Raw SVG markup is never mounted into the DOM; previews use image-document data URLs.
- **Bounded Scans**: The content script caps DOM traversal at 8,000 elements to keep heavy pages responsive.
- **Graceful Cross-Origin Handling**: Cross-origin stylesheet access is attempted only for font metadata and safely skipped when blocked.

---

## 🤝 Contributing

Contributions are welcomed! Whether you want to fix a bug, suggest an enhancement, or optimize performance:

1. Fork this repository.
2. Create your branch: `git checkout -b feature/my-new-feature`.
3. Test your changes: `npm run check`.
4. Commit your changes: `git commit -m 'feat: add support for webp conversion'`.
5. Push to the branch: `git push origin feature/my-new-feature`.
6. Open a Pull Request on GitHub.

Agent skills for this repository live in [`skills-lock.json`](skills-lock.json) and are installed to `.agents/skills/` with the [`skills` CLI](https://github.com/vercel-labs/skills):

```bash
npx skills experimental_install   # restore every skill listed in skills-lock.json
npx skills add <owner>/<repo>     # add a new one
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) © 2026 Het Patel.
