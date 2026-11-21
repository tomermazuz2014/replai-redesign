/* A small lifecycle controller, independent of any animation library or brand. */
(()=>{'use strict';
const root=document.documentElement,media=matchMedia('(prefers-reduced-motion: reduce)'),subscribers=new Set();let paused=false;
const preferenceKey='kite-motion-reduced';
try{paused=localStorage.getItem(preferenceKey)==='true'}catch{}
function remember(){try{localStorage.setItem(preferenceKey,String(paused))}catch{}}
const regions=[...document.querySelectorAll('[data-motion-region]')];
let reduced=media.matches;
const state=()=>({paused,reduced,hidden:document.hidden});
function sync(){reduced=media.matches;const s=state();root.dataset.effectsPaused=String(s.paused);root.dataset.effectsReduced=String(s.reduced);root.dataset.effectsHidden=String(s.hidden);
 document.querySelectorAll('[data-effects-toggle]').forEach(b=>{b.setAttribute('aria-pressed',String(paused));b.textContent=media.matches?'Motion reduced':paused?'Resume motion':'Pause motion';b.disabled=media.matches});
 document.querySelectorAll('[data-motion-preference]').forEach(b=>{b.checked=paused||media.matches;b.disabled=media.matches});
 document.querySelectorAll('[data-motion-status]').forEach(el=>{el.textContent=media.matches?'Motion is reduced by your device setting.':paused?'Decorative motion is off across this website.':'Your device preference is also respected.'});
 document.querySelectorAll('[data-effects-media]').forEach(m=>{const running=!s.paused&&!s.reduced&&!s.hidden&&m.closest('[data-motion-region]')?.dataset.inView!=='false';if(running)m.play()?.catch(()=>{});else m.pause()});
 subscribers.forEach(fn=>fn(s));root.dispatchEvent(new CustomEvent('effectschange',{detail:s}));}
document.querySelectorAll('[data-effects-toggle]').forEach(b=>b.addEventListener('click',()=>{paused=!paused;remember();sync()}));
document.querySelectorAll('[data-motion-preference]').forEach(b=>b.addEventListener('change',()=>{paused=b.checked;remember();sync()}));
window.addEventListener('storage',e=>{if(e.key===preferenceKey){paused=e.newValue==='true';sync()}});
const observer=new IntersectionObserver(entries=>{entries.forEach(e=>e.target.dataset.inView=String(e.isIntersecting));sync()},{rootMargin:'40px',threshold:0});regions.forEach(r=>observer.observe(r));
media.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
document.querySelectorAll('[data-spotlight]').forEach(el=>{el.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||paused||media.matches)return;const r=el.getBoundingClientRect();el.style.setProperty('--light-x',`${(e.clientX-r.left)/r.width*100}%`);el.style.setProperty('--light-y',`${(e.clientY-r.top)/r.height*100}%`)});el.addEventListener('pointerleave',()=>{el.style.removeProperty('--light-x');el.style.removeProperty('--light-y')})});
window.WebsiteEffects={pause(){paused=true;sync()},resume(){paused=false;sync()},get state(){return state()},subscribe(fn){subscribers.add(fn);fn(state());return()=>subscribers.delete(fn)}};sync();
})();
