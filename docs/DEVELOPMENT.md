# PagePluck development setup

This guide is for changing PagePluck's source code. The Chrome ZIP is a compiled release and is not the correct folder to edit.

## 1. Requirements

Install these on macOS:

- [Visual Studio Code](https://code.visualstudio.com/) or another IDE
- [Node.js 22 LTS](https://nodejs.org/)
- Google Chrome
- Git (included with Xcode Command Line Tools)

Verify the tools:

```bash
node --version   # v22 or newer
npm --version
 git --version
```

## 2. Open the source project

Clone or download the repository to your development directory:

```bash
git clone https://github.com/<your-username>/pagepluck.git
cd pagepluck
code .
```

## 3. Install dependencies

Run this once after downloading the source or whenever `package-lock.json` changes:

```bash
npm install
```

For reproducible CI/release installation, use:

```bash
npm ci
```

Do not edit anything inside `node_modules`; npm regenerates it.

## 4. Start development mode

```bash
npm run dev
```

WXT watches source files and creates a development extension in:

```text
.output/chrome-mv3
```

Keep this terminal running while coding.

## 5. Load the development extension in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Disable or remove the packaged PagePluck release to avoid confusing the two versions.
4. Click **Load unpacked**.
5. Select `<source project>/.output/chrome-mv3`.
6. Pin PagePluck from Chrome's Extensions menu.
7. Refresh any website that was already open before loading the extension.

When source files change, WXT rebuilds them. If Chrome does not show a change, click PagePluck's reload icon on `chrome://extensions`, refresh the target website, and reopen the side panel.

## 6. Where to make changes

| Goal | File |
| --- | --- |
| Change extraction behavior | `entrypoints/content.ts` |
| Change side-panel behavior | `entrypoints/sidepanel/App.tsx` |
| Change visual design/theme | `entrypoints/sidepanel/style.css` |
| Change panel HTML metadata | `entrypoints/sidepanel/index.html` |
| Change manifest/permissions/icons | `wxt.config.ts` |
| Change shared asset data types | `lib/types.ts` |
| Replace runtime icons | `public/icon/*.png` |
| Edit the complex manual test page | `test-pages/asset-lab.html` |
| Update browser tests | `tests/e2e.mjs` |

## 7. Test changes

Fast checks while working:

```bash
npm run typecheck
npm run build
```

Full verification before a release:

```bash
npx playwright install chromium   # only needed once per machine
npm run check
```

`npm run check` runs strict TypeScript checks, builds and tests the extension in Chromium, scans a live HTTPS page, and audits runtime dependencies.

To test manually with the asset-rich page:

```bash
cd test-pages
python3 -m http.server 4174
```

Open `http://localhost:4174/asset-lab.html`, launch PagePluck, and check Images, SVGs, Colors, Fonts, selection, individual download, and Download all.

## 8. Build a release

Update the version first:

```bash
npm version patch --no-git-tag-version
```

Then verify and package:

```bash
npm run check
npm run zip
```

WXT writes the release ZIP to `.output/pagepluck-<version>-chrome.zip`. Copy that ZIP to `releases/` if you want to keep it:

```bash
cp .output/pagepluck-*-chrome.zip releases/
```

Load the newly built `.output/chrome-mv3` in Chrome and perform one final manual test before sharing the ZIP.

## 9. Clean generated files

```bash
npm run clean
```

This removes `.output`, `.wxt`, and test reports. It does not remove source files.

For a completely fresh dependency installation:

```bash
npm run clean
rm -rf node_modules
npm ci
```

## 10. Git workflow

Initialize version control once:

```bash
git init
git add .
git commit -m "Build PagePluck 0.2.0"
```

For future work:

```bash
git checkout -b feature/short-description
# make changes
npm run check
git add .
git commit -m "Describe the PagePluck change"
```

Generated folders (`node_modules`, `.output`, `.wxt`, screenshots, and test reports) are already excluded by `.gitignore`.

## Source folder versus Chrome build

Use the **source folder** for development:

```text
package.json
entrypoints/
lib/
public/
tests/
wxt.config.ts
```

Use the **compiled Chrome folder** only for installation:

```text
manifest.json
background.js
sidepanel.html
chunks/
content-scripts/
```

Never edit hashed files in `chunks/` or `assets/`; WXT overwrites them on every build.
