# The Way — Bible App

React + Vite app (Capacitor for iOS). `npm run dev` to start, `npm run build` to build,
`npm run ios` to build and open in Xcode.

## 3D Biblical Atlas

Place names in the passage you're reading are detected and linked. Tapping one opens a
panel with a 3D satellite terrain map of that location, a note on why it matters
biblically, the verses in the chapter that name it, and the other places the chapter
travels through. A pin button in the reader header opens the same panel for the
chapter's most significant place, or press <kbd>m</kbd>.

### Add your Mapbox token

The map needs a free Mapbox access token — the free tier is far more than enough for
this use case.

1. Create an account at [mapbox.com](https://account.mapbox.com/auth/signup/).
2. Copy your **default public token** (it starts with `pk.`) from
   [Access tokens](https://account.mapbox.com/access-tokens/).
3. Add it to `.env.local` in the project root:

   ```
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token_here
   ```

4. Restart the dev server.

Without a token the feature still works — the panel opens with the place notes, verse
references and coordinates, and shows a prompt where the map would be. Nothing else in
the reader is affected.

`vite.config.js` declares `NEXT_PUBLIC_` as an accepted env prefix alongside Vite's own
`VITE_`, so either `NEXT_PUBLIC_MAPBOX_TOKEN` or `VITE_MAPBOX_TOKEN` works. Both
prefixes are compiled into the client bundle, so only ever put a **public** token there.

For a deployed build, add the same variable to your Vercel project's environment
variables. Consider restricting the token to your domain in the Mapbox dashboard
(Access tokens → your token → URL restrictions).

### Where the data comes from

Coordinates come from the [OpenBible.info Bible geocoding
dataset](https://www.openbible.info/geo/) (CC BY 4.0), which maps ~1,230 biblical
places to modern coordinates along with the verses that name each one. The raw file is
vendored at `scripts/data/openbible-merged.txt` and compiled into
`src/data/biblePlaces.json` at build time.

The "why this place matters" notes are hand-written in
`src/data/biblePlaceNotes.js` — 183 of the most significant places have a curated note;
the rest fall back to a note generated from the dataset (mention count, first
reference, modern name).

To regenerate the bundled dataset:

```bash
node scripts/build-bible-places.mjs
```

Add `--fetch` to re-download the latest data from openbible.info first. The script warns
if a curated note's key no longer matches any place upstream.

Attribution to OpenBible.info and Mapbox appears in the panel footer — the dataset's CC
BY licence and Mapbox's terms both require it, so don't remove it.

### How detection works

Two lookups run together, in `src/services/biblePlaces.js`:

1. **By verse reference.** The dataset knows which verses name each place, so the
   chapter's place list is exact and works regardless of how a translation spells a
   name.
2. **By text match**, but only against that chapter's candidates. Longest names win
   (so "Caesarea Philippi" beats "Caesarea"), and `ALIASES` in the build script covers
   KJV spellings the ESV-based dataset doesn't use — Pergamos/Pergamum,
   Zidon/Sidon, Kirjath-jearim/Kiriath-jearim, Calvary/Golgotha, and so on.

Because candidates are restricted per chapter, a false positive would need the word to
both appear in the text and be tied to that chapter by OpenBible.

### Bundle cost

`mapbox-gl` (~500 KB gzipped) and the places dataset (~63 KB gzipped) are separate
chunks, loaded on demand and excluded from the service worker precache — opening the
reader doesn't pay for either. Map tiles are deliberately **not** added to the service
worker's runtime cache: Mapbox's terms don't permit storing their tiles for offline
use.

---

## React + Vite

This project uses [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react),
which uses [Oxc](https://oxc.rs) for Fast Refresh.

The React Compiler is not enabled because of its impact on dev & build performance. To
add it, see [this documentation](https://react.dev/learn/react-compiler/installation).
