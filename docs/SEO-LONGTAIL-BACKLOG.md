# Longtail backlog

Where the next pages come from, and why. Written 12 October 2026 off 28 days of
Search Console (13 Sept – 10 Oct): **328 clicks, 120K impressions, average
position 32.8**, against 136 / 80.1K / 38.5 on 30 September.

Re-derive it the same way: Search Console → Performance → Queries, rows per page
250, sorted by impressions. Position is the column that matters. Impressions say
how many people searched something Google thinks we are relevant to; position
says whether they could find us. A query with impressions and a position in the
thirties is a page that exists and loses. A query with impressions and a position
under twelve is a page that nearly wins.

## What the data settled

**Specific beats general, by a wide margin.** The split first measured on
30 September has held:

| | median position |
|---|---|
| named entities (people, titles of God, events) | ~12 |
| generic themes ("hope", "forgiveness", "wisdom") | ~77 |

Every topic-page click in the period came from the named group. `bible verses
about wisdom` sits at 85.2, `bible verses about prayer` at 76.5, `bible verses
about marriage` at 92.2. Those queries belong to sites with twenty years of
links and are not winnable by writing another page. Stop proposing them.

**Inventory nobody else serves well is where the wins are.** /bible-names and
/strongs both come from this. The question to ask of any candidate is not "do
people search it" but "is there a comprehensive version of this that we could
own". 14,197 Strong's entries, each with its verses, is a thing almost nobody
has built properly. One more page about hope is not.

**A page must promise what the searcher asked for.** `the-ten-commandments`
ranked 23–78 while headed "12 Bible Verses About the Ten Commandments". The
verses were already right — Exodus 20:3–17 was quoted in full. What was missing
was the list, numbered, and a title saying so. Compare `list of 12 disciples of
jesus bible verse kjv` at position **5.0**, our best on the board, which ranks
only because Matthew 10:2–4 happens to name all twelve inside the quoted text.

### What did not work, so nobody repeats it

**Adding original writing to a page already at position 9 did not move it.**
`john 14:2-3 kjv` (64 impressions, 8.3), `1 john 1:7-9 kjv` (60, 8.6),
`matthew 17:1-8 kjv` (47, 10.2) and `romans 3:10-12 kjv` (34, 10.2) all have
entries in seo/meanings.js already and all draw zero clicks. There are dozens
more range queries in the same band. Writing commentary for all of them is
weeks of work against a wall that is made of domain authority, not content.
Verse and range pages are a floor to hold, not a lever to pull.

## The backlog

Ranked by impressions already earned × the gap to page one × how much of it we
can build without inventing facts.

### 1. Archaic KJV words — SHIPPED 12 Oct, /bible-words

`circumspectly bible definition` sits at **6.7**. `molochie` at 10.0. `what is
the most high` at 44.8. People hit a word in the King James text they do not
know and search it with "bible" attached, and the pages that answer are thin.

Strong's covers the Hebrew and the Greek. This covers the English: *concupiscence,
propitiation, longsuffering, peradventure, wot, wist, charity, quick* (meaning
living), *conversation* (meaning conduct), *prevent* (meaning precede), *let*
(meaning hinder), *meat* (meaning food). The list is derivable — rank every word
in kjv.json by frequency against modern English and take what has drifted. Each
page gets the modern sense, why the 1611 word differs, and every verse it stands
in, which we can already generate.

Nothing else on this list is as under-served.

### 2. Book statistics — SHIPPED 12 Oct, /bible-statistics and all 66 book pages

`how long is ephesians` is at **5.9** and `how long is luke in the bible` at
8.0, both answered by a single line in the book-page FAQ. Meanwhile the bare
book names draw ~400 impressions at positions 30–75: *philippians* 58 @ 42.3,
*ephesians* 51 @ 43.8, *hebrews* 38 @ 41.0, *luke* 35 @ 30.9, *deuteronomy*
35 @ 46.6, *ecclesiastes* 23 @ 62.7, *2 kings* 20 @ 53.9, *hosea* 16 @ 74.9.

The head term is not winnable. The questions around it are, and there are 66
books × about seven question shapes: how long, how many chapters, how many
verses, who wrote it, when, what is it about, how long does it take to read.
All computable from kjv.json. Add word count, reading time, longest and
shortest chapter, and where the book sits among the 66.

### 3. More named entities — the proven vein

The 51 shipped on 30 September are now the site's top pages. `el-roi` is at 7.3
and `the-fiery-furnace` at 10.7 within two weeks. Keep going, but only where
there is a named thing.

Visible demand with no page or a weak one: *jehovah rohi* (11 @ 6.8),
*yahweh sabaoth* (10 @ 8.7), *lamb of god* (10 @ 12.7), *adonai* (10 @ 8.0),
*elohim* (11 @ 9.5), *boaz* (14 @ 5.9), *naomi* (13 @ 8.3), *hezekiah*
(14 @ 9.9), *josiah* (9 @ 9.0), *elisha* (12 @ 9.1), *mary magdalene*
(12 @ 10.1), *the plagues of egypt*, *the rich young ruler*, *the last supper*,
*palm sunday*, *shadrach meshach and abednego*, *jacob's ladder*, *manna*,
*the feeding of the five thousand*.

### 4. Reference parsing for odd formats — small and cheap

`147/20` drew 24 impressions at **8.6**. `106/12` 20 at 19.8. Also `62 4`,
`22 8`, `10/12/16`, `51/8`, `64/10`, `13/16`. People type references in
whatever shape is in front of them. A parser that reads `147/20` as Psalm
147:20 and redirects costs an afternoon.

### 5. "kjv" is the suffix, everywhere

Not a page type, a reminder. A large share of every cluster above ends in
"kjv" — people searching the King James text specifically. Titles already carry
(KJV) and should keep doing so. It is also why we can compete at all: the KJV
is public domain and we quote it in full where sites built on modern
translations cannot.

## Shipped from this round (12 October)

- **/strongs** — 14,197 Hebrew and Greek entries, each with the lexical entry,
  every KJV rendering with a count, and up to 40 verses quoted in full. Built
  off `h5239`, `h5971`, `h6777`, `h7776` and `h444 meaning`, which were all
  ranking 5–36 on a page that was the app shell with a title tag.
- **Seven list pages** rebuilt to lead with the list: the ten commandments, the
  fruit of the Spirit, the twelve disciples, the armor of God, the beatitudes,
  the Lord's prayer, the great commission.
- **/bible-words** — 100 King James words with their meaning, forms, the Hebrew
  or Greek behind them and every verse. Ten entries that kept both senses carry
  a hand-picked verse list, because "let" appears 1,511 times and means hinder
  in four of them.
- **/king-james-bible** — how the translation was made, for "who wrote the king
  james bible" and its neighbours.
- **/bible-statistics** plus stats and five new FAQs on all 66 book pages —
  chapters, verses, words, reading time, longest and shortest chapter, and where
  each book sits among the 66.
- **The daily-verse invitation** on every indexable page, posting to the existing
  GoHighLevel endpoint, with /api/daily-verse pushing each morning's verse into
  GHL custom values on a 05:00 UTC cron. Needs CRON_SECRET set and the GHL
  workflow built before it sends anything.

### Next, in order

1. **More named entities** — the proven vein, listed above under heading 3.
2. **Reference parsing for odd formats** — `147/20` at position 8.6.
3. **Measure before building more.** Everything above shipped on one day and
   Search Console takes about two weeks to report. Check whether /strongs and
   /bible-words get crawled, whether the list-page rewrites moved the ten
   commandments and the fruit of the Spirit off position 50, and whether the
   invitation converts, before picking the next batch.

## A note on new routes

Three files have to agree or a route 404s in browsers while returning 200 to
curl: the `vercel.json` rewrites, the SPA catch-all lookahead in the same file,
and the service worker in `vite.config.js`. The third was missed for
/bible-names in September and again for /strongs in October. The service worker
now decides by allowlist instead, so new SEO routes are safe by default — but
check all three anyway.
