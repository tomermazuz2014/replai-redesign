/* Optional entrance enhancement. Content is never stored in a hidden state. */
(()=>{'use strict';
if(window.WebsiteScrollReveal)return;
const selector='[data-scroll-reveal]',root=document.documentElement;
const media=matchMedia('(prefers-reduced-motion: reduce)'),print=matchMedia('print');
const records=new Map(),active=new Set();
let reduced=media.matches,printing=print.matches,observer=null,destroyed=false;
const disabled=()=>reduced||printing||document.hidden||root.dataset.effectsPaused==='true'||root.dataset.effectsReduced==='true';
function settle(el){
 const record=records.get(el);if(!record)return;
 record.seen=true;el.dataset.revealState='complete';observer?.unobserve(el);
 record.animation?.cancel();record.animation=null;active.delete(el);
}
function finish(target=document){
 for(const el of records.keys())if(target===document||el===target||el.contains(target)||target.contains?.(el))settle(el);
}
function enter(el){
 const record=records.get(el);if(!record||record.seen)return;
 const style=getComputedStyle(el);
 // This effect owns only an otherwise neutral wrapper, never a physical part.
 if(disabled()||el.matches(':focus-within')||style.transform!=='none'||
    (style.translate&&style.translate!=='none')||Number(style.opacity)!==1||el.getAnimations().length){settle(el);return}
 record.seen=true;observer.unobserve(el);el.dataset.revealState='entering';
 try{
  const animation=el.animate([{opacity:0.45,transform:'translateY(12px)'},{opacity:1,transform:'none'}],
   {duration:380,easing:'cubic-bezier(.22,1,.36,1)',fill:'none'});
  record.animation=animation;active.add(el);
  animation.finished.then(()=>settle(el),()=>{if(record.animation===animation)settle(el)});
 }catch{settle(el)}
}
function refresh(){
 if(destroyed)return;
 document.querySelectorAll(selector).forEach(el=>{
  if(records.has(el))return;
  records.set(el,{seen:false,animation:null});
  const r=el.getBoundingClientRect();
  // The first view, restored scroll position and already-passed content stay readable.
  if(!observer||r.top<innerHeight||el.matches(':focus-within'))settle(el);
  else observer.observe(el);
 });
 revealHash();
}
function revealFragment(hash){
 let name;try{name=decodeURIComponent(hash.slice(1).split(':~:')[0])}catch{return}
 if(!name)return;const target=document.getElementById(name)||document.getElementsByName(name)[0];
 if(target)finish(target);
}
function revealHash(){revealFragment(location.hash)}
function anchor(e){
 if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
 const link=e.target.closest?.('a[href]');if(!link||link.hasAttribute('download')||(link.target&&link.target!=='_self'))return;
 let url;try{url=new URL(link.href,location.href)}catch{return}
 if(url.origin===location.origin&&url.pathname===location.pathname&&url.search===location.search)revealFragment(url.hash);
 // Complete before the browser scrolls. Do not cancel or replace navigation.
}
function changed(){reduced=media.matches;if(disabled())for(const el of [...active])settle(el)}
function effectChanged(e){if(e.detail?.paused||e.detail?.reduced||e.detail?.hidden)for(const el of [...active])settle(el)}
function focus(e){finish(e.target)}
function beforePrint(){printing=true;finish()}
function afterPrint(){printing=print.matches}
function printChanged(){printing=print.matches;if(printing)finish()}
function restored(){for(const el of records.keys())if(el.getBoundingClientRect().top<innerHeight)settle(el);revealHash()}
if(typeof window.IntersectionObserver==='function'&&typeof Element.prototype.animate==='function'){
 observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)enter(e.target)},{threshold:0});
}
media.addEventListener('change',changed);print.addEventListener('change',printChanged);
root.addEventListener('effectschange',effectChanged);document.addEventListener('visibilitychange',changed);
document.addEventListener('focusin',focus);document.addEventListener('beforematch',focus);
document.addEventListener('click',anchor);
window.addEventListener('hashchange',revealHash);window.addEventListener('beforeprint',beforePrint);
window.addEventListener('afterprint',afterPrint);window.addEventListener('pageshow',restored);
window.WebsiteScrollReveal={refresh,finish,destroy(){
 finish();destroyed=true;observer?.disconnect();
 media.removeEventListener('change',changed);print.removeEventListener('change',printChanged);
 root.removeEventListener('effectschange',effectChanged);document.removeEventListener('visibilitychange',changed);
 document.removeEventListener('focusin',focus);document.removeEventListener('beforematch',focus);
 document.removeEventListener('click',anchor);
 window.removeEventListener('hashchange',revealHash);window.removeEventListener('beforeprint',beforePrint);
 window.removeEventListener('afterprint',afterPrint);window.removeEventListener('pageshow',restored);
 }};
refresh();
})();
