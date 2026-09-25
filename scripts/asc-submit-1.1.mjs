// Creates TheWay 1.1 in App Store Connect with the ASO listing, attaches the build, submits for review.
//   node scripts/asc-submit-1.1.mjs [--submit]
import { asc, APP_ID } from "./asc.mjs";
const VERSION = "1.1", BUILD = "9", SUBMIT = process.argv.includes("--submit");

const NAME = "TheWay Bible - KJV Study";
const SUBTITLE = "Scripture Study & Devotional";
const KEYWORDS = "king james,audio,commentary,reading plan,dictionary,memorize,verse,christian,prayer,journal,strongs";
const PROMO = "New: the whole KJV read aloud with verse-by-verse follow-along, 20 classic commentaries, a Bible dictionary, daily devotionals and a library of Christian classics.";
const WHATS_NEW = `• Listen to the whole King James Bible, human-narrated, with the verse being read highlighted as you follow along
• 20 commentaries including Matthew Henry, Spurgeon's Treasury of David, Gill, Keil & Delitzsch, Barnes and Calvin — now on iPhone too
• Bible Dictionary with Easton, Smith, ISBE, Nave's and Torrey's
• Daily devotionals: Spurgeon's Morning and Evening and Daily Light
• A Library of confessions and Christian classics
• People of the Bible and a Bible Timeline
• Historic English Bibles: Geneva, Tyndale, Wycliffe, Coverdale, Bishops' and more
• Deeper Greek and Hebrew definitions
• New search that understands references, topics and questions
• Fixes: study text punctuation, and notes, highlights and prayers now sync reliably between devices`;
const DESCRIPTION = `TheWay is a complete King James Bible study app — read, listen, study and memorize Scripture, all in one place and free.

LISTEN TO THE BIBLE
Hear the whole KJV read aloud by a human narrator. The verse being read is highlighted so you can follow along, it plays straight on into the next chapter, and you can start from any verse.

STUDY THE ORIGINAL LANGUAGES
Tap any word to see the Greek or Hebrew behind it: Strong's definitions, transliteration, pronunciation and usage, plus the Abbott-Smith Greek and Brown-Driver-Briggs Hebrew lexicons.

20 CLASSIC COMMENTARIES
Matthew Henry, Spurgeon's Treasury of David, John Gill, Keil & Delitzsch, Barnes, Calvin, Wesley, Adam Clarke, Jamieson-Fausset-Brown, the Geneva notes, Scofield and more — focused on the exact verse you tap.

BIBLE DICTIONARY & PEOPLE
Look up any person, place or topic in Easton's, Smith's, the ISBE, Nave's Topical Bible and Torrey's. Explore 3,000 people of the Bible — family, key passages and events — and a timeline from Creation to the early church.

DAILY DEVOTIONALS & LIBRARY
Spurgeon's Morning and Evening and Daily Light for every day of the year, plus a library of confessions of faith and Christian classics: Pilgrim's Progress, Ryle, Owen, Edwards, Bounds, Calvin's Institutes and Josephus.

HISTORIC ENGLISH BIBLES
Compare the KJV with the Bibles that came before it — Wycliffe, Tyndale, Coverdale, Matthew's, the Great Bible, Geneva and the Bishops' Bible — along with modern translations.

READING PLANS & MEMORY VERSES
Follow a reading plan, keep a daily streak, and memorize Scripture with spaced repetition and five practice modes.

HIGHLIGHT, NOTE, JOURNAL & PRAY
Highlight in four colors, add notes to any verse, keep a journal linked to passages, and track prayer requests and answered prayers.

SEARCH THAT UNDERSTANDS YOU
Search by reference, word, phrase, topic or question — "John 3:16", "fear not", or "what does the Bible say about anxiety".

SYNC ACROSS DEVICES
Create a free account to keep your highlights, notes, memory verses, journal, prayers and reading progress in sync on your phone, tablet and computer.

Read the Bible. Follow Jesus.`;

if (KEYWORDS.length > 100 || PROMO.length > 170 || NAME.length > 30 || SUBTITLE.length > 30 || WHATS_NEW.length > 4000 || DESCRIPTION.length > 4000)
  throw new Error(`length limits: keywords ${KEYWORDS.length}, promo ${PROMO.length}, name ${NAME.length}, subtitle ${SUBTITLE.length}, desc ${DESCRIPTION.length}`);

// 1. Build
const builds = await asc(`/v1/builds?filter[app]=${APP_ID}&filter[version]=${BUILD}&filter[preReleaseVersion.version]=${VERSION}`);
const build = builds.data[0];
if (!build || build.attributes.processingState !== "VALID") throw new Error(`build ${VERSION} (${BUILD}) not ready: ${build?.attributes.processingState}`);
console.log("build", build.id, build.attributes.processingState);

// 2. Version (create if missing)
const versions = await asc(`/v1/apps/${APP_ID}/appStoreVersions?filter[versionString]=${VERSION}`);
let version = versions.data[0];
if (!version) {
  version = (await asc("/v1/appStoreVersions", "POST", { data: { type: "appStoreVersions", attributes: { platform: "IOS", versionString: VERSION, releaseType: "AFTER_APPROVAL" }, relationships: { app: { data: { type: "apps", id: APP_ID } } } } })).data;
  console.log("created version", version.id);
} else console.log("version exists", version.id, version.attributes.appStoreState);

// 3. Name + subtitle on the editable app info
const infos = await asc(`/v1/apps/${APP_ID}/appInfos`);
const editable = infos.data.find((i) => i.attributes.appStoreState !== "READY_FOR_SALE") || infos.data[0];
const infoLocs = await asc(`/v1/appInfos/${editable.id}/appInfoLocalizations`);
const infoEn = infoLocs.data.find((l) => l.attributes.locale.startsWith("en"));
await asc(`/v1/appInfoLocalizations/${infoEn.id}`, "PATCH", { data: { type: "appInfoLocalizations", id: infoEn.id, attributes: { name: NAME, subtitle: SUBTITLE } } });
console.log("name/subtitle set on appInfo", editable.attributes.appStoreState);

// 4. Version listing
const locs = await asc(`/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations`);
const en = locs.data.find((l) => l.attributes.locale.startsWith("en"));
await asc(`/v1/appStoreVersionLocalizations/${en.id}`, "PATCH", { data: { type: "appStoreVersionLocalizations", id: en.id, attributes: {
  description: DESCRIPTION, keywords: KEYWORDS, promotionalText: PROMO, whatsNew: WHATS_NEW, supportUrl: "https://thewaybible.app", marketingUrl: "https://thewaybible.app" } } });
console.log("listing updated");

// 5. Attach build
await asc(`/v1/appStoreVersions/${version.id}/relationships/build`, "PATCH", { data: { type: "builds", id: build.id } });
console.log("build attached");

// 6. Review details carried over?
try {
  const rd = await asc(`/v1/appStoreVersions/${version.id}/appStoreReviewDetail`);
  console.log("review notes:", (rd.data?.attributes.notes || "").length, "chars; sign-in required:", rd.data?.attributes.demoAccountRequired);
} catch (e) { console.log("review detail:", e.message.slice(0, 120)); }

if (!SUBMIT) { console.log("\nDry run complete — rerun with --submit to send for review."); process.exit(0); }

// 7. Submit
const sub = (await asc("/v1/reviewSubmissions", "POST", { data: { type: "reviewSubmissions", attributes: { platform: "IOS" }, relationships: { app: { data: { type: "apps", id: APP_ID } } } } })).data;
await asc("/v1/reviewSubmissionItems", "POST", { data: { type: "reviewSubmissionItems", relationships: { reviewSubmission: { data: { type: "reviewSubmissions", id: sub.id } }, appStoreVersion: { data: { type: "appStoreVersions", id: version.id } } } } });
const done = await asc(`/v1/reviewSubmissions/${sub.id}`, "PATCH", { data: { type: "reviewSubmissions", id: sub.id, attributes: { submitted: true } } });
console.log("SUBMITTED:", done.data.attributes.state);
