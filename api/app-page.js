import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { appPageHtml, lexicalMetadata } from './_appPageHtml.js';

let template;
let lexicon;
const dictionaries = {};
const pageMeta = {
  privacy: {title:'Privacy Policy — TheWay Bible App',description:'How TheWay Bible App handles study data, account information, analytics, and optional devotional emails.',path:'/privacy'},
  terms: {title:'Terms of Service — TheWay Bible App',description:'Terms of Service for using TheWay Bible App and its Bible study tools.',path:'/terms'},
  login: {title:'Your account — TheWay Bible App',description:'Create an optional account or sign in to sync your Bible study across devices.',path:'/login',noindex:true},
};

export default function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).end();
  try {
    template ||= readFileSync(join(process.cwd(), 'dist/index.html'), 'utf8');
    let metadata = Object.hasOwn(pageMeta, req.query.page) ? pageMeta[req.query.page] : null;
    if (typeof req.query.id === 'string' && /^[GH][1-9]\d{0,4}$/i.test(req.query.id)) {
      const id = req.query.id.toUpperCase();
      if (id !== req.query.id) return res.redirect(308, `/word/${id}`);
      lexicon ||= JSON.parse(readFileSync(join(process.cwd(), 'public/data/lexicon.json'), 'utf8'));
      const language = id.startsWith('G') ? 'greek' : 'hebrew';
      dictionaries[language] ||= JSON.parse(readFileSync(join(process.cwd(), `public/data/strongs/${language}.json`), 'utf8'));
      const fallback = dictionaries[language][id];
      if (lexicon[id] || fallback) metadata = lexicalMetadata(id, lexicon[id], fallback);
    }
    const status = metadata ? 200 : 404;
    metadata ||= {title:'Word not found — TheWay Bible App',description:'This word study entry could not be found.',path:'/word',noindex:true};
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.status(status).end(req.method === 'HEAD' ? '' : appPageHtml(template, metadata));
  } catch {
    // Missing build artifacts should be visible as an operational failure, not a misleading 200.
    return res.status(503).end('The page is temporarily unavailable. Please try again.');
  }
}
