/**
 * seo/meanings.js — plain-language "what this verse means" paragraphs, written
 * for TheWay and approved by Dillon. Everything else on a verse page (the KJV
 * text, the cross references, the Matthew Henry excerpt) is public domain and
 * sits on every other Bible site; this is the only writing here that is ours,
 * and it is what an AI assistant quotes when somebody asks what a verse means.
 *
 * Keyed by reference exactly as refLabel() prints it (so "Psalm 23:1", not
 * "Psalms 23:1"). Anything that does not resolve through parseRef is ignored,
 * and a verse with no entry simply renders without the section.
 *
 * Batch 1: the 25 most-searched verses. Keep the register plain and spoken,
 * and run the voice-check skill on new batches before they ship.
 */
export const VERSE_MEANINGS = {
  "John 3:16": "Jesus says this at night, to a religious leader who came with questions. The love is God's, the giving costs him his Son, and the offer is open to whosoever — not to a short list of people who had it together. Believing here isn't agreeing that it happened. It's trusting him with where you end up.",
  "Jeremiah 29:11": "God wrote this to people already in Babylon who weren't going home for seventy years. In the same letter he tells them to build houses and plant gardens right where they are. So the promise isn't that you'll be spared the hard years. It's that God is still thinking toward you in the middle of them.",
  "Philippians 4:13": "Paul wrote this from a jail cell, in a paragraph about learning to be content. He'd been full and he'd been hungry, and he says he learned it in both. The verse isn't a promise that you'll win. It's a promise that Christ will hold you steady either way.",
  "Romans 8:28": "It doesn't say all things are good. It says God works them together for good, which is a different claim and a harder one. Paul had just been writing about groaning and weakness, so he isn't pretending the loss is small. The comfort is that God is still working while you wait.",
  "Psalm 23:1": "David kept sheep before he was king, so he knew what he was claiming. A shepherd means the sheep doesn't have to find its own food, water, or way home. I shall not want isn't a promise of everything you'd like. It's the settled sense that nothing you actually need is missing.",
  "Proverbs 3:5-6": "Leaning is what you do when you're tired — you put your weight on something. Solomon isn't saying your understanding is worthless, he's saying it's too small to hold you up. And acknowledge him in all thy ways takes in the ordinary decisions, not just the ones that feel big.",
  "Isaiah 41:10": "God says this to people staring at an army they can't beat. Look at how much of it is what he will do: strengthen, help, uphold. The command not to fear comes with a reason attached, and the reason is him, not you.",
  "Joshua 1:9": "Moses had just died and Joshua had to take a nation into a fight. God says be strong and of a good courage three times in this one chapter, which tells you Joshua needed to hear it more than once. The courage isn't something he worked up. It rests on the last line: the LORD thy God is with thee whithersoever thou goest.",
  "Matthew 11:28": "Jesus said this to people worn out by religion that kept adding to the pile. Come unto me is an invitation, not a requirement to clean yourself up first. And the rest he offers isn't a day off. It's rest for the soul, which is the part that doesn't get better with sleep.",
  "Romans 12:2": "Conformed is pressure from the outside. Transformed is change that starts inside and works out. Paul says it happens by the renewing of your mind, which is slower than a decision and lasts longer. You come to know God's will by becoming the kind of person who can recognize it.",
  "Philippians 4:6-7": "The opposite of being careful for nothing isn't feeling calm. It's praying about the thing instead of carrying it. Paul puts thanksgiving in the same breath, before anything has changed. And what's promised isn't the answer you asked for — it's a peace that keeps guard over you while you wait for one.",
  "1 Corinthians 13:4-7": "Paul wrote this to a church that was fighting, not to a wedding. Read the list as things love does rather than things it feels: suffereth long, is kind, is not easily provoked. It's the plainest test in the Bible for whether love is real. Put your own name where the word charity is and read it again.",
  "Galatians 5:22-23": "Fruit is singular here — one fruit, nine parts to it. Fruit grows, which is Paul's whole argument against trying to manufacture godliness by effort. You don't get to pick the three you like. They come in together, from the same Spirit.",
  "Ephesians 2:8-9": "Grace is the reason, faith is how you receive it, and Paul says the whole thing is the gift of God, not of yourselves. If you could earn it you'd have something to boast about, and he shuts that door. The next verse says we're created unto good works — so works still matter, just never as the price.",
  "Isaiah 40:31": "The promise is made to people who are tired, not to people who are strong. Waiting on the LORD isn't standing still; it's the kind of waiting that keeps expecting him to act. And watch the order — mount up, run, walk. Walking without fainting is the hardest of the three, and it comes last for a reason.",
  "Psalm 46:1": "A very present help means help that's already here, not help that's coming. The psalm goes straight on to picture mountains falling into the sea, the worst thing the writer could imagine. Refuge is where you go. Strength is what you're handed when you get there.",
  "2 Timothy 1:7": "Paul wrote this to a young pastor with real reason to be afraid. Notice fear isn't called a weakness to push through — it's named as something God didn't give. What he did give comes in three parts: power to act, love so you don't go hard, and a sound mind to think straight when you're scared.",
  "Hebrews 11:1": "This is the Bible's own definition of faith, and it isn't wishful thinking. Substance and evidence are solid words — they describe something that's actually there. Faith isn't believing without a reason. It's acting on what God said before you can see how it turns out.",
  "Romans 6:23": "Wages are earned. A gift isn't. Paul sets the two side by side so you can see that everybody receives one or the other, and nobody gets both. Death is what sin pays out. Eternal life is handed to people who never worked a day for it.",
  "Romans 10:9": "Two things are named here: the mouth and the heart, said out loud and believed inside. The confession is that Jesus is Lord, which is a surrender before it's a sentence. And Paul ties it to the resurrection, because a Christ who stayed in the grave saves nobody.",
  "John 14:6": "Thomas had just admitted he didn't know where Jesus was going or how to get there. Jesus doesn't answer with directions. He answers with himself — the way, the truth, and the life — and then says the line that still offends: no man cometh unto the Father, but by me.",
  "Matthew 6:33": "This lands at the end of a paragraph about food and clothes, spoken to people who didn't know whether they'd have either. Seek first is about order, not about ignoring the bills. Jesus says the things you're chasing get added when the kingdom goes at the front of the line.",
  "1 John 1:9": "To confess is to say the same thing about it that God says, without softening it. The promise rests on his character rather than on how sorry you managed to feel: he is faithful and just to forgive. And cleansed from all unrighteousness covers the parts you didn't know to name.",
  "Psalm 119:105": "A lamp in that world lit the next step, not the whole road. That's the honest picture of guidance here — enough light for one step, not a map of the next ten years. You get more of it when you move.",
  "Genesis 1:1": "The first sentence of the Bible doesn't argue for God. It assumes him. Everything after it — the light, the sea, the animals, the man — rests on this one claim being true. If God made the beginning, nothing that comes after is outside his reach.",
};
