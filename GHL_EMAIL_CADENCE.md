# GHL Welcome Email Cadence — TheWay Bible App

Trigger: contact created with tag `scripture-app-user`
Send from: `TheWay Bible App <hello@thewaybible.app>` (or wherever your verified Resend sender lives)
Subject line tip: keep it personal — these convert ~25% better than feature-headlines

---

## Email 1 — Welcome (send immediately, 0 delay)

**Subject:** Welcome to TheWay, {{first_name}} 🙏

**Preheader:** Glad you're here. Here's where to start.

**Body:**

Hi {{first_name}},

Welcome to TheWay Bible App. I built this because I wanted one place to read Scripture, study deeply, memorize verses, and pray — without the noise of ads, paywalls, and clutter that gets between you and the Word.

I'm so glad you're here.

Over the next couple weeks, I'll send you a handful of short emails showing you what's possible inside the app. Nothing salesy — just a tour of the tools so you get full value.

For today, here's the simplest place to start:

→ [Open the app and read Psalm 1](https://thewaybible.app/read/Psalms/1)

It's a perfect 6-verse psalm — start small, build the habit.

Walking the same road,
Dillon
TheWay Bible App
[thewaybible.app](https://thewaybible.app)

---

## Email 2 — Reading & navigating Scripture (send 1 day later)

**Subject:** The simplest way to read your Bible (no plan required)

**Preheader:** Open any chapter, anywhere. Pick up where you left off.

**Body:**

Hi {{first_name}},

One thing I love about TheWay: you don't need a rigid plan to read consistently.

Open the app and you can:

📖 **Open any chapter, anywhere** — Genesis 1, Psalms 23, John 14. Just tap and read.

⏭️ **Pick up where you left off** — the app remembers your last chapter automatically.

🔥 **Build a daily streak** — small consistent reading shapes a life. The streak gently nudges, never guilts.

→ [Open the app and try a chapter](https://thewaybible.app)

Tomorrow I'll show you something most apps don't offer: how to go DEEP on any word in Scripture.

— Dillon

---

## Email 3 — Study Mode (Greek + Hebrew word study) (send 3 days later)

**Subject:** What does this word *actually* mean in the original?

**Preheader:** Tap any word for Greek/Hebrew, cross-references, and commentary.

**Body:**

Hi {{first_name}},

Here's a feature that changes how you read Scripture:

**Study Mode.** Open any chapter and tap the Study toggle. Now every word is tappable. Each tap reveals:

🔍 The **Greek or Hebrew** word behind it — with Strong's number, definition, and pronunciation

📚 **Cross-references** — every other place that word is used in the Bible

💡 **Historical context** — where helpful

Most people never get to see the original-language layer of Scripture. With TheWay, it's two taps away.

Try this: open John 3:16 and tap "loved." The Greek word *agapao* is one of the most foundational ideas in the New Testament — and the app shows you exactly how it's used elsewhere.

→ [Try Study Mode in John 3](https://thewaybible.app/read/John/3)

— Dillon

---

## Email 4 — Memory Verses & spaced repetition (send 6 days later)

**Subject:** Verses that actually *stick* (the science behind it)

**Preheader:** Memorize Scripture using the same method language-learning apps use.

**Body:**

Hi {{first_name}},

Memorizing Scripture is one of the most overlooked disciplines in Christian life. The Psalmist said, *"Thy word have I hid in mine heart, that I might not sin against thee"* (Psalm 119:11).

But let's be honest — most of us are bad at it.

**TheWay uses spaced repetition** — the same technique behind Duolingo and Anki — to help verses move from short-term recall into long-term memory.

The system is simple:
1. Save a verse you want to memorize
2. Practice it for a few seconds each day
3. The app shows you the ones you're forgetting more often, and the ones you know less often
4. Within weeks, you'll have a real verse library in your head

→ [Start your first memory verse](https://thewaybible.app/memory)

Pro tip: start with three verses you've always wanted to know by heart — not thirty. Small wins build the habit.

— Dillon

---

## Email 5 — Topics, Journal & Prayer (send 10 days later)

**Subject:** The full toolkit — what's left to discover

**Preheader:** Topics, journaling, and prayer tracking — built into one place.

**Body:**

Hi {{first_name}},

Three more tools to know about — these are the ones that bring it all together:

📑 **Topics** — Browse Scripture by theme. Faith, prayer, suffering, hope, forgiveness. Tap a topic and see every relevant verse. One tap to highlight every verse in a topic in your reader.

✍️ **Journal** — Record what God is showing you. Tied to specific verses, searchable, yours forever. Most journals get lost in a drawer — yours lives with the Word it came from.

🙏 **Prayer list** — Track requests. Mark them answered. Over time, you'll see God's faithfulness on a single page.

These three are where the app stops being a Bible reader and starts being a spiritual companion.

→ [Open TheWay](https://thewaybible.app)

If there's anything you want to see added — a feature, a topic, a translation — just reply to this email. I read every one.

Walking the same road,
Dillon
[thewaybible.app](https://thewaybible.app)

---

## Optional Email 6 — Re-engagement nudge (send 14 days later, only if no recent login)

**Subject:** {{first_name}}, want to pick up where you left off?

**Body:**

Hi {{first_name}},

Just a gentle nudge — you signed up a couple weeks back, and I noticed you haven't opened the app in a few days.

No pressure at all. But I wanted to leave you with this:

> *"Thy word is a lamp unto my feet, and a light unto my path."* — Psalm 119:105

Five minutes in Scripture today is better than perfect intentions tomorrow.

→ [Open TheWay](https://thewaybible.app)

Praying for you,
Dillon

---

## Setting up the workflow in GHL

1. Go to your GHL location → **Automation** → **Workflows** → **New Workflow**
2. Trigger: **Contact Tag Added** → tag = `scripture-app-user`
3. Add 5 (or 6) actions, each:
   - **Action:** Send Email
   - **Wait** before next action (0 days / 1 day / 3 days / 6 days / 10 days / 14 days)
   - **Email**: paste subject + preheader + body from above
4. Use the merge field `{{contact.first_name}}` so it auto-fills
5. **Important:** set the "From" address to your verified Resend / GHL sender (e.g., `hello@thewaybible.app`)
6. Turn the workflow ON

Test with a fresh email signup on the live site — you should get email 1 within a few minutes.
