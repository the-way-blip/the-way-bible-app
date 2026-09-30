const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

/** Update the built app shell for crawlers without changing client-side routes. */
export function appPageHtml(template, { title, description, path, content = '', noindex = false }) {
  const url = `https://thewaybible.app${path}`;
  let html = template.replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(title)}</title>`);
  const values = { description, 'og:title': title, 'twitter:title': title, 'og:description': description, 'twitter:description': description, 'og:url': url };
  for (const [key, value] of Object.entries(values)) {
    const pattern = new RegExp(`<meta (?:name|property)="${key}"[^>]*>`, 'g');
    html = html.replace(pattern, `<meta ${key.startsWith('og:') ? 'property' : 'name'}="${key}" content="${escape(value)}" />`);
  }
  html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${escape(url)}" />`);
  if (noindex) html = html.replace('</head>', '<meta name="robots" content="noindex, follow" /></head>');
  return html.replace('<div id="root"></div>', `<div id="root">${content}</div>`);
}

export function lexicalMetadata(id, entry, fallback = {}) {
  const word = entry?.Gk_word || entry?.Heb_word || entry?.lemma || fallback.lemma || '';
  const meaning = [entry?.strongs_def, fallback.strongs_def].find((value) => typeof value === 'string' && /[\p{L}\p{N}]/u.test(value)) || 'Explore KJV translations and Scripture references.';
  const title = `${id} ${word} — Strong’s Word Study | TheWay Bible App`;
  return {
    title, description: `${id}: ${meaning}`.slice(0, 300), path: `/word/${id}`,
    content: `<main class="max-w-2xl mx-auto px-4 py-8"><h1>${escape(id)} ${escape(word)}</h1><h2>Strong’s definition</h2><p>${escape(meaning)}</p><p>Lexical sources: Strong’s data and Open Scriptures. Definitions are study aids, separate from the KJV Bible text.</p><a href="/bible">Read the Bible</a></main>`,
  };
}
