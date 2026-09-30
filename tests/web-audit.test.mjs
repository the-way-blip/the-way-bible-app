import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { requestedVerse } from '../src/utils/verseLink.js';
import { firstMeaningfulText, translationList } from '../src/utils/lexiconText.js';
import { devotionalPayload } from '../api/_devotionalConsent.js';
import { submitSignUp } from '../src/services/ghlService.js';

const verses = Array.from({ length: 36 }, (_, i) => ({ verse: i + 1 }));
test('verse links preserve canonical and legacy anchors, rejecting malformed/out-of-chapter values', () => {
  assert.equal(requestedVerse('?v=16', verses), 16);
  assert.equal(requestedVerse('?verse=16', verses), 16);
  assert.equal(requestedVerse('?v=3&verse=16', verses), 3);
  for (const value of ['0', '-1', '37', '16abc', '1.5', '', '9007199254740992']) assert.equal(requestedVerse(`?v=${value}`, verses), null);
  assert.equal(requestedVerse('?v=bad&verse=16', verses), null);
  assert.equal(requestedVerse('?v=16', undefined), null);
});
test('lexical fallbacks reject punctuation and empty translation arrays', () => {
  assert.equal(firstMeaningfulText('.', '', ' to love '), 'to love');
  assert.equal(firstMeaningfulText('...', null), '');
  assert.deepEqual(translationList({ kjv_translation_list: [], kjv_def: 'love, beloved' }), ['love', 'beloved']);
  assert.deepEqual(translationList({ kjv_translation_list: [null, {}, ' '], kjv_def: '' }), []);
});
test('verified G25 and Nicodemus definitions are corrected in shipped data', async () => {
  const data = JSON.parse(await readFile(new URL('../public/data/lexicon.json', import.meta.url)));
  assert.match(data.G25.strongs_def, /to love/);
  assert.match(data.G3530.strongs_def, /an Israelite/);
});
test('CRM requires explicit consent and rejects private activity events', () => {
  for (const type of ['prayer-request', 'onboarding-complete', 'reading-milestone']) assert.equal(devotionalPayload({type, email: 'test@example.com', subscribeToDevo: true}), null);
  for (const subscribeToDevo of [false, undefined, 'true', 1]) assert.equal(devotionalPayload({type:'sign-up', email:'test@example.com', subscribeToDevo}), null);
  assert.equal(devotionalPayload(null), null);
  assert.equal(devotionalPayload({type:'sign-up',email:'invalid',subscribeToDevo:true}), null);
  const payload = devotionalPayload({ type:'sign-up', email:'test@example.com', name:'Test Reader', subscribeToDevo:true, prayer_details:'private', city:'private', tags:['injected'], source:'spoofed' });
  assert.deepEqual(Object.keys(payload).sort(), ['source','type','email','first_name','last_name','subscribeToDevo','tags'].sort());
  assert.equal(payload.source, 'The Way App');
  assert.equal(payload.first_name, 'Test');
  assert.deepEqual(payload.tags, ['scripture-app-user','daily-devotional']);
});
test('signup makes no marketing request without consent; opted-in request excludes private fields', async () => {
  const original = global.fetch;
  const calls = [];
  global.fetch = async (...args) => { calls.push(args); return {ok:true}; };
  try {
    await submitSignUp({email:'test@example.com'});
    await submitSignUp({email:'test@example.com',subscribeToDevo:false});
    assert.equal(calls.length, 0);
    await submitSignUp({email:'test@example.com',name:'Test',subscribeToDevo:true,phone:'private'});
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], '/api/ghl');
    assert.equal(JSON.parse(calls[0][1].body).phone, undefined);
  } finally { global.fetch = original; }
});

test('public verse page links to the exact reader verse and separates study notes from Scripture', async () => {
  const { render } = await import('../seo/render.js');
  const result = render({kind:'verse',book:'john',chapter:'3',verse:'16'});
  assert.equal(result.status, 200);
  assert.match(result.body, /\/read\/John\/3\?v=16/);
  assert.doesNotMatch(result.body, /\?verse=16/);
  assert.match(result.body, /Study note provided by TheWay Bible App/);
  assert.equal(render({kind:'verse',book:'john',chapter:'3',verse:'999'}).status, 404);
});

test('service worker upgrade deletes only the obsolete private HTTP cache', async () => {
  const { runInNewContext } = await import('node:vm');
  const source = await readFile(new URL('../public/clear-private-cache.js', import.meta.url), 'utf8');
  const removed = [];
  let activate;
  runInNewContext(source, { self:{addEventListener:(event, callback)=> {assert.equal(event, 'activate');activate=callback;}}, caches:{delete:async(name)=>{removed.push(name);return true;}} });
  let cleanup;
  activate({waitUntil:(promise)=>{cleanup=promise;}});
  await cleanup;
  assert.deepEqual(removed, ['supabase-api']);
});

test('initial HTML has route-specific metadata, readable lexical content, and safe escaping', async () => {
  const { appPageHtml, lexicalMetadata } = await import('../api/_appPageHtml.js');
  const template = '<head><title>Home</title><meta name="description" content="Home"><meta property="og:url" content="/"><link rel="canonical" href="/"></head><body><div id="root"></div></body>';
  const html = appPageHtml(template, lexicalMetadata('G25', {Gk_word:'ἀγαπάω',strongs_def:'.'}, {strongs_def:'to love <script>bad</script>'}));
  assert.match(html, /https:\/\/thewaybible.app\/word\/G25/);
  assert.match(html, /<main/);
  assert.doesNotMatch(html, /<script>bad/);
  assert.match(html, /to love &lt;script&gt;/);
  assert.match(appPageHtml(template,{title:'Sign in',description:'Account',path:'/login',noindex:true}), /noindex, follow/);
});

test('public app page handler renders known words, returns 404 for unknown words, and noindexes login', async () => {
  const { default: handler } = await import('../api/app-page.js');
  function request(query, method='GET') {
    const response={headers:{},setHeader(key,value){this.headers[key]=value;},status(value){this.code=value;return this;},end(value){this.body=value;return this;},redirect(code,url){this.code=code;this.location=url;return this;}};
    handler({method,query},response);return response;
  }
  const word=request({id:'G25'});
  assert.equal(word.code,200);
  assert.match(word.body,/to love/);
  assert.match(word.body,/canonical" href="https:\/\/thewaybible.app\/word\/G25/);
  assert.equal(request({id:'G99999'}).code,404);
  assert.equal(request({id:'../../etc/passwd'}).code,404);
  assert.equal(request({id:'g25'}).location,'/word/G25');
  assert.match(request({page:'login'}).body,/noindex, follow/);
  assert.equal(request({page:'privacy'},'HEAD').body,'');
});
