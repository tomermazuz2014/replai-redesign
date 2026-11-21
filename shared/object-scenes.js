/* Rigid objects, attachment-space coordinates, damped joint response.
   Only translation + rotation are allowed. A flexible cord is a separate path. */
(()=>{'use strict';
const TAU=2*Math.PI, read=(el,key)=>JSON.parse(el.getAttribute(key)||'{}');
const sceneState=()=>window.WebsiteEffects?.state||{paused:false,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches,hidden:document.hidden};
// Art direction changes placement at breakpoints; it never deforms rigid artwork.
function sceneLayout(root){
 const layouts=JSON.parse(root.getAttribute('data-scene-layouts')||'[]'),saved=new Map();
 const target=selector=>selector===':scope'?root:root.querySelector(selector);
 for(const layout of layouts)for(const patch of layout.patches){const el=target(patch.selector);if(!el)throw new Error('Missing scene layout target '+patch.selector);if(!saved.has(el))saved.set(el,{});for(const key of Object.keys(patch.attributes))if(!(key in saved.get(el)))saved.get(el)[key]=el.getAttribute(key)}
 const apply=()=>{for(const[el,attrs]of saved)for(const[key,value]of Object.entries(attrs)){if(value===null)el.removeAttribute(key);else el.setAttribute(key,value)}for(const layout of layouts)if(matchMedia(layout.media).matches)for(const patch of layout.patches){const el=target(patch.selector);for(const[key,value]of Object.entries(patch.attributes))el.setAttribute(key,value)}};
 apply();return {apply,queries:layouts.map(l=>matchMedia(l.media))};
}
const rigs=[...document.querySelectorAll('[data-object-scene]')].map(root=>{
 const layout=sceneLayout(root);
 const trigger=root.closest('[data-scene-trigger]')||root, r={root,trigger,local:root.hasAttribute('data-local-reactions')&&!!window.ObjectReactions,hover:false,focus:false,selected:false,energy:0,time:0,parts:[],cords:[]};
 r.parts=[...root.querySelectorAll('[data-rigid-joint]')].map(el=>({el,s:read(el,'data-rigid-joint'),angle:0,velocity:0,orbitAngle:0,orbitVelocity:0,time:0,matrix:[1,0,0,1,0,0]}));
 r.air=[...root.querySelectorAll('[data-air-flow]')].map(el=>({el,s:read(el,'data-air-flow')}));
 r.cords=[...root.querySelectorAll('[data-cord]')].map(el=>({el,s:read(el,'data-cord')}));
 // A stable sibling hit region owns each independent physical root. Attached
 // children inherit that root's input, while other roots keep their own clocks.
 r.updateHits=()=>{for(const p of r.parts)if(p.hit){const b=JSON.parse(p.el.getAttribute('data-reaction-hit')||'null');if(!Array.isArray(b)||b.length!==4||!b.every(Number.isFinite)||b[2]<=0||b[3]<=0)throw new Error('Local physical object needs authored [x,y,width,height] hit bounds: '+p.el.id);const m=p.el.parentNode.getScreenCTM(),scale=Math.max(.01,Math.hypot(m?.a||1,m?.b||0)),w=Math.max(b[2],44/scale),h=Math.max(b[3],44/scale);p.hit.setAttribute('x',b[0]+(b[2]-w)/2);p.hit.setAttribute('y',b[1]+(b[3]-h)/2);p.hit.setAttribute('width',w);p.hit.setAttribute('height',h)}};
 if(r.local){
  root.setAttribute('role','group');if(trigger!==root){trigger.removeAttribute('role');trigger.removeAttribute('tabindex');trigger.removeAttribute('aria-pressed');}trigger.setAttribute('data-scene-local','');
  for(const p of r.parts){
   if(p.s.parent){p.reaction=r.parts.find(parent=>parent.el.id===p.s.parent)?.reaction;continue}
   const hit=document.createElementNS('http://www.w3.org/2000/svg','rect');hit.id=p.el.id+'-hit';hit.setAttribute('class','reaction-trigger');hit.setAttribute('fill','transparent');hit.setAttribute('stroke','none');hit.setAttribute('rx','12');hit.setAttribute('tabindex','0');hit.setAttribute('role','button');hit.setAttribute('aria-label',p.el.getAttribute('data-reaction-label')||'Move this object');hit.setAttribute('data-reaction-owner',p.el.id);p.el.parentNode.append(hit);p.hit=hit;p.reaction=ObjectReactions.create({trigger:hit,region:root});
  }
  r.updateHits();new ResizeObserver(r.updateHits).observe(root);
 }
 if(!r.local){
 trigger.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')r.hover=true});trigger.addEventListener('pointerleave',()=>r.hover=false);
 trigger.addEventListener('pointerdown',()=>r.focus=false);trigger.addEventListener('focusin',()=>r.focus=trigger.matches(':focus-visible'));trigger.addEventListener('focusout',()=>r.focus=false);
 trigger.addEventListener('click',()=>{r.selected=!r.selected;trigger.setAttribute('aria-pressed',String(r.selected))});
 trigger.addEventListener('keydown',e=>{if(trigger.tagName!=='BUTTON'&&(e.key==='Enter'||e.key===' ')){e.preventDefault();trigger.click()}});
 }
 layout.queries.forEach(query=>query.addEventListener('change',()=>{layout.apply();r.parts.forEach(p=>{p.s=read(p.el,'data-rigid-joint');p.angle=p.velocity=p.orbitAngle=p.orbitVelocity=0});r.cords.forEach(c=>c.s=read(c.el,'data-cord'));r.air.forEach(a=>a.s=read(a.el,'data-air-flow'));draw(r,0,true);r.updateHits()}));
 return r;
});
const point=(m,p)=>[m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]];
function draw(r,dt,still=false){
 r.energy+=((r.hover||r.focus||r.selected?1:0)-r.energy)*(1-Math.exp(-dt*4));
 if(still)r.energy=0;r.time+=dt*(1+.45*r.energy);
 const parts={};
 for(const p of r.parts){
  const energy=r.local?(p.reaction?.energy||0):r.energy; if(r.local)p.time+=dt*(1+.8*energy); const time=r.local?p.time:r.time;
  const s=p.s, target=still?0:Math.sin(time*TAU/(s.period||5)+(s.phase||0))*((s.idle||0)+((s.active||0)-(s.idle||0))*energy);
  // Stable small substeps keep spring response invariant across frame rates.
  for(let left=dt;left>0;){const h=Math.min(left,1/120);p.velocity+=(75*(target-p.angle)-17*p.velocity)*h;p.angle+=p.velocity*h;left-=h}
  if(still){p.angle=0;p.velocity=0}
  const a=p.angle*Math.PI/180,c=Math.cos(a),sn=Math.sin(a),o=s.pivot||[0,0];
  let dest=o;
  if(s.orbit){const orb=s.orbit,anchor=orb.anchor,rad=Math.hypot(o[0]-anchor[0],o[1]-anchor[1]),base=Math.atan2(o[0]-anchor[0],anchor[1]-o[1]);
   const aim=still?0:Math.sin(time*TAU/(orb.period||5.5))*((orb.idle||2)+((orb.active||5.5)-(orb.idle||2))*energy)*Math.PI/180;
   for(let left=dt;left>0;){const h=Math.min(left,1/120);p.orbitVelocity+=(64*(aim-p.orbitAngle)-14*p.orbitVelocity)*h;p.orbitAngle+=p.orbitVelocity*h;left-=h}
   if(still){p.orbitAngle=0;p.orbitVelocity=0}
   dest=[anchor[0]+rad*Math.sin(base+p.orbitAngle),anchor[1]-rad*Math.cos(base+p.orbitAngle)];
  }
  if(s.parent){const parent=parts[s.parent];dest=point(parent.matrix,s.attach);const t=(s.rest_angle||0)*Math.PI/180+a;dest=[dest[0]+Math.sin(t)*(s.length||0),dest[1]+Math.cos(t)*(s.length||0)]}
  p.matrix=[c,sn,-sn,c,dest[0]-c*o[0]+sn*o[1],dest[1]-sn*o[0]-c*o[1]];
  p.el.setAttribute('transform',`matrix(${p.matrix.map(n=>n.toFixed(5)).join(' ')})`);parts[p.el.id]=p;
 }
 const endpoint=e=>e.part?point(parts[e.part].matrix,e.point):e.point;
 for(const c of r.cords){const a=endpoint(c.s.from),b=endpoint(c.s.to),sag=c.s.sag||0;
  c.el.setAttribute('d',`M${a} C${a[0]+(b[0]-a[0])*.33+sag},${a[1]+(b[1]-a[1])*.33} ${a[0]+(b[0]-a[0])*.67+sag},${a[1]+(b[1]-a[1])*.67} ${b}`);
 }
 for(const air of r.air)air.el.style.strokeDashoffset=String(still?0:-(r.time*(air.s.speed||45))%(air.s.span||440));
 r.root.dataset.motionState=still?'still':(r.local?r.parts.some(p=>(p.reaction?.energy||0)>.1):r.energy>.1)?'active':'idle';
}
let frame=0,last=0,printing=false;
function tick(now){const dt=Math.min((now-last)/1000||0,1/30);last=now;for(const r of rigs)if(r.root.closest('[data-motion-region]')?.dataset.inView!=='false')draw(r,dt);frame=requestAnimationFrame(tick)}
function sync(s){if(s.paused||s.reduced||printing)rigs.forEach(r=>draw(r,0,true));if(s.paused||s.reduced||s.hidden||printing){cancelAnimationFrame(frame);frame=0}else if(!frame){last=performance.now();frame=requestAnimationFrame(tick)}}
window.addEventListener('beforeprint',()=>{printing=true;sync(sceneState())});window.addEventListener('afterprint',()=>{printing=false;sync(sceneState())});
rigs.forEach(r=>draw(r,0,true));
if(window.WebsiteEffects)window.WebsiteEffects.subscribe(sync);else{document.addEventListener('visibilitychange',()=>sync(sceneState()));matchMedia('(prefers-reduced-motion:reduce)').addEventListener('change',()=>sync(sceneState()));sync(sceneState())}
window.ObjectScenes={version:1,rigs:rigs.map(r=>r.root)};
})();
