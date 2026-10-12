/**
 * seo/invite.js — the daily-verse invitation shown on every SEO page.
 *
 * What it is: one email field and a link to the iOS app, shown once, after the
 * reader has actually read something. It posts to /api/ghl, the same endpoint
 * and the same consent shape the app itself uses — see api/_devotionalConsent.js,
 * which allowlists the payload and requires subscribeToDevo to be explicitly true.
 * Nothing new is collected and nothing new is stored here.
 *
 * Why it is built the way it is, rather than as a normal modal:
 *
 * Google demotes pages whose content is covered by an interstitial when a
 * searcher arrives from search. The rule is about arrival, so the timing and the
 * shape both matter. On phones this is a bottom sheet that covers a strip of the
 * screen and leaves the page readable behind it; only on a pointer device does it
 * become a centred dialog. It never fires on arrival — twenty seconds, or the
 * pointer leaving the top of the window, whichever happens first.
 *
 * Exit intent does not exist on touch, so phones get the timer alone. Both are
 * gated on the reader having scrolled at all, which keeps it away from anyone who
 * bounced immediately and from crawlers, which do not scroll.
 *
 * Shown once. Dismissal is remembered for 30 days and a signup forever, in
 * localStorage, which is per-browser and may be unavailable — every read and
 * write is wrapped, and when it throws the sheet simply does not appear rather
 * than appearing on every page.
 *
 * The markup sits in the page but inert: hidden, with no focusable control, until
 * the script opens it. Crawlers see a form they cannot trigger, which is the point
 * — it must not read as cloaked or as an interstitial in a rendered snapshot.
 */

const KEY = "tw_invite";          // {d:<dismissed ms>} or {s:1} once signed up
const DELAY_MS = 20_000;
const HIDE_DAYS = 30;

export const inviteHtml = (appHref) => `
<div id="tw-invite" class="invite" hidden aria-hidden="true">
  <div class="invite-bk" data-invite-close></div>
  <div class="invite-card" role="dialog" aria-modal="true" aria-labelledby="tw-invite-h" aria-describedby="tw-invite-p">
    <button class="invite-x" type="button" data-invite-close aria-label="Close">&times;</button>
    <h2 id="tw-invite-h">A verse in your inbox each morning</h2>
    <p id="tw-invite-p">One passage of Scripture, with a short note on what it means. Free, and you can stop any time.</p>
    <form class="invite-form" novalidate>
      <label class="sr-only" for="tw-invite-email">Email address</label>
      <input id="tw-invite-email" type="email" name="email" inputmode="email" autocomplete="email"
             placeholder="you@example.com" required>
      <button type="submit">Send it to me</button>
    </form>
    <p class="invite-note" data-invite-msg role="status" aria-live="polite"></p>
    <p class="invite-alt">Or read, memorise and journal in the app &mdash;
      <a href="${appHref}" data-cta="invite-ios">get it free on iPhone</a>.</p>
    <p class="invite-fine">We send the daily verse and nothing else. <a href="/privacy">Privacy</a>.</p>
  </div>
</div>`;

export const INVITE_CSS = `
.invite{position:fixed;inset:0;z-index:60;display:flex;align-items:flex-end;justify-content:center}
.invite[hidden]{display:none}
.invite-bk{position:absolute;inset:0;background:rgba(40,30,16,.42);opacity:0;transition:opacity .25s}
.invite.on .invite-bk{opacity:1}
.invite-card{position:relative;width:100%;max-width:460px;background:var(--paper);border:1px solid var(--line);
 border-radius:16px 16px 0 0;padding:22px 20px 18px;box-shadow:0 -8px 40px rgba(40,30,16,.18);
 transform:translateY(100%);transition:transform .28s cubic-bezier(.2,.8,.2,1)}
.invite.on .invite-card{transform:none}
.invite-card h2{margin:0 0 6px;font-size:20px;line-height:1.25;padding-right:28px;text-transform:none;letter-spacing:normal;color:var(--brown);font-weight:600}
.invite-card p{margin:0 0 12px;font-size:15px;line-height:1.55;color:var(--brown-light)}
.invite-x{position:absolute;top:10px;right:10px;width:34px;height:34px;border:0;background:none;
 font-size:26px;line-height:1;color:var(--brown-light);cursor:pointer;border-radius:50%}
.invite-x:hover{background:rgba(40,30,16,.07)}
.invite-form{display:flex;gap:8px;margin:0 0 10px}
.invite-form input{flex:1;min-width:0;padding:12px 14px;font:inherit;font-size:16px;
 border:1px solid var(--line);border-radius:10px;background:#fff;color:var(--brown)}
.invite-form input:focus{outline:none;border-color:var(--gold)}
.invite-form button{flex:none;padding:12px 16px;font:inherit;font-size:15px;font-weight:600;
 border:0;border-radius:10px;background:var(--gold);color:#fff;cursor:pointer}
.invite-form button:disabled{opacity:.6;cursor:default}
.invite-note{margin:0 0 10px!important;font-size:14px;min-height:0}
.invite-note.err{color:#a3341f}
.invite-note:empty{display:none}
.invite-alt,.invite-fine{font-size:13px!important}
.invite-fine{margin:0!important;color:var(--brown-light);opacity:.75}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
@media (min-width:640px){
  .invite{align-items:center}
  .invite-card{border-radius:16px;transform:translateY(14px) scale(.98);opacity:0;transition:transform .22s,opacity .22s}
  .invite.on .invite-card{transform:none;opacity:1}
}
@media (prefers-reduced-motion:reduce){
  .invite-bk,.invite-card{transition:none}
}`;

/** Inlined into the page. Keep it small and dependency-free. */
export const inviteJs = (pageType) => `(function(){
var K=${JSON.stringify(KEY)},root=document.getElementById('tw-invite');if(!root)return;
function get(){try{return JSON.parse(localStorage.getItem(K)||'{}')}catch(e){return null}}
function set(v){try{localStorage.setItem(K,JSON.stringify(v))}catch(e){}}
var st=get();
// localStorage unreachable (private mode, blocked cookies) — stay quiet rather than
// reappearing on every page with no way to remember a dismissal.
if(st===null)return;
if(st.s)return;
if(st.d&&Date.now()-st.d<${HIDE_DAYS}*864e5)return;
var shown=false,scrolled=false,t=null;
function open(){if(shown)return;shown=true;clearTimeout(t);off();
 root.hidden=false;root.setAttribute('aria-hidden','false');
 requestAnimationFrame(function(){root.classList.add('on')});
 var f=root.querySelector('input');if(f&&matchMedia('(min-width:640px)').matches)f.focus();
 if(typeof gtag==='function')gtag('event','invite_shown',{page_type:${JSON.stringify(pageType)}});}
function close(remember){root.classList.remove('on');root.setAttribute('aria-hidden','true');
 setTimeout(function(){root.hidden=true},260);if(remember)set({d:Date.now()});}
function onLeave(e){if(e.clientY<=0&&scrolled)open()}
function off(){document.removeEventListener('mouseout',onLeave);}
function arm(){if(scrolled)return;scrolled=true;t=setTimeout(open,${DELAY_MS});
 if(matchMedia('(hover:hover) and (pointer:fine)').matches)document.addEventListener('mouseout',onLeave);}
addEventListener('scroll',arm,{once:true,passive:true});
root.addEventListener('click',function(e){if(e.target.closest('[data-invite-close]'))close(true)});
addEventListener('keydown',function(e){if(e.key==='Escape'&&!root.hidden)close(true)});
var form=root.querySelector('form'),msg=root.querySelector('[data-invite-msg]');
form.addEventListener('submit',function(e){e.preventDefault();
 var input=form.querySelector('input'),btn=form.querySelector('button'),email=(input.value||'').trim();
 if(!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)){msg.className='invite-note err';msg.textContent='That email does not look right.';input.focus();return}
 btn.disabled=true;msg.className='invite-note';msg.textContent='Signing you up…';
 fetch('/api/ghl',{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({type:'sign-up',subscribeToDevo:true,email:email})})
 .then(function(r){if(!r.ok)throw 0;set({s:1});
  if(typeof gtag==='function')gtag('event','invite_signup',{page_type:${JSON.stringify(pageType)}});
  form.hidden=true;msg.className='invite-note';msg.textContent='You are on the list.';
  setTimeout(function(){close(false)},2600);})
 .catch(function(){btn.disabled=false;msg.className='invite-note err';
  msg.textContent='That did not go through. Try again, or get the app instead.';});
});
})();`;
