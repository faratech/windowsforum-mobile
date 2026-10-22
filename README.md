# WindowsForum mobile prototype

An interactive design preview of a phone-first WindowsForum community app: a compact, avatar-led feed in WindowsForum blue with light, dark, and system themes. It runs inside a calibrated iPhone / Pixel 10 device preview so you can click through the experience in a desktop browser.

> **Prototype status — please read first.** This is a **mock-data design preview**, not a working forum client. Threads, replies, messages, AI responses, counts, and advertising placeholders demonstrate interactions only; they are not live data, and nothing you type is sent anywhere. The preview does not activate a XenForo style, authentication, posting, AI requests, ads, or a service worker, and `/mobile/` is served with `noindex,nofollow`. Desktop access to this design preview is intentional; the eventual production interface is intended for phones only. The production plan lives in [INTEGRATION.md](INTEGRATION.md).

## What you can try

Open the preview and use the four labeled destinations in the bottom navigation — **Feed**, **Forums**, **Ask AI**, and **Inbox** — or pick **iPhone** or **Pixel 10** from the device picker to switch the simulated handset.

- **Feed** — Browse sample discussions under **Latest**, **Following**, and **Saved** segments. Rows show unread reply counts, a **Solved** badge, and attachment indicators; an inert “Advertisement” slot shows where an ad would sit. Empty states guide you back to Latest.
- **Discussion reader** — Open any discussion to read the opening post and sample replies. Like a post, quote it into a reply, save/unsave it, follow/unfollow it from the options sheet, and move with the reading dock (first post, current/total counter, latest reply, or the jump-to-a-post sheet). Your place updates as you scroll.
- **Composer** — Start a **New discussion** (choose one of the five forums, add a title and message) or reply in place. Drafts are kept when you close the composer and survive a reload for the new-topic title, category, and body; posting only adds the item to this preview and says so.
- **Forums** — Explore **Help and support**, **Software**, **Customization**, **Tips and Tutorials**, and **Hardware and Drivers**, open a category, and start a discussion in it.
- **Ask AI** — Try a suggested prompt or type a Windows question. After a brief “Thinking…” pause you get a clearly labeled sample answer with a link into a related sample discussion. No AI request leaves the page.
- **Inbox** — Review three sample notifications with unread indicators, open one to jump to its discussion, or use **Mark all read**.
- **Search and account** — Search filters the sample discussions by title and category (including a no-results state). The account sheet switches appearance between **Light**, **Dark**, and **System**; the choice persists in this browser, follows your OS preference in System mode, and links to your saved discussions.
- **Simulated phone chrome** — The preview includes a live status bar, device frame and camera cutout, and an on-screen keyboard that opens for text entry and dismisses before sheets and navigation, so flows feel like a real handset.

Everything above works offline against the bundled sample content in [src/content.ts](src/content.ts). Reloading resets likes, follows, read state, and posted items, except for the appearance preference and composer drafts noted above.

## Development quick start

### Prerequisites

- Node.js and npm. This project has no `engines` range in [package.json](package.json); the commands below were verified with Node v26.7.0 and npm 12.0.2.
- For the browser tests: Playwright's Chromium. If it is not installed yet, run `npx playwright install chromium` once.

### Install and run

```bash
npm ci
npm run dev
```

`npm run dev` starts Vite (default port 5173; pass another port with `npm run dev -- --port <port>`). Its `predev` hook first runs the runtime integrity check described below, so a tampered protected runtime fails before the server starts. Open the printed local URL, choose iPhone or Pixel 10, and click through the feed.

Useful URLs while developing (query parameters honored by the runtime/app):

| URL | Effect |
| --- | --- |
| `/?theme=light` or `/?theme=dark` | Force the initial appearance for this visit |
| `/?keyboard=1` | Open the simulated keyboard on load |
| `/tests/runtime-fixture.html` | Interaction fixture used by the Playwright suite |

### Scripts

Every script below is defined in [package.json](package.json); `predev`/`prebuild` hooks run automatically.

| Command | What it does |
| --- | --- |
| `npm run dev` | Run `check:runtime`, then start the Vite dev server |
| `npm run build` | Run `check:runtime`, then `tsc && vite build && node scripts/prepare-sites-build.mjs` (the Sites build; see [Deployment](#deployment-maintainers-only)) |
| `npm run check:runtime` | Verify all 28 protected runtime files against `mobile-runtime.lock.json` |
| `npm run update:runtime-lock` | Regenerate `mobile-runtime.lock.json` — only for an explicitly requested runtime change, after re-verifying behavior |
| `npm run test:runtime` | Run the Playwright suite (`playwright test`) |
| `npm run test:sites` | Run the Sites worker tests (`node --test tests/sites-worker.test.mjs`); requires `npm run build` output first |

Type-check without emitting, exactly as the maintainer staging flow does:

```bash
npx tsc --noEmit
```

There is no `.env` file and no required environment variable for the app itself. The only environment variable read by tooling is `MOBILE_RUNTIME_TEST_PORT` (Playwright; default `4174`). The app reads `import.meta.env.BASE_URL` for its brand image, persists appearance to `localStorage` (`wf-mobile-preview:theme`), and keeps composer drafts in `sessionStorage` (`wf-mobile-preview:drafts`).

## Project layout

```text
index.html                  Entry page (noindex,nofollow; theme-color; mounts #root)
src/
  main.tsx                  React entry; loads Roboto, styles, and <App />
  App.tsx                   Composes MobileRuntime around the prototype
  Prototype.tsx             App-owned UI: feed, forums, reader, composer, Ask AI, Inbox, sheets
  prototype.css             App-owned semantic light/dark theme tokens and layout
  content.ts                Sample topics, forums, and alerts (all mock data)
  styles.css                Protected template/device styles
  mobile/                   Protected device runtime (see below)
    MobileRuntime.tsx       PhoneFrame → KeyboardProvider → StatusBar, viewport, HomeIndicator, KeyboardDock
    PhoneFrame.tsx          Calibrated frame, screen portal, device picker, camera cutout
    Device.tsx              iPhone / Pixel 10 presets (Pixel screen 427 × 952)
    Keyboard.tsx            Simulated keyboard, KeyboardInput/KeyboardTextarea, insets
    MobileScroll.tsx        Rubber-band scrolling with drag-click suppression
    Carousel.tsx            Horizontal rails that yield vertical gestures to MobileScroll
    FlowStack.tsx           Optional multi-screen push/pop/replace flows
    BottomSheet.tsx         Phone-scoped sheets (dismisses the keyboard first)
    components.tsx          StatusBar, HomeIndicator, MobileTextField
    COMPONENTS.md           Full runtime component and gesture contract
public/assets/              Device bezels/keyboards, status icons, WindowsForum brand image
scripts/
  check-mobile-runtime.mjs  SHA-256 integrity check against the lock file
  export-mobile.mjs         Stage dist/client as the versioned /mobile/ preview (never deploys)
  prepare-sites-build.mjs   Copy worker + hosting config into dist/ for Sites
  update-mobile-runtime-lock.mjs
worker/index.js             Sites worker: serve assets, SPA-fallback HTML GET/HEAD 404s to /index.html
tests/
  mobile-runtime.spec.ts    Playwright interaction suite (fixture-driven)
  runtime-fixture.*         Fixture page the Playwright suite drives
  sites-worker.test.mjs     node:test coverage for worker/index.js and Sites packaging
.openai/hosting.json        Sites hosting config (no D1/R2 bindings)
mobile-runtime.lock.json    SHA-256 hashes of the 28 protected runtime files
playwright.config.ts        Playwright config (auto-starts the dev server)
vite.config.ts              Vite config (React plugin; build output dist/client)
tsconfig.json               Strict TypeScript, noEmit, bundler module resolution
AGENTS.md                   Agent/contributor rules and the protected-runtime boundary
INTEGRATION.md              Phones-only production integration plan (not yet delivered)
design-qa.md                Visual/functional QA evidence for the selected Option 3 design
```

### Architecture in brief

- **Two layers, one editing boundary.** App-owned design lives only in [src/Prototype.tsx](src/Prototype.tsx) and [src/prototype.css](src/prototype.css) (plus sample data in [src/content.ts](src/content.ts)). Everything under `src/mobile/`, the device assets, `src/App.tsx`, `src/main.tsx`, `src/styles.css`, `vite.config.ts`, `worker/index.js`, and `scripts/prepare-sites-build.mjs` is the protected mobile runtime. `npm run check:runtime` hashes those 28 files against [mobile-runtime.lock.json](mobile-runtime.lock.json) and fails if any changed; restore the runtime rather than weakening the check. See [AGENTS.md](AGENTS.md) before changing anything.
- **Runtime composition.** `App` renders `MobileRuntime`, which nests the app inside `PhoneFrame` and `KeyboardProvider` with overlaid `StatusBar`, `HomeIndicator`, and `KeyboardDock`. The prototype composes its tab screens, thread reader, composer, and sheets directly as sibling layers over `MobileScroll` instead of routing through `FlowStack`; text entry always uses the runtime's keyboard-aware fields so focus, insets, and the simulated keyboard stay connected. The full contract is in [src/mobile/COMPONENTS.md](src/mobile/COMPONENTS.md).
- **Theming.** `Prototype` resolves `light` / `dark` / `system` (default dark on first visit, or the `?theme=` override) to semantic CSS variables in `prototype.css`, syncs the `theme-color` meta, and persists the choice. The OS status-bar typography and icons stay owned by the runtime per device.
- **Two build outputs.** `npm run build` produces the Sites output (`dist/client`, `dist/server/index.js` from [worker/index.js](worker/index.js), `dist/.openai/hosting.json`). The `/mobile/` preview is a separate, maintainer-only export described under [Deployment](#deployment-maintainers-only); the template's Sites build remains the normal workflow and protected sources are never rewritten by the exporter.

## Testing

### Playwright runtime tests

```bash
npm run test:runtime
```

This runs `playwright test` with [playwright.config.ts](playwright.config.ts): it auto-starts `npm run dev` on port 4174 (override with `MOBILE_RUNTIME_TEST_PORT`), loads [tests/runtime-fixture.html](tests/runtime-fixture.html), and exercises the runtime primitives in [tests/mobile-runtime.spec.ts](tests/mobile-runtime.spec.ts) — Carousel vs. MobileScroll gesture handoff, tap-vs-drag suppression, momentum and rubber-banding, BottomSheet exit animation, keyboard/footer co-dismissal, the Pixel composer inset, and FlowStack push/pop. These tests verify the protected runtime, not forum behavior.

### Sites worker tests

```bash
npm run build
npm run test:sites
```

`test:sites` runs `node --test` over [tests/sites-worker.test.mjs](tests/sites-worker.test.mjs), covering the worker's asset pass-through, HTML fallback, refusal to rewrite API/write requests, and the presence of the Sites packaging outputs. Run `npm run build` first; without `dist/` the packaging test fails because its inputs do not exist yet.

### Manual preview checks

Before handoff, run `npm run check:runtime` and verify the staged preview on both simulated devices: navigation, theme switching, reading a thread, returning to the feed, opening and dismissing the composer/keyboard, sheets, and Inbox/Ask AI states. Confirm that network requests for device chrome, keyboard images, fonts, and app bundles resolve under the versioned `/mobile/assets/` path with no root `/assets/` requests. These checks demonstrate prototype behavior, not production PWA/TWA or real-device compatibility. Recorded evidence is in [design-qa.md](design-qa.md).

## Deployment (maintainers only)

> **Authorization warning.** Nothing in this section is a visitor or contributor workflow. Staging only prepares local files; publishing replaces the live `/mobile/` entry point and must be done only by an authorized maintainer, as a separate operator step, after the manual preview checks above. Do not publish on the strength of a local successful build alone, and do not activate any production theme, service worker, manifest, or live API configuration as part of this preview deployment.

### Stage the `/mobile/` preview locally

Run from this directory using the installed dependencies:

```bash
npm run check:runtime
npx tsc --noEmit
npx vite build --base=/mobile/
node scripts/export-mobile.mjs
```

The exporter reads `dist/client` and creates `dist/mobile`. It never deploys. Protected source files and the original Vite output are unchanged. The template's normal `npm run build` remains the separate Sites build workflow.

The exported HTML references `/mobile/assets/<build-digest>/…`. The same namespace contains Vite bundles, fonts, branding, and device/keyboard/status assets. This rebases the protected runtime's absolute `/assets/…` URLs and gives rewritten JavaScript a fresh URL. Relative imports between chunks continue to work. The digest covers every source build file and the exporter itself, so a changed build cannot reuse an older export's asset URLs.

Export fails if the Vite base is incorrect, `noindex` is absent, a service worker or install manifest is present, expected device assets are missing, unrebased asset URLs remain, or a rewritten asset reference has no corresponding file. Re-running an identical export is deterministic.

### Publish only the authorized preview

Publishing is a separate operator step. Preserve the existing concept gallery as `concepts.html` before replacing its entry point. The guard below assumes the old gallery is still `index.html`; inspect it first and do not archive an already-published interactive prototype under that name.

```bash
cd /web/prototypes/windowsforum-mobile
test -f /web/public_html/mobile/concepts.html || cp -p /web/public_html/mobile/index.html /web/public_html/mobile/concepts.html
mkdir -p /web/public_html/mobile/assets
cp -a dist/mobile/assets/. /web/public_html/mobile/assets/
install -m 0644 dist/mobile/index.html /web/public_html/mobile/.index.html.next
mv /web/public_html/mobile/.index.html.next /web/public_html/mobile/index.html
```

Assets are copied first; `index.html` is replaced last with an atomic rename. Keep previous digest directories while visitors may still have the previous HTML open. Do not use a delete-sync that removes the concept images, `concepts.html`, or older asset versions. Follow the site's existing cache procedure for the entry HTML and verify origin and public `/mobile/` output after publishing; a local successful build is not evidence of deployment. No root manifest, service worker, desktop forum theme, or live API configuration belongs in this preview deployment.

## Design references and ownership

This prototype implements the selected **Option 3** design: a compact community feed with WindowsForum blue, light/dark/system themes, and Feed, Forums, Ask AI, and Inbox navigation. The calibrated iPhone and Pixel preview runtime remains intact.

Forum Copilot was studied for remembered navigation, catch-up filters, thread-position controls, focused composition, and semantic themes. Reference: [standalone XenForo app repository](https://github.com/forumcopilot/xenforoapp), examined at commit `b9ea7d6b3a041eba29842c985d9be7ffaf09264a`, and [official mobile screenshots](https://play.google.com/store/apps/details?id=com.forumcopilot.mobile). Its repository is MIT licensed; this prototype uses original implementation and WindowsForum presentation, with no Forum Copilot source or screenshot artwork copied. Its Flutter client/custom API architecture is a separate choice from our existing PWA/TWA. Production lessons drawn from it are recorded in [INTEGRATION.md](INTEGRATION.md).

Read [AGENTS.md](AGENTS.md) before changes. App-owned implementation belongs in `src/Prototype.tsx` and `src/prototype.css`; the protected mobile runtime and its lock hashes are not an app-design editing surface.

## Contributing

Contributions are design-preview changes, not production forum work:

1. Read [AGENTS.md](AGENTS.md) in full first — it is the source of truth for the runtime contract, interaction rules, and editing boundary.
2. Keep app changes in `src/Prototype.tsx`, `src/prototype.css`, and (for sample data) `src/content.ts`. Do not edit the protected runtime files listed in [AGENTS.md](AGENTS.md); if `npm run check:runtime` fails, restore the runtime instead of bypassing the check. Only an explicitly requested runtime change may regenerate the lock with `npm run update:runtime-lock`, after re-verifying the new behavior.
3. Run `npm run check:runtime` and `npx tsc --noEmit` before handoff, plus `npm run test:runtime` and `npm run test:sites` when your change touches the areas they cover. Verify both simulated devices and all three appearance modes for visual changes.
4. Do not add live authentication, posting, AI, advertising, service-worker, or PWA/TWA behavior to this preview. Production binding is planned separately in [INTEGRATION.md](INTEGRATION.md).

## License

No `LICENSE` file is present in this repository, so no reuse rights are granted by default: treat the code, design, and bundled WindowsForum branding as all-rights-reserved unless you have separate written permission from the maintainers. This does not affect upstream projects referenced for study — notably Forum Copilot, whose own repository is MIT licensed on its terms — but that license does not extend to this prototype's original implementation.

