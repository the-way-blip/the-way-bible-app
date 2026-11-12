/**
 * seo/verse-extras.js — extra sections for the few verse pages that need
 * more than a meaning paragraph to answer what people search for.
 *
 * Why. Search Console (Nov 2026) showed /bible/isaiah/41/10 with thousands of
 * impressions for "isaiah 41:10 meaning" and its variants, sitting past the
 * first page. The pages above it answer who the verse was written to, walk
 * through the three promises in it, and answer the follow-up questions. These
 * entries add that, keyed by reference exactly as refLabel() prints it.
 *
 * Fields:
 *   title        replaces the default <title> (site name is appended).
 *   description  replaces the default meta description.
 *   sections     [heading, html]. html is trusted, written here.
 *   faq          [question, answer]. Rendered and emitted as FAQPage
 *                JSON-LD after the "What does X mean?" question.
 *   next         references to link under "Read next".
 */
export const VERSE_EXTRAS = {
  "Isaiah 41:10": {
    title: "Isaiah 41:10 Meaning: “Fear Thou Not; For I Am With Thee”",
    description: "What Isaiah 41:10 means, who God was speaking to, and the three promises in it: strength, help, and a hand that holds you up.",
    sections: [
      ["Who Isaiah 41:10 was written to",
        `<p>God first said these words to Israel. Two verses earlier he calls them “Israel, art my servant, Jacob whom I have chosen, the seed of Abraham my friend” (<a href="/bible/isaiah/41/8">Isaiah 41:8</a>), and in verse 9 he adds, “I have chosen thee, and not cast thee away.”</p>
<p>The nations around them were afraid. They encouraged each other and nailed their idols down so they would not fall over (<a href="/bible/isaiah/41/5-7">Isaiah 41:5-7</a>). God told his own people the opposite: do not be afraid, because I am with you. The same promise is made again to God's people in <a href="/bible/joshua/1/9">Joshua 1:9</a> and <a href="/bible/deuteronomy/31/6">Deuteronomy 31:6</a>.</p>`],
      ["The three promises: strengthen, help, uphold",
        `<ol class="enum">
<li><span><b>“I will strengthen thee.”</b> God gives the strength for what is in front of you.</span></li>
<li><span><b>“I will help thee.”</b> He comes to your aid. Verse 13 repeats it: “Fear not; I will help thee.”</span></li>
<li><span><b>“I will uphold thee with the right hand of my righteousness.”</b> He holds you up so you do not fall.</span></li>
</ol>`],
    ],
    faq: [
      ["Who wrote Isaiah 41:10?", "The book is the prophecy of Isaiah the son of Amoz, who prophesied to Judah and Jerusalem in the days of kings Uzziah, Jotham, Ahaz and Hezekiah (Isaiah 1:1). In this verse God himself is the one speaking."],
      ["What does “the right hand of my righteousness” mean?", "In Scripture the right hand stands for strength and action. God promises to hold his people up with his own hand, and calls it the hand of his righteousness because he does what is right and keeps his word. Verse 13 says it again: “I the LORD thy God will hold thy right hand.”"],
      ["What comes right after Isaiah 41:10?", "Verses 11 and 12 say that everyone who fights against God's people will come to nothing. Verse 13 repeats the promise: “Fear not; I will help thee.”"],
    ],
    next: ["Joshua 1:9", "Psalm 46:1", "Deuteronomy 31:6", "Isaiah 41:13"],
  },
};
