/* Original object-local input envelopes. Keep hit geometry outside moving paint.
   This controller owns input/time, never an existing object's transform. */
(()=>{'use strict';
const items=new Set(),byTrigger=new WeakMap(),regionVisibility=new WeakMap(),media=matchMedia('(prefers-reduced-motion: reduce)');
let lifecycle={paused:false,reduced:media.matches,hidden:document.hidden},printing=false,raf=0,last=0;
const blocked=()=>lifecycle.paused||lifecycle.reduced||lifecycle.hidden||printing;
const observer=new IntersectionObserver(entries=>{for(const e of entries){regionVisibility.set(e.target,e.isIntersecting);for(const c of items)if(c.region===e.target){c.visible=e.isIntersecting;c.dirty=true;if(!c.visible){c.hover=false;c.touchUntil=0;c.target=0}}}wake()},{threshold:0});
function wake(){if(!raf&&!blocked()&&[...items].some(c=>c.visible&&(c.dirty||c.idle||c.hover||c.focus||c.touchUntil>performance.now()||c.energy>.0001||c.keepAlive))){last=0;raf=requestAnimationFrame(frame)}}
function draw(c,dt,still=false){
 c.dirty=false;
 const target=!still&&(c.hover||c.focus||performance.now()<c.touchUntil)?1:0;c.target=target;
 if(still)c.energy=0;else{c.energy+=(target-c.energy)*(1-Math.exp(-dt*(target?c.enterRate:c.exitRate)));if(c.energy<.0001)c.energy=0;c.time+=dt}
 c.trigger.style.setProperty('--reaction-energy',c.energy.toFixed(5));
 c.keepAlive=!!c.onFrame({dt,time:c.time,energy:c.energy,target,pointer:c.pointer,still,controller:c});
 c.trigger.dataset.reactionState=still?'still':target?'active':c.energy>.002||c.keepAlive?'returning':'idle';
}
function frame(now){raf=0;if(blocked()){last=0;return}const dt=Math.min((now-(last||now))/1000,.034);last=now;
 for(const c of items)if(c.visible&&(c.dirty||c.idle||c.hover||c.focus||c.touchUntil>now||c.energy>.0001||c.keepAlive))draw(c,dt);
 if([...items].some(c=>c.visible&&(c.dirty||c.idle||c.hover||c.focus||c.touchUntil>now||c.energy>.0001||c.keepAlive)))raf=requestAnimationFrame(frame);
}
function sync(state){lifecycle=state;if(blocked()){cancelAnimationFrame(raf);raf=0;last=0;if(state.paused||state.reduced||printing)for(const c of items)draw(c,0,true)}else{for(const c of items)c.dirty=true;wake()}}
function create(options){const trigger=options.trigger;if(!(trigger instanceof Element))throw new TypeError('Object reaction needs a stable trigger Element');if(byTrigger.has(trigger))throw new Error('One reaction owner per stable trigger');
 const region=options.region||trigger.closest('[data-motion-region]')||trigger;
 const c={trigger,region,visible:regionVisibility.get(region)||false,hover:false,focus:false,touchUntil:0,energy:0,target:0,time:0,keepAlive:false,dirty:true,idle:!!options.idle,enterRate:options.enterRate||9,exitRate:options.exitRate||7,touchMs:options.touchMs||1300,onFrame:options.onFrame||(()=>false),pointer:{x:0,y:0},listeners:[]};
 trigger.setAttribute('data-reaction-input','');
 const owns=e=>(e.composedPath().find(el=>el instanceof Element&&(byTrigger.has(el)||el.matches('button,a,input,select,textarea,[role="button"]')))||trigger)===trigger;
 function on(type,fn){const listener=e=>{c.dirty=true;fn(e);wake()};trigger.addEventListener(type,listener);c.listeners.push([type,listener])}
 // pointerover bubbles when moving between nested controls; pointerenter alone
 // would latch the parent while its independently owned child is hovered.
 on('pointerover',e=>{if(e.pointerType==='mouse'){c.hover=owns(e);wake()}});
 on('pointerleave',()=>{c.hover=false;c.pointer={x:0,y:0};wake()});
 on('pointermove',e=>{if(e.pointerType!=='mouse')return;const r=trigger.getBoundingClientRect();c.pointer={x:Math.max(-1,Math.min(1,(e.clientX-r.left)/Math.max(1,r.width)*2-1)),y:Math.max(-1,Math.min(1,(e.clientY-r.top)/Math.max(1,r.height)*2-1))}});
 on('pointerdown',e=>{if(!owns(e))return;c.focus=false;if(e.pointerType!=='mouse'){c.touchUntil=performance.now()+c.touchMs;wake()}});
 on('pointercancel',()=>{c.hover=false;c.touchUntil=0;wake()});
 on('focusin',e=>{if(e.target===trigger){c.focus=trigger.matches(':focus-visible');wake()}});
 on('focusout',()=>{c.focus=false;wake()});
 on('click',e=>{if(owns(e)){c.touchUntil=performance.now()+c.touchMs;wake()}});
 on('keydown',e=>{if(!owns(e)||(e.key!=='Enter'&&e.key!==' '))return;if(trigger.getAttribute('role')==='button'&&!trigger.matches('button,a')){e.preventDefault();c.touchUntil=performance.now()+c.touchMs;wake()}});
 c.destroy=()=>{draw(c,0,true);options.onDestroy?.();for(const[type,fn]of c.listeners)trigger.removeEventListener(type,fn);items.delete(c);byTrigger.delete(trigger);if(![...items].some(x=>x.region===region))observer.unobserve(region);trigger.style.removeProperty('--reaction-energy');delete trigger.dataset.reactionState;trigger.removeAttribute('data-reaction-input');if(!items.size){cancelAnimationFrame(raf);raf=0}};
 c.pulse=()=>{c.touchUntil=performance.now()+c.touchMs;wake()};
 byTrigger.set(trigger,c);items.add(c);observer.observe(region);draw(c,0,blocked());wake();return c;
}
// Critically/over-damped rigid response. Call with bounded targets in one declared
// coordinate system. Constraints/contacts stay in the consumer's physical model.
function spring(state,target,dt,{stiffness=100,damping=20,min=-Infinity,max=Infinity}={}){
 for(let left=Math.min(dt,.05);left>0;){const h=Math.min(left,1/120);state.velocity+=((target-state.value)*stiffness-state.velocity*damping)*h;state.value+=state.velocity*h;left-=h}
 if(state.value<min||state.value>max){state.value=Math.max(min,Math.min(max,state.value));state.velocity=0}return state.value;
}
// Bounded secondary particles. Emission starts at caller-supplied real attachment
// points; after release each particle has its own gravity/drag/lifetime.
function particles({nodes,origins,ground=300,gravity=110,drag=1.5,interval=.24,lifetime=1.8,wind=32,onSpawn=()=>{},onRetire=()=>{}}){
 const pool=nodes.map(el=>({el,alive:false,age:0,x:0,y:0,vx:0,vy:0,angle:0,spin:0}));let credit=0,sequence=0;
 function clear(){credit=0;pool.forEach(p=>{if(p.alive)onRetire(p);p.alive=false;p.el.setAttribute('opacity','0')})}
 clear();return {pool,clear,update(dt,energy){credit=Math.min(interval,credit+dt*energy);if(energy>.12&&credit>=interval){const p=pool.find(x=>!x.alive);if(p){const originIndex=sequence%origins.length,origin=origins[originIndex]();Object.assign(p,{alive:true,originIndex,age:0,x:origin[0],y:origin[1],vx:wind*(.8+(sequence%3)*.16),vy:5+(sequence%3)*3,angle:origin[2]||0,spin:((sequence%2)?1:-1)*(32+(sequence%3)*11)});onSpawn(p);sequence++;credit=0}}
  for(const p of pool){if(!p.alive)continue;p.age+=dt;p.vx+=(wind*.25-p.vx)*drag*dt;p.vy+=gravity*dt;p.x+=p.vx*dt;p.y=Math.min(ground,p.y+p.vy*dt);p.angle+=p.spin*dt;if(p.y===ground){p.vx*=Math.exp(-dt*10);p.vy=0;p.spin*=Math.exp(-dt*10)}if(p.age>=lifetime){p.alive=false;p.el.setAttribute('opacity','0');onRetire(p);continue}p.el.setAttribute('transform',`translate(${p.x.toFixed(3)} ${p.y.toFixed(3)}) rotate(${p.angle.toFixed(3)})`);p.el.setAttribute('opacity',String(Math.min(1,(lifetime-p.age)/.35)))}return pool.some(p=>p.alive)
 }};
}
if(window.WebsiteEffects)WebsiteEffects.subscribe(sync);else{media.addEventListener('change',()=>sync({...lifecycle,reduced:media.matches}));document.addEventListener('visibilitychange',()=>sync({...lifecycle,hidden:document.hidden}))}
window.addEventListener('beforeprint',()=>{printing=true;sync(lifecycle)});window.addEventListener('afterprint',()=>{printing=false;sync(lifecycle)});
window.ObjectReactions={version:1,create,spring,particles,get:trigger=>byTrigger.get(typeof trigger==='string'?document.querySelector(trigger):trigger),get controllers(){return[...items]}};
})();
