# PagePluck

> Pluck images, inline SVGs, CSS backgrounds, colors, and font families from any webpage with ease.

<p align="center">
  <img src="public/icon/128.png" alt="PagePluck icon" width="96" height="96" />
</p>

PagePluck is a free, local-only Chrome extension built with React, TypeScript, Tailwind CSS, and [WXT](https://wxt.dev/). Open any website, launch the side panel, inspect visual design tokens and assets, and download or copy them instantly.

**100% Local & Ephemeral** — No database, no tracking, no analytics, and no third-party APIs. Your data never leaves your browser.

---

## ✨ Features

- 🖼️ **Images & Media** — Scans standard `<img>` tags, video posters, and CSS background images. Automatically detects CSS sprite repetitions and allows individual crop exports.
- 📦 **Batch Export** — Select individual assets or batch download multiple images / inline SVGs into organized folders.
- ⚡ **Inline SVGs** — Parses and safely serializes inline `<svg>` elements with preview cards and one-click SVG downloads.
- 🎨 **Palette Extraction** — Ranks and extracts computed text, background, and border colors with click-to-copy hex / rgb values.
- 🔤 **Font Detection** — Lists active computed font families along with usage frequencies and interactive typography previews.
- 🖥️ **Side Panel Workflow** — Operates seamlessly inside the Chrome side panel so you never lose context of the active tab.

---

## 🛠️ Tech Stack

| Tool / Library | Role |
| --- | --- |
| [WXT](https://wxt.dev/) | Next-gen Manifest V3 framework and bundler |
| [React 19](https://react.dev/) | Modern side panel UI |
| [TypeScript](https://www.typescriptlang.org/) | End-to-end type safety |
| [Tailwind CSS v4](https://tailwindcss.com/) | Styling & design system |
| [Motion](https://motion.dev/) | Smooth transitions & UI feedback |
| [Playwright](https://playwright.dev/) | Real Chromium end-to-end testing |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version **>= 22**)
- [npm](https://www.npmjs.com/) (version **>= 10**)
- Google Chrome or any Chromium-based browser

### 1. Clone & Install

```bash
git clone https://github.com/<your-username>/pagepluck.git
cd pagepluck
npm install
```

### 2. Run in Development Mode

```bash
npm run dev
```

WXT builds the unpacked extension into `.output/chrome-mv3` with automatic hot-module replacement / auto-reload.

### 3. Load into Chrome

1. Open Chrome and navigate to `chrome://extensions`.
2. Toggle on **Developer mode** (top-right corner).
3. Click **Load unpacked**.
4. Select the `.output/chrome-mv3` directory inside this repository.
5. Pin **PagePluck** to your Chrome toolbar, visit any website (e.g. `https://example.com`), and click the icon to open the side panel!

---

## 💻 Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the WXT development server with live reload |
| `npm run build` | Builds the production extension in `.output/chrome-mv3` |
| `npm run typecheck` | Validates TypeScript types across the project |
| `npm run test:e2e` | Builds and runs end-to-end tests using Playwright & Chromium |
| `npm run check` | Runs typechecks, tests, and security audits |
| `npm run zip` | Bundles the extension into a distributable `.zip` file |
| `npm run clean` | Cleans up `.output`, `.wxt`, and test artifacts |

---

## 🧪 Testing

End-to-end tests launch an isolated Chromium instance and verify asset extraction across static pages and live HTTPS websites:

```bash
# Install Chromium for Playwright (first-time only)
npx playwright install chromium

# Run the test suite
npm run test:e2e
```

---

## 📁 Repository Structure

```text
.
├── entrypoints/
│   ├── background.ts          # Background service worker (toggles side panel)
│   ├── content.ts             # Content script extracting DOM visual assets
│   └── sidepanel/             # React side panel application
│       ├── App.tsx            # Main UI, tabs, search, and export actions
│       ├── index.html         # Panel shell
│       ├── main.tsx           # React entry point
│       └── style.css          # Tailwind CSS styles
├── lib/
│   └── types.ts               # Shared TypeScript schemas & messaging types
├── public/
│   └── icon/                  # Extension icons (16, 32, 48, 128)
├── assets/brand/              # Brand logos & master artwork
├── test-pages/                # Test fixtures (asset-rich mock pages)
├── tests/                     # Playwright E2E test scripts
├── docs/                      # Technical documentation & audit reports
├── wxt.config.ts              # WXT build configuration & Chrome manifest
├── tsconfig.json              # TypeScript compiler configuration
├── LICENSE                    # MIT License
└── package.json
```

---

## 🔒 Permissions & Privacy

PagePluck adheres strictly to least-privilege Manifest V3 guidelines:

- `sidePanel`: Opens the inspection view alongside the active webpage.
- `downloads`: Allows you to save plucked images and SVGs directly to your computer.
- `<all_urls>` (host permissions): Necessary to read DOM elements and computed CSS styles on the webpage you inspect.

**Privacy Notice**: All operations occur 100% locally in your browser. No cookies, session tokens, passwords, form fields, or analytics are read, captured, or transmitted.

---

## 🤝 Contributing

Contributions, feature requests, and bug reports are welcome!

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/amazing-feature`.
3. Commit your changes: `git commit -m 'Add amazing feature'`.
4. Run tests and type-checks: `npm run check`.
5. Push to the branch: `git push origin feature/amazing-feature`.
6. Open a Pull Request.

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
