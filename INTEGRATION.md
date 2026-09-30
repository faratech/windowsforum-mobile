# Production integration plan — Option 3, phones only

This document plans a later production implementation. The current `/mobile/` build is an isolated mock-data prototype; it does not establish live authentication, posting, AI, advertising, PWA, or TWA behavior. The approved design is Option 3 in light/dark/system themes, with Feed, Forums, Ask AI, and Inbox destinations. Desktop access to the design preview is intentional.

## Verified starting point

Checked against source, read-only database queries, and origin GET responses on 2026-09-29:

- Default XenForo style is **50**, inheriting 40. Styles 17 and 40 remain selectable. Scope the first production shell to style 50; preserve explicitly chosen legacy styles.
- `WindowsForum/MobileUI` is disabled despite its `wfMobileUiEnabled=1` option. Its old code contains deleted style IDs and width-only activation. Do not enable it as a shortcut to this design.
- `WindowsForum/SocialFeed` is active, `wfFeedAccess=all`, and `indexRoute` remains empty. `/feed/` is public; `/` remains the forum index.
- The page links to dynamic `/webmanifest.php`. Its identity/start URL is `/?_pwa=1`, scope `/`, and display `standalone`; DigitalPoint/PWA is active. Preserve that identity and its member install/login handoff.
- Guest HTML cache keys contain URL, style, language, and consent, with **no device dimension**. See [pagecache.php](/web/public_html/pagecache.php:2634) and its key construction at line 2671.
- The live root service worker uses network navigation, offline fallback, push, and asset caching. In particular, unversioned `.min.js` can enter its immutable cache. Its response has browser `max-age=600` and edge `max-age=300`. Source: [service_worker.js](/web/public_html/service_worker.js:364).
- Site asset links identify Android package `com.vbulletin.build_750`; this does not prove the currently released APK's launcher, signed certificate, validated origins, or runtime behavior. No WindowsForum Android/TWA launcher project was found in the tracked tree; the Android projects found belong to Pong.

## Implementation boundary and phone activation

Implement the production presentation with scoped XenForo template modifications and versioned CSS/JS assets. Reuse the existing server-rendered content and forms; the React prototype is a design/interaction reference, not a replacement forum backend.

1. Keep identical cacheable HTML for phone and desktop requests. A small common bootstrap selects the presentation in the browser; only eligible phones load the substantial mobile assets.
2. Explicitly reject iPad UA and desktop-UA iPad (`MacIntel` plus multiple touch points). Prefer `navigator.userAgentData.mobile` where available; otherwise accept iPhone/iPod or Android UA containing `Mobile`. Ambiguous devices retain the current UI.
3. Narrow width, touch support, and standalone display mode are insufficient individually. Thus a narrow desktop window, touch laptop, desktop PWA, and normal tablet do not activate the phone shell.
4. Keep eligibility independent of viewport width so phone landscape and the keyboard do not switch themes. Use viewport/input capabilities only to adapt geometry. Device identity remains a heuristic, not an access/security boundary.
5. Apply all new selectors beneath one explicit phone-shell root class. Preserve native content if initialization fails, JavaScript is unavailable, or the rollout switch is off. Avoid duplicate form IDs, competing event handlers, and hidden copies of editable forms.
6. Use content-hashed asset URLs on every change. Do not extend service-worker HTML caching, change shared cache keys, introduce a mobile style cookie, or add a server UA redirect for this presentation rollout.
7. Keep Light/Dark/System as semantic theme tokens and connect to the existing XenForo variation preference. Verify the same choice persists across Feed, thread, account, and AI transitions without conflicting preference stores or first-paint flashes.

## Routes and app navigation

Build production links through XenForo's route builder so existing canonicalization and permissions remain authoritative.

| App surface | Existing destination | Required behavior |
|---|---|---|
| Feed / Latest | `/feed/` | Native discussion feed; excludes news/tutorial nodes. “Latest” denotes chronological discussion activity, not an algorithmic recommendation. |
| Following | `/feed/following` | Watched forums or threads started/bumped by followed members, within 180 days. Guests get the native login empty state. |
| Saved | `/feed/saved` | Native bookmarked posts; guest login state, no fabricated personal rows. |
| Forums | `/#forums` | Existing root forum index, with fragment opt-out from phone Home routing. `/forums/` currently canonicalizes back to `/`. |
| Ask AI | `/pages/ai/` | Existing public AI Chat wrapper; preserve its `/chatpage` application and `/chat.php` transport contract. |
| Inbox | `/conversations/` and `/account/alerts` | One phone inbox surface may expose Messages and Alerts; each retains native member authorization and unread counts. |
| Thread / reply | Existing canonical thread/post links | Preserve direct links, page links, anchors, native first-unread/latest routes, and browser Back. |
| Optional Unanswered | `/find-threads/unanswered` | Native recent zero-reply threads; guest access currently returns 403/login. It is not a public feed filter. |

Phone Home links go directly to `/feed/`. For a clean root or the existing root PWA launch, perform a client `location.replace('/feed/')` only after ordinary page/PWA bootstrap; `/#forums` explicitly opts out. Leave all other deep links, query-bearing functional routes, and fragments intact. Desktop and tablet `/` remain the forum index. Keep `indexRoute` and the manifest identity/start URL unchanged. This adds a navigation on a phone root landing and must be measured; token handoff completion must be proven before enabling it.

SocialFeed source: [controller](/web/public_html/src/addons/WindowsForum/SocialFeed/Pub/Controller/FeedController.php:246). Its `actionPost` at line 156 reroutes to native thread creation, retaining validation and moderation. `/feed/` page 1 is currently indexable; its personalized/filter pages and later pages emit `noindex`. Preserve these metadata decisions.

## Authentication, reading, composition, and revenue

- Keep XenForo browser sessions, CSRF, passkeys, 2FA, consent, and existing capsule hydration. Shared HTML must contain no personal messages, badges, drafts, or credentials. Render account state after the existing authenticated hydration and respect server permissions for every action.
- Preserve DigitalPoint's short-lived PWA launch token; never substitute session IDs or route away before handoff. See [manifest extension](/web/public_html/src/addons/DigitalPoint/PWA/XF/WebManifestRenderer.php:21).
- Connect compose/reply controls to existing XenForo/SocialFeed forms, attachment handling, captcha, flood control, PostGuard, and validation. A successful UI animation is not evidence of a saved post; show confirmation only after the native response and navigate to the returned canonical post.
- Retain native draft behavior initially. The current service worker queues failed `/draft` POSTs ([source](/web/public_html/service_worker.js:65)); do not promise reliable offline draft replay until tested. Distinguish “saved on this device,” “saved to your account,” and failed/pending states. Account changes must not expose another account's local draft or reading history.
- Adopt a compact thread-position/reply dock and first/unread/latest navigation. Preserve scroll position on Back and when content is prepended. Use XenForo's unread state for account-level catch-up; any additional local resume anchor must be account-scoped and described as device-local, without caching private post bodies.
- Keep existing `_ads` and SX execution bindings: style 50 inherits `_ads` from 40. Preserve contract 2, the three-second fail-open fallback, consent integration, preloads, and execute-once behavior. See [SX runbook](/web/ops/SX_RUNBOOK.md:135). The mobile shell must not duplicate ad requests or restart SX after superficial tab/sheet changes.
- Reserve safe areas and actual ad geometry. Verify anchor ads, consent panels, thread actions, and the keyboard can coexist without overlap, hidden close controls, or accidental taps. The old MobileUI forcibly repositions Google anchor elements; do not copy that behavior into the new shell without validation.
- Preserve existing PWA web push and offline fallback. A real TWA test must confirm asset-link verification, login, Back, external links, AI navigation, and push deep links. Keep same-origin navigation wherever existing routes permit; native package changes are outside this plan until the actual launcher project and signing scope are inspected.

## Forum Copilot lessons and ownership

Reference: [forumcopilot/xenforoapp](https://github.com/forumcopilot/xenforoapp/tree/b9ea7d6b3a041eba29842c985d9be7ffaf09264a), inspected at commit `b9ea7d6b3a041eba29842c985d9be7ffaf09264a`. It is a Flutter/GetX client with cookie-authenticated JSON calls to its own `forumcopilot.php` add-on, not a theme for the current PWA/TWA.

Borrow interaction concepts: retained filter/list state, prominent unread status, canonical sharing, a current/total post dock, anchored earlier/later loading, and a focused composer. Its server stores unread state through XenForo `ThreadRead`; its visible-post counter and prepend restoration are in-session, not proof of persistent pixel-level resume. Keep our current backend and web session architecture.

Source anchors within that revision: `lib/views/tabs/topic_list_tab.dart:363`, `lib/views/lists/posts_list.dart:590,655,1104,1244`, `lib/views/post_page.dart:77`, and `packages/xenforo_core/lib/src/network/xenforo_client.dart:8`. The repository and local SDK packages are MIT licensed; preserve the notice if substantial code is reused. This prototype uses original code and WindowsForum presentation; no Forum Copilot implementation or screenshot artwork was copied.

## Rollout gates and evidence still required

1. Keep the prototype separate. Implement production bindings behind a browser opt-in/rollout switch on style 50, with a tested kill switch restoring the existing presentation. Do not reactivate old MobileUI or flip the site index as part of rollout.
2. Validate the actual compiled style-50 output and existing inherited modifications. Use explicit cache invalidation through the site's documented layers for the eventual deployment; check both origin and public edge after invalidation. Interleave phone/desktop/tablet requests to the same URLs and show that cache contents and canonical URLs remain consistent.
3. Exercise 320–430px phones, landscape, iOS Safari/PWA, Android Chrome/PWA, the released TWA, accessibility text scaling, reduced motion, slow network, offline/reconnect, keyboard, and external links. Prove desktop/tablet screenshots and behavior remain unchanged, including narrow desktop and desktop installed PWA.
4. Validate guest/member/moderator transitions, login/2FA/passkeys/logout/session expiry, private content, Following/Saved empty states, native reply/thread creation, attachments, pending moderation, drafts, unread counts, first-unread, and account switching in an authorized controlled test context.
5. Record comparable baseline and rollout measurements for mobile layout shift/loading, navigation failures, SX outcomes/fallbacks, ad requests/viewability, and earnings by audience. Do not infer revenue causation from daily movement alone. Roll back for broken access/posting, desktop leakage, cache contamination, overlay obstruction, or duplicate/missing ad initialization.

**Not yet delivered by this prototype:** physical-device or released-TWA verification; production auth/permissions and backend linking; real posts, AI replies, notifications, drafts, synchronized read state, or revenue evidence. Simulated iPhone/Pixel interactions and build checks prove the design preview only. Production implementation requires these binding and rollout checks before public activation.
