const API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;
const API_URL = "https://api.anthropic.com/v1/messages";

export async function generateWordStudy(book, chapter, verseNumber, verseText) {
  if (!API_KEY) {
    throw new Error("Set VITE_CLAUDE_API_KEY in .env to enable word study generation");
  }

  const testament = isOT(book) ? "Old Testament" : "New Testament";
  const sourceLanguage = isOT(book) ? "Hebrew" : "Greek";
  const lexicon = isOT(book) ? "BDB (Brown-Driver-Briggs)" : "BDAG / Thayer's";

  const prompt = `You are a biblical scholar. Analyze this KJV verse word-by-word for deep study. Return JSON only.

Book: ${book}
Chapter: ${chapter}
Verse: ${verseNumber}
Text: "${verseText}"
Testament: ${testament}
Source language: ${sourceLanguage}

For each word/phrase in the verse, return an object. Group multi-word phrases that map to a single ${sourceLanguage} word together (e.g. "In the beginning" might map to one Hebrew word).

Fields for EVERY word:
- "word": the English word/phrase as it appears in KJV
- "added": true if added by KJV translators (not in original text — articles, copulas, implied words that KJV italicizes). false if it maps to an original ${sourceLanguage} word.

For original words only (added=false), ALSO include ALL of these:
- "strongs": Strong's number (H#### for Hebrew, G#### for Greek)
- "${sourceLanguage.toLowerCase()}": the original ${sourceLanguage} word in its lexical/dictionary form
- "inflected_form": the actual inflected form as it appears in this verse (may differ from lexical form)
- "transliteration": transliteration of the lexical form
- "pronunciation": pronunciation guide with stress marked
- "morphology": grammatical parsing (e.g. "Qal Perfect 3ms" for Hebrew, "Aorist Active Indicative 3s" for Greek)
- "etymology": root words, cognate family, word history, how the meaning developed (3-4 sentences, be thorough)
- "strongs_def": Strong's Concordance definition — the full entry, not abbreviated
- "${lexicon.split(" ")[0].toLowerCase()}_def": ${lexicon} lexicon definition — more scholarly and nuanced than Strong's
- "lexical_range": full semantic range — every major way this word is used in Scripture with brief explanation (3-4 sentences)
- "alternate_renderings": array of 4-8 other valid English translations of this word, ordered by how common they are in major translations
- "kjv_translations": object mapping English rendering to count — how KJV translates this ${sourceLanguage} word across all its occurrences (e.g. {"faith": 239, "belief": 2, "assurance": 1})
- "total_occurrences": total times this ${sourceLanguage} word appears in the ${testament}
- "translator_note": why the KJV translators chose this particular English rendering here — what nuance does it capture? (2-3 sentences)
- "websters_1828": Webster's 1828 dictionary definition of the English word — this matters because it shows what the word meant to English speakers when KJV was the standard Bible. Give the full primary definition.
- "vines": Vine's Expository Dictionary of ${testament === "New Testament" ? "New Testament" : "Old Testament"} Words entry. Include the full entry with Vine's own cross-references and notes. null only if Vine's has no entry for this word.
- "cross_references": array of 5-8 key verses using this SAME ${sourceLanguage} word (Strong's number) in important or illustrative ways. Format: {"ref": "John 1:1", "snippet": "In the beginning was the Word", "note": "Same word used for the eternal pre-existence of Christ"}
- "related_words": array of 2-4 cognate or semantically related ${sourceLanguage} words: {"strongs": "G####", "word": "...", "transliteration": "...", "meaning": "...", "relationship": "cognate/antonym/synonym"}
- "theological_note": if this word carries significant theological weight in this context, explain it (1-2 sentences). null if routine.

Return a JSON object: { "words": [...] }
No markdown, no code fences, no explanation — return ONLY the raw JSON object.`;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      messages: [
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  const text = data.content[0].text;
  return JSON.parse(text);
}

export async function generateChapterSummary(book, chapter, versesText) {
  if (!API_KEY) {
    throw new Error("Set VITE_CLAUDE_API_KEY in .env to enable AI summaries");
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Provide a concise study summary of ${book} chapter ${chapter} (KJV). Include:
1. **Overview** (2-3 sentences)
2. **Key Themes** (3-4 bullet points)
3. **Historical Context** (2-3 sentences)
4. **Application** (1-2 sentences)

Chapter text:
${versesText}

Keep it concise and scholarly. Use plain text with markdown formatting.`,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Claude API error: ${res.status}`);
  }

  const data = await res.json();
  return data.content[0].text;
}

function isOT(book) {
  const ntBooks = [
    "Matthew", "Mark", "Luke", "John", "Acts", "Romans",
    "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
    "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
    "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews",
    "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John",
    "Jude", "Revelation",
  ];
  return !ntBooks.includes(book);
}
