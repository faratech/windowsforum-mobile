# WindowsForum Option 3 design QA

Date: 2026-09-30. Final result: **passed**.

## Visual truth and normalization

- Selected source: `/web/public_html/mobile/option-3.png`, also retained as `qa/reference-dark.png` (853 × 1844 pixels).
- Light companion: `qa/reference-light.png`, generated from the exact selected Option 3 with layout and copy preserved.
- Final rendered iPhone evidence: `qa/final-dark.png` and `qa/final-light.png`, each 393 × 852 pixels, captured from `[data-testid="device-screen"]` at deviceScaleFactor 1 in a 1401 × 1200 browser viewport. The measured phone screen was exactly 393 × 852 CSS pixels. The odd browser width aligns the screen to integer coordinates; earlier 1400px-wide captures included one rounded edge column.
- Additional device evidence: `qa/final-pixel-dark.png` (427 × 952 CSS pixels), `qa/final-phone-preview.png` (390 × 844 browser viewport), `qa/final-theme-sheet.png`, `qa/reply-keyboard.png`, and `qa/reply-posted.png`.
- State: first visit, Latest feed, five sample discussions, three unread notifications; light and dark use the same content and layout.
- Density normalization: source images rendered at 393 CSS pixels wide in the comparison page. Source has no OS chrome; implementation retains the template-owned status bar (54px), home area (34px), camera and bezel. The last discussion therefore requires scrolling on the iPhone. The larger Pixel preview displays it above the navigation. This is the expected device-runtime difference, not missing content.
- Full comparison: `qa/comparison-final.png` places both sources and both implementations in one browser-rendered image.
- Focused comparison: `qa/comparison-focused-final.png` removes only the implementation's 54px status-bar region for comparison and places the same first 620px of app content alongside the dark source. Typography, wrapping, row structure, controls and dividers are readable at this scale.

## Comparison history and corrections

1. Initial comparison (`qa/comparison-first.png`) found P2 density/typography drift: feed segments were too tall, discussion metadata had variable widths, and the desktop discussion wrapped differently. The selected-tab fill also needed stronger text contrast. Adjusted segment height, heading size, metadata columns, row typography and semantic accent values.
2. Focused comparison after those changes found the Solved badge crowding its title and a remaining line-wrap difference in the PowerToys row. Reserved a wider Solved metadata column and matched discussion titles to 16px/600. Added the attachment indicator from the source. Final full and focused comparisons show the approved structure and readable, consistent rows without collisions.
3. Contrast check found light-theme tertiary text at 3.89:1 on its surface. Darkened it to 4.51:1 and the light button fill to 4.78:1 against white text. Added app-owned keyboard focus outlines. No protected runtime file was edited.

## Required fidelity surfaces

- **Typography:** system/Segoe UI stack, 26px community heading, 16px discussion titles, compact secondary metadata. Final initial-feed line wraps match the source's content hierarchy. OS status typography remains owned by the runtime.
- **Spacing:** fixed 61px app header, compact segmented filter, avatar-led flat rows, separated section headings, small inert advertisement slot, labeled four-destination navigation. Content clears fixed navigation and safe areas. No horizontal overflow at 390px browser width.
- **Color:** semantic tokens cover both modes, including sheets, fields, active filters, unread, success, saved state and fixed chrome. WindowsForum blue remains the accent. Dark OS indicators have readable contrast; Pixel's navigation remains its native runtime asset.
- **Assets:** existing WindowsForum brand image is reused. Fluent UI icons provide scalable interface symbols. Initials are the intentional avatar treatment from the selected source. No Forum Copilot artwork or implementation code was copied. Device/keyboard/status assets all load successfully from the exported versioned path.
- **Copy:** selected feed titles, labels and categories are preserved. Further screens use realistic sample content. Compose, AI and account surfaces clearly identify preview behavior. New topics no longer fabricate a community reply.

## Functional checks

The initial browser review is in `qa/functional-first.md`; all reported regressions passed after fixes in `qa/functional-regression.md`.

- Feed filters, navigation, forum/category/back, search results and no-results state.
- Feed scroll restoration across navigation (158px before and after), plus stable ordering when read badges change.
- Save/unsave and filter-specific empty states; follow/unfollow; read notification badges.
- First/latest/jump-sheet controls with stable counters after 650ms; live reading updates after user scrolling.
- Reply posting, quote preserving existing draft, and new discussion creation; post indexes derive from rendered posts.
- Complete new-topic title/category/body recovery after reload; scoped reply draft recovery.
- Light/dark switching and persisted system preference, across iPhone and Pixel previews.
- Search and compose keyboard/sheet opening and dismissal; AI sample interaction and linked discussion.
- No page errors or failed requests in browser runs. The staged export has no root `/assets/` requests, no service-worker registration and no live forum/AI posting calls.

Build validation: TypeScript passes; Vite build passes; all 28 protected runtime hashes pass; the export validates its assets and noindex. Exported assets use `/mobile/assets/5f5ee13c6854e665d7ea/`.

Published verification: `qa/published-browser.json` records a 200 response, successful primary interactions, no page errors, no failed requests and no non-GET requests at the live preview. `qa/published-http.json` records 30 successful origin/Cloudflare checks: both entry paths, preserved gallery and all 12 assets. Every asset's response bytes matched the published file. Cloudflare initially returned the older gallery; a successful purge scoped only to `windowsforum.com/mobile/` resolved it. No global cache purge or production theme activation was performed.

## Remaining scope and minor refinements

- P3: supplied WindowsForum branding and Fluent icons differ slightly from the generated source's simplified mark and icons. Flat surfaces replace the generated image's slight raster grain; component color roles and hierarchy are preserved.
- Preview evidence is Chromium with simulated iPhone/Pixel geometry, not physical iOS Safari/Android/TWA proof. The page deliberately presents a device preview even when viewed on a phone.
- Live authentication, XenForo permissions/read state, actual replies, AI, ads, pagination and phone-only production activation remain integration work described in `INTEGRATION.md`. Mock interactions do not establish production delivery.
- No actionable P0/P1/P2 visual or functional findings remain for the authorized prototype scope.

## Avatar dark-mode follow-up

The user reported the account panel's dark-mode rendering after the original handoff. Live reproduction (`qa/avatar-dark-before.png`) confirmed a P1 issue: the compiled runtime's `.bottom-sheet` rule overrode the app's white-to-dark surface styling, leaving light text on a white panel. The original avatar capture covered light mode and missed this compiled dark-mode state.

Scoped the app's sheet skin to `.device-screen` so it outranks the runtime defaults without modifying protected files. Background, title typography, description, handle and content spacing now follow the semantic theme. The same correction applies to account, search, options and post-jump sheets.

`qa/avatar-theme-comparison.png` compares the reported panel, corrected dark panel and corrected light panel together. Inspected the corrected typography, contrast, controls, spacing and supplied avatar treatment. Eight compiled-export states pass in `qa/avatar-theme-checks.json`: iPhone Dark/Light, System following both OS preferences, dark search/options/jump, and Pixel dark account. No browser errors or failed HTTP responses occurred. TypeScript, Vite, export validation and all 28 protected runtime hashes pass. New asset namespace: `/mobile/assets/be4c54ffda95b71e0db0/`.

Published verification: `qa/avatar-published-browser.json` confirms live dark/light switching and reopening in dark mode, with no page errors. `qa/avatar-published-http.json` confirms both entry paths and byte-identical compiled JavaScript/CSS through origin and Cloudflare (eight checks). Purged only the `/mobile/` prefix after the atomic entry-point update.

final result: passed
