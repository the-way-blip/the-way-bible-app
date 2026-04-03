// Map of "Book Chapter" to daily devotional content
// Each entry has: thought (meditation), prayer (prompt), application (action question)

const devotionals = {
  // Genesis 1-10
  "Genesis 1": {
    thought: "God spoke creation into existence — His word carries power beyond our comprehension.",
    prayer: "Lord, help me trust in Your creative power working in my life today.",
    application: "Consider one area where you need to trust God's design rather than your own understanding.",
  },
  "Genesis 2": {
    thought: "God did not leave Adam alone — He designed us for relationship and community.",
    prayer: "Father, thank You for the gift of companionship. Help me nurture the relationships You've given me.",
    application: "Reach out to someone today and let them know they matter to you.",
  },
  "Genesis 3": {
    thought: "Sin entered through doubt in God's goodness, yet even here God made a promise of redemption.",
    prayer: "Lord, guard my heart against the whisper that You are withholding good from me.",
    application: "Identify one lie you've been believing about God's character and replace it with a truth from Scripture.",
  },
  "Genesis 4": {
    thought: "God warned Cain that sin was crouching at his door — He warns us too, out of love.",
    prayer: "Father, give me the humility to hear Your warnings and the strength to master temptation.",
    application: "What recurring temptation is 'crouching at your door'? Bring it honestly before God.",
  },
  "Genesis 5": {
    thought: "Enoch walked faithfully with God — a steady, lifelong devotion, not a single dramatic moment.",
    prayer: "Lord, help me be faithful in the ordinary days, not just the dramatic ones.",
    application: "What does 'walking with God' look like in your daily routine this week?",
  },
  "Genesis 6": {
    thought: "Noah found grace in the eyes of the Lord — even in a corrupt world, faithfulness is noticed.",
    prayer: "God, give me the courage to stand apart when the world pulls me toward compromise.",
    application: "Where do you feel pressure to conform? Ask God for strength to remain faithful.",
  },
  "Genesis 7": {
    thought: "God shut the door of the ark Himself — He protects those who trust in His provision.",
    prayer: "Father, I trust that You will close and open the right doors in my life.",
    application: "Release one situation you've been trying to control and trust God's timing.",
  },
  "Genesis 8": {
    thought: "After the flood, Noah's first act was worship — gratitude should follow deliverance.",
    prayer: "Lord, let my first response to Your faithfulness always be thanksgiving.",
    application: "Name three things God has brought you through, and take a moment to give thanks.",
  },
  "Genesis 9": {
    thought: "The rainbow is a covenant sign — God keeps His promises even when we forget them.",
    prayer: "Thank You, Lord, that Your faithfulness does not depend on mine.",
    application: "Recall a promise from Scripture and write it where you'll see it today.",
  },
  "Genesis 10": {
    thought: "From one family, God filled the earth with nations — His plan unfolds across generations.",
    prayer: "Father, help me see my life as part of Your bigger story, not just my own.",
    application: "How might God be using your family or community to impact future generations?",
  },

  // Psalms 1-5
  "Psalms 1": {
    thought: "The blessed life is rooted like a tree by streams of water — nourished by God's word daily.",
    prayer: "Lord, plant me deep in Your word so I can bear fruit in every season.",
    application: "Set aside a specific time today to meditate on one verse that speaks to you.",
  },
  "Psalms 2": {
    thought: "The nations rage, but God sits enthroned — His authority is never threatened by human rebellion.",
    prayer: "God, when the world feels chaotic, remind me that You reign above it all.",
    application: "What current situation makes you anxious? Surrender it to God's sovereign rule.",
  },
  "Psalms 3": {
    thought: "David cried out to God while surrounded by enemies — prayer is our first line of defense.",
    prayer: "Lord, be my shield today. I will not fear because You sustain me.",
    application: "Before reacting to today's challenges, pause and pray first.",
  },
  "Psalms 4": {
    thought: "In peace I will lie down and sleep — true rest comes from trusting in God's safety.",
    prayer: "Father, grant me the peace that comes from knowing You watch over me.",
    application: "Tonight before bed, lay your worries before God and choose to rest in His care.",
  },
  "Psalms 5": {
    thought: "Morning by morning David brought his requests to God — consistency in prayer builds intimacy.",
    prayer: "Lord, let my mornings begin with You. Tune my heart to seek You first.",
    application: "Try starting tomorrow with prayer before checking your phone or beginning tasks.",
  },

  // Matthew 1-5
  "Matthew 1": {
    thought: "Jesus' genealogy includes unlikely people — God works through imperfect lives to fulfill His plan.",
    prayer: "Lord, thank You that my failures don't disqualify me from Your purposes.",
    application: "Reflect on how God has used an unexpected chapter of your life for good.",
  },
  "Matthew 2": {
    thought: "The wise men traveled far to worship — seeking Jesus is worth every sacrifice.",
    prayer: "Father, give me the persistence of the Magi to pursue You above comfort.",
    application: "What comfort might you need to set aside to draw closer to Christ?",
  },
  "Matthew 3": {
    thought: "John called people to repentance — turning from sin is the doorway to new life.",
    prayer: "Lord, search my heart and show me anything I need to turn from today.",
    application: "Is there a habit or attitude you've been avoiding dealing with? Bring it to God honestly.",
  },
  "Matthew 4": {
    thought: "Jesus answered every temptation with Scripture — the word of God is our strongest weapon.",
    prayer: "Father, fill my mind with Your truth so I can stand firm when temptation comes.",
    application: "Memorize one verse this week that addresses a temptation you regularly face.",
  },
  "Matthew 5": {
    thought: "The Beatitudes turn the world's values upside down — the kingdom of heaven belongs to the humble.",
    prayer: "Lord, reshape my heart to value what You value: mercy, purity, and peace.",
    application: "Which beatitude challenges you most? Sit with it and ask God to grow that quality in you.",
  },

  // John 1-5
  "John 1": {
    thought: "In the beginning was the Word — Jesus is eternal, and through Him all things were made.",
    prayer: "Lord Jesus, You are the light of the world. Illuminate my path today.",
    application: "How can you point someone toward the light of Christ in a conversation today?",
  },
  "John 2": {
    thought: "Jesus' first miracle was at a wedding celebration — He cares about our everyday joys.",
    prayer: "Father, open my eyes to see Your presence in ordinary moments, not just crises.",
    application: "Look for God's fingerprints in something joyful or mundane today.",
  },
  "John 3": {
    thought: "God so loved the world that He gave — love always moves toward sacrifice.",
    prayer: "Lord, deepen my understanding of how wide and deep Your love truly is.",
    application: "Share the hope of John 3:16 with someone who needs encouragement today.",
  },
  "John 4": {
    thought: "Jesus offered living water to a woman others avoided — no one is beyond His reach.",
    prayer: "Father, break down the walls I build between myself and people who are different from me.",
    application: "Is there someone you've been avoiding or overlooking? Extend kindness to them.",
  },
  "John 5": {
    thought: "Jesus asked, 'Do you want to be healed?' — He invites us to participate in our own restoration.",
    prayer: "Lord, I say yes to the healing and growth You want to bring into my life.",
    application: "What area of brokenness have you accepted as permanent? Bring it to Jesus with fresh hope.",
  },

  // Romans 1-5
  "Romans 1": {
    thought: "Paul was not ashamed of the gospel — it is the power of God for salvation to everyone who believes.",
    prayer: "Lord, fill me with holy boldness to live out and share the gospel without shame.",
    application: "Is there a setting where you hide your faith? Ask God for courage to be authentic.",
  },
  "Romans 2": {
    thought: "God's kindness is meant to lead us to repentance — judgment begins with self-examination.",
    prayer: "Father, keep me from judging others while ignoring my own need for grace.",
    application: "Before critiquing someone else today, honestly examine your own heart first.",
  },
  "Romans 3": {
    thought: "All have sinned and fall short, yet all can be justified freely by His grace — the ground is level at the cross.",
    prayer: "Lord, I receive Your grace not because I deserve it but because You are generous.",
    application: "Thank God specifically for His grace covering one failure you feel most guilty about.",
  },
  "Romans 4": {
    thought: "Abraham believed God and it was credited to him as righteousness — faith, not perfection, is what God asks.",
    prayer: "Father, strengthen my faith to trust Your promises even when I cannot see the outcome.",
    application: "What promise of God feels impossible right now? Choose to believe it today.",
  },
  "Romans 5": {
    thought: "Suffering produces perseverance, character, and hope — God redeems every hard season.",
    prayer: "Lord, help me see my trials as a pathway to deeper hope, not a sign of Your absence.",
    application: "Reflect on a past struggle that produced growth. Thank God for what He built through it.",
  },
};

export default devotionals;
