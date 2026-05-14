# Reading-plan engine — scope & phasing

Updated: 2026-05-04

Decisions captured from the user:
- **Plan formats:** all four (Linear, Curated, Bible-in-a-Year multi-passage, Topical 30-day)
- **Catch-up:** Hybrid — track both today's plan-day AND next incomplete day; user picks
- **Today UI:** Home card + dedicated /plan route
- **Notifications:** Email via GHL workflow now; native push later

What already exists in the codebase:
- `src/data/readingPlanData.js` — 5 plans, day-by-day chapter assignments, `getTodaysReading()` helper
- `src/pages/ReadingPlan.jsx` — currently a "Coming soon" stub at `/plans`
- `profiles.reading_plan` — text column already storing the plan name from onboarding
- `profiles.notification_time` — column referenced in old migration scripts (need to verify it exists or add it)

---

## Phase 1 — Persistence + plan picker (~1 day)

**Schema (Supabase):**
```sql
CREATE TABLE public.user_reading_plans (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id    text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz,
  completed_days jsonb DEFAULT '[]'::jsonb,  -- array of 0-based day indices
  notify_at_local_time text,                  -- 'HH:MM'
  notify_timezone text,                       -- 'America/New_York'
  PRIMARY KEY (user_id, plan_id)
);
ALTER TABLE public.user_reading_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own plans" ON public.user_reading_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

**Code:**
- `src/services/readingPlanService.js` — enroll, unenroll, mark-day-complete, get-current-plan, with dual-write IndexedDB + Supabase
- New IndexedDB store `userPlans`
- Replace `ReadingPlan.jsx` stub with a real plan picker showing all PLANS, "Enrolled" badge on the active one, "Switch plan" confirm

**Test loop:** sign in → /plans → enroll → confirm row in Supabase

---

## Phase 2 — Today UI + catch-up (~1 day)

**Home card:**
- Top of `Home.jsx`, above the existing devotional/quote
- Shows: plan name, "Day N of M", today's passage refs (e.g. "John 1, Romans 1, Psalm 1")
- Two CTAs: **Start today's reading** and **Pick up where you left off** (if different from today)
- Hybrid logic:
  - `planDay = floor((now - started_at) / 1day)`
  - `nextIncompleteDay = first index 0..planDay+grace not in completed_days`
  - Show both labels if they diverge

**`/plans` detail page:**
- Calendar grid: each day green/empty/red (today behind = red)
- Tap a day → navigate to first chapter of that day
- Progress bar (% complete)
- "Switch plan" / "Restart" / "Unenroll" actions

**Reading completion → mark day:**
- Hook into `Reader.saveProgress`: if all of today's chapters are now in `completedChapters`, append `planDay` to `completed_days`
- Fire GHL `reading-milestone` events for `plan-day-complete:N`, `plan-25-percent`, `plan-50-percent`, `plan-100-percent`

**Test loop:** read a chapter → verify Home card updates and progress bar advances

---

## Phase 3 — Plan content expansion (~half day)

Add to `readingPlanData.js`:
- **Linear (already have whole-bible)** — also add: NT-90 (already), OT in a year (~3-4 ch/day), Psalms in 30 days
- **Curated** — already have Romans Deep Dive, Gospels, Psalms&Proverbs. Add: John 21-day, James 5-day, Sermon-on-the-Mount 7-day
- **Bible-in-a-year (multi-passage)** — M'Cheyne plan (4 readings/day), Chronological plan
- **Topical** — Faith (30-day), Hope (30-day), Forgiveness (30-day), Prayer (30-day) — these need handpicked verse refs, not just chapters. Topic-to-passage mapping is real curatorial work.

> **Note:** Topical plans are the hardest. They need handpicked passage lists per day, not just chapter sequences. We'll need to either author this or pull from a public-domain source (e.g. Robert Roberts' "Daily Light on the Daily Path", which is PD).

---

## Phase 4 — Daily-reading email via GHL (~1 day)

**Architecture:**
1. Vercel Cron job at `/api/cron/daily-readings` runs every hour
2. Joins `user_reading_plans` × `profiles` → finds users whose `notify_at_local_time` matches the current hour in their `notify_timezone`
3. For each user: compute today's reading from plan data
4. POST to `/api/ghl` with payload:
   ```json
   {
     "type": "daily-reading",
     "email": "...",
     "first_name": "...",
     "tags": ["scripture-app-user", "daily-reading"],
     "plan_name": "Bible in a Year",
     "day": 47,
     "total_days": 365,
     "readings_text": "Genesis 47, Mark 11, Job 13",
     "first_book": "Genesis",
     "first_chapter": 47,
     "deep_link": "https://thewaybible.app/read/Genesis/47"
   }
   ```
5. GHL workflow on `type=daily-reading` sends a templated email with the deep link

**Setup needed:**
- Capture user's timezone during onboarding (`Intl.DateTimeFormat().resolvedOptions().timeZone`)
- Add `notify_at_local_time` picker to onboarding step or settings
- Vercel cron config in `vercel.json`
- One new GHL workflow for `type=daily-reading`

**Test loop:** set notify time to 5 minutes from now → wait → verify GHL fires and email arrives

---

## Phase 5 — Native push (later)

Out of scope for this build. Would use:
- Web: `Notification` API + service worker + Firebase Cloud Messaging or OneSignal
- iOS: `@capacitor/push-notifications` + APNs

---

## Open questions for the user

1. **Topical plan content** — author it ourselves, or import a public-domain source? (Affects timeline of Phase 3)
2. **Plan switching** — when a user switches plans mid-stream, do we keep the old enrollment as "abandoned" or delete it? (Recommended: keep, mark `completed_at` as null + add `abandoned_at`)
3. **Multiple concurrent plans** — can a user enroll in 2 plans at once (e.g. a topical + a linear)? Schema supports it; UI does not yet.
4. **First day = today vs. tomorrow?** — When user enrolls, does day 1 = today or tomorrow morning?
