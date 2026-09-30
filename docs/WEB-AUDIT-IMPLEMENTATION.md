# TheWay web audit implementation — September 30, 2026

Repository: the-way-blip/the-way-bible-app. Branch: `fix/web-audit`. Base: `1667d9937c1b7700c6264dc5d8e50e5fed367d98`.

Changes are local and have not been pushed or deployed. No production accounts, database schemas, stored study records, mailing lists, or App Store settings were changed. The changes include shared React components: the native Capacitor app currently loads `https://thewaybible.app`, so deploying the web changes can also affect the iOS app.

## What changed

- Canonical reader links use `?v=16`, while legacy `?verse=16` links still work. Explicit verse links take priority over saved scroll positions. Invalid and out-of-chapter anchors are ignored safely.
- Study words are semantic buttons with one word tab stop per verse. Left/Right and Home/End move between words; Enter/Space opens study. Mobile study is a labelled dialog with focus containment, Escape dismissal, and restoration to the launching control. Highlight colors expose names and selected state, with 44px targets.
- Fixed desktop Dictionary, People, and Library links incorrectly returning to the reader.
- Both signup forms request email/password with optional name. Phone/location collection was removed. Devotional email consent starts unchecked, uses consistent wording, and is separate from account creation. Terms/Privacy links and visible form labels are present. Email-confirmation fallback leads to sign-in with a confirmation message.
- The landing page offers direct guest reading with a smaller header and hero. Reader deep links no longer trigger the welcome tour. Guest access from signup opens the reader directly.
- Marketing receives only explicit devotional subscriptions. Client calls for prayer text, onboarding answers, and reading milestones were removed. The server rejects those legacy event types and forwards an allowlisted payload, preventing older clients from continuing those submissions. Existing CRM records were not deleted.
- Updated the privacy policy to distinguish device storage from network requests, disclose Google Analytics and legacy collection, describe optional marketing, and identify Pexels/Unsplash. Disabled Sentry's default PII collection and removed faith-stage/raw authentication-error text from analytics events. This is an implementation-aligned disclosure update, not a compliance certification.
- Corrected G25's punctuation-only definition and G3530's “anIsraelite” using the already-bundled Open Scriptures definitions. Fallbacks reject punctuation-only text. Empty translation arrays fall back to the available translation text.
- Public verse explanations identify TheWay as the provider, distinguish the note from the KJV, and offer a correction contact. This does not invent a human reviewer or imply scholarly validation.
- Reader code loads on demand. Promotional screenshots are excluded from service-worker precaching. Broad caching of authenticated Supabase HTTP responses was removed; activation deletes only the obsolete `supabase-api` cache, retaining offline Bible caches and IndexedDB study records.
- Added an initial HTML handler for public word-study metadata/content and legal/account metadata. Lexical pages retain the interactive React app after startup. Invalid word entries return 404; lowercase identifiers redirect to uppercase; login has noindex. Client navigation updates canonicals and sharing URLs. Public Bible SSR remains intact.
- Added defensive response headers, consistent PWA naming, an app-oriented install start page, orientation flexibility, and build identifiers in Settings/export metadata.

## Audit disposition

“Fixed” means implemented and verified to the extent described below, not deployed or certified across all devices.

| ID | Status | Implementation and remaining work |
|---|---|---|
| 01 | Fixed | `seo/render.js`, `Reader.jsx`, `verseLink.js`; canonical and legacy links target a valid verse. Authentication-return/range-selection expansion is not part of this fix. |
| 02 | Fixed | `VerseList.jsx`, `useMobileDialog.js`, `WordStudyPanel.jsx`; buttons, roving keyboard focus, dialog lifecycle. Real VoiceOver verification remains in the iOS gate. |
| 03 | Fixed | Policy corrects the guest-mode guarantee and names actual services; Sentry automatic PII disabled. Google Analytics remains enabled and disclosed; consent-policy changes need an owner decision based on intended markets. |
| 04 | Fixed | `Login.jsx`; optional name plus email/password. Existing profile records unchanged. |
| 05 | Fixed | Highlight names/state/targets, word-study close label, tour arrow labels. This is not a claim that every control in the entire app meets WCAG. |
| 06 | Fixed | Bundled G25 definition corrected; meaningful fallback added to lexical page/local enrichment. |
| 07 | Fixed | Both marketing checkboxes unchecked; consistent optional email wording. Actual sending cadence remains a mailing-service configuration. |
| 08 | Fixed | New location/phone collection removed; legacy collection disclosed; server marketing allowlist added. Previously shared CRM data requires a separate owner-directed retention/deletion review. |
| 09 | Fixed | Terms and Privacy linked near both signup submissions. |
| 10 | Fixed | Direct “Start reading free” CTA; smaller header/hero; guest signup exit enters reading. Desktop CTA verified within 1280×720 viewport. |
| 11 | Fixed | Tour removed from reader routes, retaining the existing introduction elsewhere. |
| 12 | Needs access | App Store screenshot selection/order requires App Store Connect and approved replacement screenshots. No listing changes made. |
| 13 | Fixed | Landing copy no longer describes audio and commentary as future features. |
| 14 | Needs owner decision | Provider attribution, separation from Scripture, correction link implemented. A named reviewer, review date, theological scope, and editorial approval process must come from the owner/editor; no fabricated credentials. |
| 15 | Fixed | Nicodemus spacing and empty translation-list rendering corrected. |
| 16 | Fixed / measured improvement | Reader splitting and smaller precache verified by production builds. No Core Web Vitals or device speed score claimed. |
| 17 | Fixed | Initial canonical/title/description for word/legal/login routes, lexical HTML, login noindex, client metadata updates. Legal full text remains client-rendered; root marketing still uses the existing client-rendered layout. Vercel preview packaging/routing must be checked before production promotion. |
| 18 | Needs access | Native universal-link associations and incoming-link behavior require a dedicated iOS pass and physical-device verification. No untested entitlements were changed. |
| 19 | Needs access | App Store accessibility disclosures require verified VoiceOver/Dynamic Type results and listing access. |
| 20 | Fixed for web | PWA branding, build labels, and photo-provider references aligned. Native listing/version policy remains an iOS release task. |
| Additional | Fixed | Desktop sidebar destination bug corrected. |
| Additional | Fixed | Private prayer/activity submissions to CRM removed and rejected server-side. |
| Additional | Fixed | Private HTTP cache disabled and obsolete cache cleanup added. Cross-account lifecycle verification remains a release gate. |

## Verification

Run from the repository: `npm ci`, `npm run build`, `npm test`, and `node seo/check.mjs`. The HTTP-handler integration test uses the built `dist/index.html`, so build before tests.

- Production build passes.
- Nine regression tests pass: verse parameter validity/backward compatibility; lexical fallback; shipped definitions; consent/field allowlist; client opt-in behavior; exact public verse CTA and 404; narrowly scoped cache migration; HTML escaping/metadata; app-page handler responses.
- Existing SEO check resolves all 4,095 references across 341 topics. Sample chapter, verse, range, aliases, 404s, and sitemap routes retain expected responses.
- Focused lint of new utilities, dialog hook, metadata hook, API renderer, study-word component, landing page, and marketing service passes.
- Whole-project baseline: 396 errors and 8 warnings before work. Final full run: 393 errors and 8 warnings; baseline comparison found no new diagnostics (three existing Node-global diagnostics removed). These pre-existing errors are not represented as a clean lint pass.
- Browser checks at 390×844: legacy/canonical John 3:16 appears in viewport; signup exposes only three identity/account inputs with email unchecked; keyboard activation opens word study; Escape restores the launching word; Shift+Tab stays in the dialog; one word tab stop per verse and arrow movement; corrected lexical content and labelled highlight actions; no horizontal overflow in the checked reader view.
- Desktop checks: correct sidebar destinations and landing reading CTA visible within 1280×720. Screenshots and observations are in the companion audit evidence folder.
- Authentication confirmation/reset delivery, signed-in cross-device sync, production CRM delivery, real account deletion, physical-device offline/update behavior, screen readers, and native background audio were not exercised. No test marketing emails were sent.

### Build comparison

Same local checkout/dependencies before and after changes:

| Asset measure | Baseline | Updated (approximate) |
|---|---:|---:|
| Main JavaScript, uncompressed | 417.85 kB | 326 kB |
| Main JavaScript, gzip | 121.54 kB | 99 kB |
| Service-worker precache | 4,325.65 KiB | 1,735 KiB |

These are build sizes, not end-user latency or Lighthouse scores. The original public audit measured a different deployed bundle, so its bytes should not be used as this branch's baseline.

## Before deployment

1. Run a Vercel preview build and verify `/word/G25`, `/word/G99999`, `/privacy`, `/terms`, and `/login` directly, including raw HTML. Confirm the app-page function contains the built HTML and lexical files. Asset inclusion follows the [Vercel function configuration documentation](https://vercel.com/docs/project-configuration/vercel-json).
2. In a designated test account, verify signup confirmation, password reset, sign-in, sync, export, and deletion. Exercise opted-in/out subscriptions with a staging webhook rather than a live mailing list. Legacy clients without the explicit subscription field will intentionally no longer enroll contacts.
3. Test an upgrade from the current production service worker: existing chapters/study records survive; `supabase-api` is removed; sign-out/account switch cannot reuse private HTTP responses. Unit tests cover the cleanup logic but do not replace this end-to-end check.
4. Perform the native checks in `IOS-AUDIT-ACCESS.md`, since the iOS shell points to the live web URL.
5. Owner/editor reviews the updated disclosures, actual email cadence, analytics consent expectations, legacy CRM retention, and editorial-review policy. No production cleanup is included in this branch.

Do not change App Store accessibility claims until the corresponding native capabilities are tested.
