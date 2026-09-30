# WindowsForum mobile prototype

An original React prototype of the selected **Option 3**: a compact community feed with WindowsForum blue, light/dark/system themes, and Feed, Forums, Ask AI and Inbox navigation. The calibrated iPhone and Pixel preview runtime remains intact. Desktop access to this design preview is intentional; the eventual production interface is intended for phones only.

This is a **mock-data design preview**. Threads, replies, messages, AI responses, counts and advertising placeholders demonstrate interactions; they do not represent live data or successful production actions. It does not activate a XenForo style, authentication, posting, AI requests, ads or a service worker. `/mobile/` retains `noindex,nofollow`.

## Build and stage the `/mobile/` preview

Run from this directory using the installed dependencies:

```bash
npm run check:runtime
npx tsc --noEmit
npx vite build --base=/mobile/
node scripts/export-mobile.mjs
```

The exporter reads `dist/client` and creates `dist/mobile`. It never deploys. Protected source files and the original Vite output are unchanged. The template's normal `npm run build` remains the separate Sites build workflow.

The exported HTML references `/mobile/assets/<build-digest>/…`. The same namespace contains Vite bundles, fonts, branding and device/keyboard/status assets. This rebases the protected runtime's absolute `/assets/…` URLs and gives rewritten JavaScript a fresh URL. Relative imports between chunks continue to work. The digest covers every source build file and the exporter itself, so a changed build cannot reuse an older export's asset URLs.

Export fails if the Vite base is incorrect, `noindex` is absent, a service worker or install manifest is present, expected device assets are missing, unrebased asset URLs remain, or a rewritten asset reference has no corresponding file. Re-running an identical export is deterministic.

Before handoff, run the runtime check and verify the staged preview on both simulated devices: navigation, theme switching, reading a thread, returning to the feed, opening and dismissing the composer/keyboard, sheets, and Inbox/Ask AI states. Confirm that network requests for device chrome, keyboard images, fonts and app bundles resolve under the versioned `/mobile/assets/` path with no root `/assets/` requests. These checks demonstrate prototype behavior, not production PWA/TWA or real-device compatibility.

## Publish only the authorized preview

Publishing is a separate operator step. Preserve the existing concept gallery as `concepts.html` before replacing its entry point. The guard below assumes the old gallery is still `index.html`; inspect it first and do not archive an already-published interactive prototype under that name.

```bash
cd /web/prototypes/windowsforum-mobile
test -f /web/public_html/mobile/concepts.html || cp -p /web/public_html/mobile/index.html /web/public_html/mobile/concepts.html
mkdir -p /web/public_html/mobile/assets
cp -a dist/mobile/assets/. /web/public_html/mobile/assets/
install -m 0644 dist/mobile/index.html /web/public_html/mobile/.index.html.next
mv /web/public_html/mobile/.index.html.next /web/public_html/mobile/index.html
```

Assets are copied first; `index.html` is replaced last with an atomic rename. Keep previous digest directories while visitors may still have the previous HTML open. Do not use a delete-sync that removes the concept images, `concepts.html`, or older asset versions. Follow the site's existing cache procedure for the entry HTML and verify origin and public `/mobile/` output after publishing; a local successful build is not evidence of deployment. No root manifest, service worker, desktop forum theme or live API configuration belongs in this preview deployment.

## Design references and ownership

Forum Copilot was studied for remembered navigation, catch-up filters, thread-position controls, focused composition and semantic themes. Reference: [standalone XenForo app repository](https://github.com/forumcopilot/xenforoapp), examined at commit `b9ea7d6b3a041eba29842c985d9be7ffaf09264a`, and [official mobile screenshots](https://play.google.com/store/apps/details?id=com.forumcopilot.mobile). Its repository is MIT licensed; this prototype uses original implementation and WindowsForum presentation, with no Forum Copilot source or screenshot artwork copied. Its Flutter client/custom API architecture is a separate choice from our existing PWA/TWA.

Read `AGENTS.md` before changes. App-owned implementation belongs in `src/Prototype.tsx` and `src/prototype.css`; the protected mobile runtime and its lock hashes are not an app-design editing surface.
