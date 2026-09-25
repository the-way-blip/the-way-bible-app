import { Link } from "react-router-dom";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { linkifyRefs } from "../components/RefText";

const V = ({ r, children }) => (
  <blockquote className="border-l-2 border-gold/50 pl-3 my-2 font-scripture text-[15px] text-warm-brown">
    {children} <span className="text-xs text-gold whitespace-nowrap">— {linkifyRefs(r)}</span>
  </blockquote>
);
const H3 = ({ children }) => <h3 className="font-semibold text-warm-brown mt-5 mb-1.5">{children}</h3>;
const P = ({ children }) => <p className="text-[15px] text-warm-brown leading-relaxed mb-3">{children}</p>;
const Callout = ({ children }) => <p className="bg-gold/10 border border-gold/20 rounded-xl px-4 py-3 text-[15px] font-medium text-warm-brown my-4">{children}</p>;
const Tool = ({ name, to, note, children }) => (
  <li className="mb-3">
    <span className="font-semibold text-warm-brown">{name}.</span> <span className="text-warm-brown">{children}</span>
    {to && <> <Link to={to} className="text-xs text-gold whitespace-nowrap">{note} →</Link></>}
  </li>
);

export default function StudyGuide() {
  useDocumentTitle("How to Study the Bible");
  return (
    <article className="max-w-2xl mx-auto px-4 py-6 pb-24">
      <p className="text-[10px] font-medium text-gold uppercase tracking-wider">Study guide</p>
      <h1 className="font-serif text-3xl font-bold text-warm-brown mt-1 mb-3">How to Study the Bible</h1>
      <P>Some people treat the Bible like the smell drifting out of a sandwich shop — they enjoy the aroma but never take a bite. God invites us to more than that: “O taste and see that the LORD is good” ({linkifyRefs("Psalm 34:8")}). This guide walks through four questions: <em>why</em> we study, <em>how</em> we study, <em>what</em> we study with, and <em>what we do</em> with what we learn.</P>

      <nav className="bg-white border border-cream-dark rounded-xl px-4 py-3 mb-6 text-sm">
        {[["motivations", "1. The Motivations — why study the Bible?"], ["methods", "2. The Methods — how should we read and study?"], ["means", "3. The Means — what do we use?"], ["application", "4. The Application — what do we do with it?"]].map(([id, label]) => (
          <a key={id} href={`#${id}`} className="block py-1 text-warm-brown hover:text-gold">{label}</a>
        ))}
      </nav>

      <section id="motivations">
        <h2 className="font-serif text-2xl font-bold text-warm-brown mt-8 mb-2">1. The Motivations</h2>
        <P>Before you develop skills in studying the Bible, work through your motivation for studying in the first place. <strong>Unless your heart is right, you will misuse the Bible, no matter how skilled you are at studying it.</strong> God is greatly concerned with our hearts and motives.</P>

        <H3>Motivated by the awe of God</H3>
        <P>God is the Creator, and that leaves us with a choice about the Bible: either it is His direct revelation and His very words, or it is not. If it is, our approach, attention, thoughts and actions toward Scripture must be taken very seriously. We come to this book with reverence — not only because of what it says, but because of Who it is from. That is why we handle it carefully, and why we listen well when it is taught.</P>

        <H3>Motivated by the love of God</H3>
        <P>The overarching theme of Scripture is God’s love for mankind and the plan of redemption that flows from that love. When we truly believe God loves us, we will be drawn to Him and to His Word — the way you read and reread a letter from someone who loves you. We are called to love God with all of our mind, so applying our minds to Scripture is an act of worship to the One we love: Jesus.</P>

        <H3>Motivated by the revelation from God</H3>
        <P>God has revealed Himself in creation, in the person of Jesus Christ, and through His Holy Spirit — but across history the primary, enduring way He has revealed Himself is His written Word.</P>
        <V r="Psalm 19:1-2">The heavens declare the glory of God; and the firmament sheweth his handywork. Day unto day uttereth speech, and night unto night sheweth knowledge.</V>
        <V r="2 Peter 1:21">For the prophecy came not in old time by the will of man: but holy men of God spake as they were moved by the Holy Ghost.</V>
        <V r="2 Timothy 3:16-17">All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness: that the man of God may be perfect, throughly furnished unto all good works.</V>
        <V r="Hebrews 1:1-2">God, who at sundry times and in divers manners spake in time past unto the fathers by the prophets, hath in these last days spoken unto us by his Son.</V>
        <P>Be careful not to worship what has been revealed, but Who has been revealed. We are not called to worship a book, paper, ink or words — we are called to worship Jesus. The Bible is not Jesus; the Bible points us to Jesus. He is the focal point from Genesis to Revelation. Scripture is a single story of God redeeming mankind: whenever you see a “good guy,” that is never you — it points to Jesus. Whenever you see rebellion, unbelief and sin, that is us, and our need for God’s love and salvation.</P>

        <H3>Motivated by the humility God requires</H3>
        <P>We should come to Scripture looking to be conformed to it. Competition is a great motivator, but it is the wrong reason to study the Bible — God cares more about your character than your productivity. Tragically, Bible study has produced some of the most arrogant people the world has seen; some scholars know the Bible thoroughly and still do not believe it. Knowledge alone can be worthless, even harmful: “knowledge puffeth up, but charity edifieth” ({linkifyRefs("1 Corinthians 8:1")}). If we are not putting what we know to work, our knowledge will simply make us prouder — our study could lead us further from the Lord. True religion is not what you know; it is putting what you know about God and His Word into practice.</P>

        <H3>Motivated by how it can change you</H3>
        <P>If you are reading your Bible and not changing, you can be sure you are approaching it the wrong way. It is not about finding support for our lifestyle or opinions; it is about approaching the mind of God and letting Him redefine who we are. Bible study is incomplete until it turns into obedience and transforms us.</P>
        <Callout>When is the last time you changed something about yourself based on what you read in the Bible?</Callout>

        <H3>Motivated by how it directs you</H3>
        <P>Read the Bible as your marching orders. Rather than coming with your own agenda and hunting for verses that support it, let Scripture shape your hopes and plans. Every time you struggle to accept something the Bible says, you have found an area of your life that needs to be brought into submission to Christ.</P>

        <H3>Motivated by how God will use you</H3>
        <P>What we learn from the Bible is not meant to be hoarded but shared. Be a funnel, not a bucket — let what God pours into you flow out to others.</P>
      </section>

      <section id="methods">
        <h2 className="font-serif text-2xl font-bold text-warm-brown mt-10 mb-2">2. The Methods</h2>
        <P>Scripture is more like an apple than an orange. You eat an orange by pulling it apart into separate pieces; you eat an apple one bite at a time from the whole fruit. Every verse is a bite taken from a larger story — it belongs to a chapter, a book and the whole Bible. Context is key.</P>

        <H3>The method of prayer</H3>
        <P>When you have a question about the Bible, the first Person to ask is the Holy Spirit. It is not wrong to use resources that help you understand Scripture — it is wrong to go to them first. Every time we open God’s Word we should seek God’s presence, and our reading, study and application should be a constant reaching out to Him for guidance.</P>

        <H3>The method of perspective</H3>
        <P>It is easy to read Scripture thinking about how it applies to someone else. Come mostly asking how it speaks to you, and ask God to help you.</P>

        <H3>The method of context</H3>
        <P>Ask the text six questions:</P>
        <ul className="list-disc pl-5 text-[15px] text-warm-brown leading-relaxed space-y-1.5 mb-3">
          <li><strong>Who?</strong> Who is speaking, to whom and about whom? Who are the main characters, and what do we learn about them? In the letters: who wrote it, and who received it?</li>
          <li><strong>Where?</strong> Where did this happen, or will it happen? Where was the author when he wrote it?</li>
          <li><strong>Why?</strong> Why was this written? Why is this said? Why is this person there?</li>
          <li><strong>When?</strong> Where does this fall on the timeline of Bible history and of the author’s life? When did it — or will it — happen?</li>
          <li><strong>What?</strong> What is the author doing? What are the main events and circumstances? What is the historical and cultural setting? What is the main subject?</li>
          <li><strong>How?</strong> How did it happen? How is the truth illustrated?</li>
        </ul>
        <P>Take {linkifyRefs("Philippians 4:13")}, “I can do all things through Christ which strengtheneth me.” Pulled out of its setting about contentment in every circumstance, it too easily becomes “I can do all things through a verse taken out of context.”</P>

        <H3>The method of interpretation</H3>
        <P>The Bible means what God intends it to mean. Every passage has one right interpretation, though its applications will vary: “Love thy neighbour as thyself” is clear in meaning, and it will look different in each of our lives. Be honest that our experiences shape our desires, and our desires can bend our interpretations. As Mark Twain is often quoted, the Scriptures that trouble us most are usually not the ones we don’t understand — they are the ones we do.</P>
      </section>

      <section id="means">
        <h2 className="font-serif text-2xl font-bold text-warm-brown mt-10 mb-2">3. The Means</h2>
        <H3>Kinds of study</H3>
        <P>Study a whole book, a character, a word, a topic or a place. Aim to know the truth so well that error becomes obvious — the way bank tellers learn to spot counterfeit money by handling the real thing. Base your beliefs on Scripture, not on what you have been told. The Bereans “received the word with all readiness of mind, and searched the scriptures daily, whether those things were so” ({linkifyRefs("Acts 17:11")}; see also {linkifyRefs("Romans 16:17-19")}). Don’t just read the Word — study it.</P>

        <H3>Tools</H3>
        <ul className="text-[15px] leading-relaxed pl-0 list-none">
          <Tool name="Cross references" to="/read/John/1" note="Refs tab in the reader">The Bible is the Bible’s best interpreter.</Tool>
          <Tool name="Concordance" to="/search" note="Search">Seeing how and where the same word is used elsewhere sheds light on its meaning.</Tool>
          <Tool name="Dictionary" to="/dictionary" note="Bible Dictionary">Understanding the fullness of a word helps you understand the fullness of the thought.</Tool>
          <Tool name="Original languages" to="/word/G26" note="Tap any word in Study mode">Strong’s, Abbott-Smith and Brown-Driver-Briggs show the Greek and Hebrew behind the English.</Tool>
          <Tool name="Study Bibles">Full of good thoughts — but they aren’t perfect, and they can make us lazy.</Tool>
          <Tool name="Commentaries" to="/read/Joshua/1" note="Commentary tab in the reader">These should come toward the end of your study, not the beginning.</Tool>
          <Tool name="Christian books" to="/library" note="Library">Confessions, classics and devotional works that have served the church for centuries.</Tool>
          <Tool name="Online resources">Blue Letter Bible, Precept Austin, e-Sword and Logos are all helpful — used after prayer and your own careful reading.</Tool>
        </ul>
      </section>

      <section id="application">
        <h2 className="font-serif text-2xl font-bold text-warm-brown mt-10 mb-2">4. The Application</h2>
        <P>If we get this far and miss this step, we have wasted our time.</P>
        <V r="1 John 2:3-6">And hereby we do know that we know him, if we keep his commandments. He that saith, I know him, and keepeth not his commandments, is a liar, and the truth is not in him. But whoso keepeth his word, in him verily is the love of God perfected: hereby know we that we are in him. He that saith he abideth in him ought himself also so to walk, even as he walked.</V>
        <P>Proverbs teaches us to seek knowledge, understanding and wisdom — and knowledge and understanding are useless without wisdom, which is knowing how to live what you have learned. If you are reading your Bible and not changing, you are approaching it the wrong way. Let God change and redefine who you are.</P>
        <Callout>When is the last time you changed something about yourself based on what you read in the Bible?</Callout>
        <p className="text-center mt-8"><Link to="/plans" className="inline-block bg-gold text-white text-sm font-semibold px-5 py-2.5 rounded-full">Start a reading plan</Link></p>
      </section>
    </article>
  );
}
