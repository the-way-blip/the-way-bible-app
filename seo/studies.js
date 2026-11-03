/**
 * seo/studies.js — the study article on bigrapids.church for a topic, where one exists.
 *
 * The division Dillon set on 14 Oct 2026: thewaybible.app is the reference
 * site (lookup, verse collections, people of the Bible); bigrapids.church is
 * the study, devotional and sermon site. The church site already links every
 * Scripture reference it prints back to /bible/... here. This is the other
 * direction — a reader who came for the verses gets pointed at the exposition.
 *
 * Rules for adding one:
 *   - Only when the post is genuinely ABOUT that topic. A loose word overlap
 *     is not a match; a wrong study link is worse than no study link.
 *   - `title` is the post's own headline, shortened only by trimming the tail
 *     after the dash. Do not rewrite it.
 *   - Broad topics point at the church site's own topic hub (/topics/<slug>)
 *     rather than picking one post out of thirteen.
 *   - Check the path still resolves before committing; the church site is a
 *     separate repo and a post slug can be renamed there without warning.
 */
export const CHURCH = "https://bigrapids.church";

export const STUDIES = {
  // 3 John — the page this whole pass exists for. bigrapids.church already
  // ranks around position 6 for "diotrephes and demetrius" with no reference
  // page here to receive that intent.
  "gaius-diotrephes-and-demetrius": { path: "/blog/3-john-gaius-diotrephes-and-demetrius", title: "3 John — Gaius, Diotrephes, and Demetrius: three men, three responses" },
  "pride": { path: "/blog/3-john-gaius-diotrephes-and-demetrius", title: "3 John — Gaius, Diotrephes, and Demetrius: three men, three responses" },

  "the-last-supper": { path: "/blog/the-last-supper-judas-and-peter", title: "The Last Supper — the table, the sop, and the two men who denied Him" },
  "the-ten-commandments": { path: "/blog/the-ten-commandments-meaning-today", title: "The Ten Commandments: meaning, purpose, and why they still matter" },
  "the-great-commission": { path: "/blog/committing-to-the-commission", title: "Committing to the Commission" },
  "adoption": { path: "/blog/what-the-bible-means-by-adoption", title: "What the Bible means by 'adoption'" },
  "bitterness": { path: "/blog/the-destruction-of-bitterness", title: "The destruction of bitterness — Joseph, Jenga, and Romans 8:28" },
  "gossip": { path: "/blog/where-no-wood-is-the-fire-goes-out", title: "Where there's no wood, the fire goes out — gossip, talebearing, and church" },
  "evangelism": { path: "/blog/a-lifestyle-of-evangelism", title: "A lifestyle of evangelism — how will they hear without a preacher?" },
  "husbands": { path: "/blog/husbands-love-your-wife-like-christ-loves-the-church", title: "Husbands, love your wife like Christ loves the church" },
  "wives": { path: "/blog/wives-submit-as-unto-the-lord", title: "Wives, submit as unto the Lord: what Ephesians 5 actually asks" },
  "children-and-parenting": { path: "/blog/parenting-raise-adults-not-children", title: "Parenting — your children are your first disciples" },
  "family": { path: "/blog/the-family-was-gods-idea", title: "The family was God's idea — what it is and why He made it" },
  "the-flesh-and-the-spirit": { path: "/blog/walk-in-the-spirit-galatians-5", title: "Walk in the Spirit — yielding to the Spirit, denying the flesh" },
  "eternal-life": { path: "/blog/1-john-5-how-to-know-you-have-eternal-life", title: "1 John 5 — how to know you have eternal life" },
  "barabbas": { path: "/blog/becoming-barabbas-part-4", title: "Barabbas set free: the worst man in the story got the best ending" },

  // Broad topics -> the church site's topic hubs, not a single post.
  "marriage": { path: "/topics/marriage-and-family", title: "Marriage and family — thirteen studies" },
  "discipleship": { path: "/topics/following-jesus", title: "Following Jesus — what it looks like day to day" },
};

export function studyFor(slug) {
  return STUDIES[slug];
}
