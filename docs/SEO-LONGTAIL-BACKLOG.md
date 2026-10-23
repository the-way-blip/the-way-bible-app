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

## Measured — 28 days to Oct 17, 2026

The previous section said to measure before building more. This is that.

| | 13 Sept – 10 Oct | 20 Sept – 17 Oct |
|---|---|---|
| Clicks | 328 | **427** |
| Impressions | 120K | 130K |
| Average position | 32.8 | **30.2** |

Nine of the site's ten best pages are now the named entities shipped on Sept 30:
god-most-high (13 clicks / 302 impressions), jehovah-nissi (12/277), el-roi
(11/208), jehovah-shalom (9/391), king-of-kings (7/485), spiritual-dryness
(7/264), jehovah-sabaoth (7/212), el-shaddai (6/514), i-am (4/261). The tenth is
the home page. El-roi went from nothing to the site's third-best page in three
weeks.

The generic themes have not moved at all. "Hope" and "forgiveness" are still on
page 8, exactly where they were. The split the fourth wave was built on holds,
and it is not narrowing: specific names win, themes lose, and no amount of
better writing on a theme page changes that, because those queries belong to
sites with twenty years of links.

So the strategy is settled. Named entities, and only named entities, until the
data says otherwise.

### Shipped Oct 20

**Aliases on the page.** Every topic already carried `aliases` — the other
things people type for it — and they were read only by the site-search matcher.
They appeared nowhere in any page's text, so no page could rank for them.
"Palm sunday" was nowhere on the triumphal entry page. "The plagues of egypt"
was nowhere on the ten plagues. "Shadrach meshach and abednego" was nowhere on
the fiery furnace. All three sat in this document as unserved demand that
already had a page. They now render as an "Also called" line and as
`alternateName` in the CollectionPage JSON-LD: 348 of 399 topic pages gained
one, and 919 phrases that were data-only became text. No new pages, no new
prose. This was the cheapest thing on the list and it had been sitting there
since the aliases were first written.

**44 new named-entity pages**, because the fourth wave had consumed almost the
whole candidate list above. Nineteen parables individually — there was one page
for "The Parables of Jesus" and nothing for "the parable of the sower", which is
the actual query. Eleven prophetic and Revelation entities, none of them served:
the four horsemen, armageddon, the mark of the beast, the great white throne,
the book of life, the tree of life, the antichrist, the seven churches, the two
witnesses, the new jerusalem, the valley of dry bones. Fourteen named events and
places: the last supper, jacob's ladder, manna, the rich young ruler, sodom and
gomorrah, the red sea, sinai, the upper room, bethesda, the passover, the day of
atonement, the tabernacle, the mercy seat, the veil.

Topics 399 → 443. All 5,284 references resolve.

### Next, in order

1. **Reference parsing for odd formats** — `147/20` at position 8.6, `106/12` at
   19.8. Still unbuilt, still cheap, and the only non-content item left.
2. **Promote the strongest aliases to their own pages.** The "Also called" line
   lets a page rank for a phrase; a page of its own ranks better. Once this wave
   reports, look at which alias phrases are drawing impressions onto a host page
   and give those their own entry. This is how to find the next wave's
   candidates without guessing.
3. **The named-entity candidates still unbuilt**, so the next session does not
   have to derive them again. People: Rebekah, Esau, Absalom, Bathsheba,
   Nebuchadnezzar, Belshazzar, Methuselah, Balaam, Mephibosheth, Joseph of
   Arimathaea, Jephthah, Korah, Eli, Jesse, Joab, Ahab, Caiaphas, Herod, Simon
   of Cyrene, Silas, Titus, and the ten minor prophets as people (Hosea, Joel,
   Amos, Obadiah, Micah, Nahum, Habakkuk, Zephaniah, Haggai, Zechariah,
   Malachi). Titles: the Son of Man, the Messiah, the Redeemer, the Bridegroom,
   the Rose of Sharon, Wonderful Counsellor, the Root of Jesse, the Only
   Begotten Son, the Sun of Righteousness, El Olam, Jehovah Mekoddishkem, the
   Advocate, the Mediator, the Potter.
4. **Measure this wave on or after Nov 3.** Two weeks for Search Console to
   report. The question is whether the alias line moved the host pages, which is
   a cleaner experiment than usual: 348 pages changed in one way, on one day,
   with no other edits.

Still unverified from the October wave: whether Bing has indexed anything, and
whether the daily-verse invitation converts.

## The snippet problem — Oct 23, 2026

Sorting 28 days of queries by impressions instead of clicks shows something the
click-sorted view hides. The ten biggest queries are not failing to rank:

| query | impressions | position | clicks |
|---|---|---|---|
| jonah and the whale bible verse kjv | 160 | 8.2 | 2 |
| david and goliath bible verse | 139 | 11.6 | 0 |
| prodigal son kjv | 125 | 9.9 | 0 |
| psalm 121 kjv | 116 | 22.0 | 0 |
| david and goliath bible verse kjv | 100 | 8.4 | 1 |
| john 1:10-11 | 99 | 9.7 | 0 |
| king of kings bible verse | 95 | 9.8 | 0 |
| proverbs 3 5-6 | 88 | 40.1 | 0 |
| ephesians | 86 | 40.3 | 0 |
| isaiah 41 10 | 83 | 34.9 | 1 |

Six of them sit at position 8 to 12 and take almost no clicks. We have a page
for every one.

Searching the Jonah query explains it. Every competing result — Bible Gateway,
King James Bible Online, Bible Hub, Bible.com — shows Jonah 1:17 in its snippet:
*now the LORD had prepared a great fish*. Ours showed Jonah 2:9, *I cried by
reason of mine affliction*. Google took the snippet from the middle of the page
because the page opens on Jonah 1:1, the call to Nineveh, and the meta
description listed the first three verses in canonical order. We were ranking on
page one and showing the wrong verse.

It is structural, not a one-off. Topic pages list verses canonically, so the
defining verse is buried on every story page: David and Goliath opened on
Goliath's height rather than *thou comest to me with a sword*; the prodigal son
opened on the inheritance rather than *when he was yet a great way off*; king of
kings opened on 1 Chronicles rather than the vesture and the thigh.

Fixed by giving a topic an optional `lead` reference. It renders in a featured
block above the verse list, goes first in the meta description, and becomes the
share card. Set on the four topics above; the field is there for any other topic
the data points at.

Also wrote the eight missing meanings behind these queries — Jonah 1:17,
1 Samuel 17:45, Luke 15:20, Revelation 19:16, Proverbs 3:5, John 1:10, John 1:11
and Psalm 121:1. The meanings are the only original writing on a verse page and
the part an assistant quotes, and the most-searched verses on the site had none.

Still open from this table: the verse, chapter and book pages at position 22 to
40 (psalm 121, proverbs 3:5-6, isaiah 41:10, ephesians). Those are a ranking
problem rather than a snippet problem and need separate work.

## A note on new routes

Three files have to agree or a route 404s in browsers while returning 200 to
curl: the `vercel.json` rewrites, the SPA catch-all lookahead in the same file,
and the service worker in `vite.config.js`. The third was missed for
/bible-names in September and again for /strongs in October. The service worker
now decides by allowlist instead, so new SEO routes are safe by default — but
check all three anyway.
