/**
 * seo/kjv-story.js — the content of /king-james-bible.
 *
 * Why this page exists. "who wrote the king james bible", "when was the king
 * james bible written", "why is it called the king james version" and
 * "difference between the 1611 and today's kjv" are specific, named questions,
 * which is the kind of query this site ranks for. And this is our own text: we
 * quote the King James on 31,000 pages, so the page explaining where it came
 * from belongs here rather than being left to Wikipedia.
 *
 * On accuracy. Where the record is settled this states it plainly. Where
 * numbers vary between sources — how many translators actually worked, how much
 * of the New Testament is Tyndale's wording — it says so instead of picking a
 * figure and presenting it as fact. Nothing here should be tightened into a
 * precise claim without a source to hang it on.
 */

export const KJV_FACTS = [
  ["Commissioned", "1604, at the Hampton Court Conference"],
  ["Published", "1611, by Robert Barker, the King's Printer"],
  ["Translators", "six companies of scholars, around four dozen men"],
  ["Base text", "the Bishops' Bible, revised against the Hebrew and Greek"],
  ["Also called", "the Authorized Version"],
];

export const KJV_SECTIONS = [
  {
    h: "Why anyone wanted a new Bible",
    p: [
      "In January 1604, James I called church leaders to Hampton Court to settle a set of disputes between the Puritans and the bishops. Most of what was raised there went nowhere. One thing did. John Rainolds, a Puritan scholar from Oxford, proposed a new translation of the Bible, and the king agreed on the spot.",
      "James had his own reason. The Bible most English households actually read was the Geneva Bible, and the Geneva Bible came with marginal notes — notes that, in places, questioned whether a king had to be obeyed. The rules drawn up for the new translation said it was to carry no marginal notes except where a Hebrew or Greek word needed explaining. That was not an accident.",
    ],
  },
  {
    h: "Who actually did the work",
    p: [
      "Not one man. The work was divided among six companies of scholars, two meeting at Westminster, two at Oxford, two at Cambridge, each taking a section of the Bible. Richard Bancroft, then Bishop of London, drew up the rules they worked under.",
      "Around fifty men were named to the companies and somewhat fewer seem to have taken part; the surviving lists do not agree, so a precise count is not possible. Each company translated its own portion, then sent the result to the others for review, and a smaller committee went over the whole thing at the end. The best known of them is Lancelot Andrewes, who led the first Westminster company.",
      "So the King James Version is a committee's work, reviewed by other committees. That is unusual, and it is part of why it reads as consistently as it does.",
    ],
  },
  {
    h: "What they translated from",
    p: [
      "The Old Testament came from the Hebrew Masoretic Text, the New from the printed Greek editions then in circulation, the line that runs through Erasmus, Stephanus and Beza. Their instructions were not to start from nothing: the Bishops' Bible was to be followed where the original allowed, and they were to consult the earlier English versions — Tyndale, Coverdale, the Great Bible, the Geneva Bible — and the Catholic Douay-Rheims New Testament.",
      "That instruction matters more than it sounds. The King James is a revision as much as a translation, and the wording people know best is often older than 1611.",
    ],
  },
  {
    h: "How much of it is Tyndale",
    p: [
      "William Tyndale translated the New Testament into English from the Greek in the 1520s and was executed for it in 1536. His phrasing carried into every English Bible that followed, and a large share of the King James New Testament is substantially his — estimates vary by who is counting and how, but the debt is not small.",
      "\"Let there be light.\" \"The powers that be.\" \"Am I my brother's keeper?\" Those are Tyndale's English, reaching us through a book printed seventy-five years after he died.",
    ],
  },
  {
    h: "The 1611 book is not the book you are reading",
    p: [
      "The text of almost every King James Bible printed today is not the 1611 text. It is the result of a long series of corrected editions — Cambridge in 1629 and 1638, then two major revisions in the eighteenth century, the Cambridge edition of 1762 and Benjamin Blayney's Oxford edition of 1769. Blayney's is substantially what is still printed.",
      "What changed was spelling, punctuation, italics and the correction of printers' errors rather than the translation itself. But anyone expecting a 1611 facsimile to match their pew Bible word for word will be surprised.",
      "The 1611 edition also included the Apocrypha, printed between the Testaments. Most King James Bibles sold today leave it out.",
    ],
  },
  {
    h: "Why some words are in italics",
    p: [
      "Words in italics were not in the Hebrew or the Greek. The translators added them so the English would make sense, and set them apart so a reader could see exactly where they had done it.",
      "It is a quiet piece of honesty, and it runs through the whole book. When you read \"there is none other God but one\" and see words leaning, that is the committee telling you which words are theirs.",
    ],
  },
  {
    h: "Two famous misprints",
    p: [
      "Printings of 1611 differ at Ruth 3:15 — some read \"he went into the city\" and some \"she went\" — so collectors call them the \"He\" Bibles and the \"She\" Bibles.",
      "The worse one came in 1631, when Robert Barker's shop printed the seventh commandment with the word \"not\" left out. The result has been known ever since as the Wicked Bible, the printers were fined, and most copies were destroyed.",
    ],
  },
  {
    h: "Who owns it now",
    p: [
      "In the United Kingdom the King James Version is still covered by letters patent held by the Crown, administered through the Queen's or King's Printer and Cambridge University Press. Everywhere else it is in the public domain and has been for a long time.",
      "That is why every verse on this site is quoted in full, and why you can copy any of it without asking us.",
    ],
  },
];

export const KJV_FAQ = [
  ["Who wrote the King James Bible?",
   "Nobody wrote it — it was translated, by six companies of scholars meeting at Westminster, Oxford and Cambridge between 1604 and 1611. Around fifty men were appointed. King James I commissioned the work and gave it his name, but he did not translate any of it."],
  ["When was the King James Bible written?",
   "It was commissioned at the Hampton Court Conference in January 1604 and published in 1611."],
  ["Why is it called the King James Version?",
   "Because James I ordered it made. In Britain it is more often called the Authorized Version, from the statement on the 1611 title page that it was appointed to be read in churches."],
  ["Is the King James Version the same today as in 1611?",
   "Not quite. The text in print today comes from a line of corrected editions, chiefly Cambridge in 1762 and Benjamin Blayney's Oxford edition of 1769. The changes were mostly to spelling, punctuation, italics and printers' errors rather than to the translation. The 1611 edition also contained the Apocrypha, which most printings now omit."],
  ["What was the King James Version translated from?",
   "The Hebrew Masoretic Text for the Old Testament, and for the New the printed Greek editions in the line of Erasmus, Stephanus and Beza. The translators were told to follow the Bishops' Bible where the original allowed, and to consult Tyndale, Coverdale, the Great Bible, the Geneva Bible and the Douay-Rheims New Testament."],
  ["Is the King James Bible in the public domain?",
   "Outside the United Kingdom, yes. Within the UK it remains under Crown letters patent administered by Cambridge University Press."],
  ["Why are some words in the King James Bible in italics?",
   "They were supplied by the translators and have no word behind them in the Hebrew or Greek. The italics mark where English needed something the original did not say outright."],
  ["What is the Wicked Bible?",
   "A 1631 King James printing that left the word \"not\" out of the seventh commandment, so that it read \"Thou shalt commit adultery.\" The printers were fined and most copies were destroyed."],
];
