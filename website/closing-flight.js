/* Illustrative steady-breeze flight: rigid sails, constant-length bowed tether profile, flexible
   attached tails and telltales. This is bounded kinematics, not a fluid solver. */
(()=>{'use strict';
const host=document.querySelector('#closing');if(!host)return;
const media=matchMedia('(prefers-reduced-motion: reduce)');
let reduced=media.matches,paused=false,hidden=document.hidden,printing=false;
const scenes=[...host.querySelectorAll('[data-kite-flight]')].map(svg=>({svg,visible:false,time:0,last:0,raf:0,energy:0,parts:[...svg.querySelectorAll('[data-flying-kite]')].map((el,index)=>{
 const [ax,ay,x,y,scale,turn]=el.dataset.pose.split(',').map(Number),tow=el.dataset.tow.split(',').map(Number);
 return{el,index,phase:0,reaction:null,anchor:[ax,ay],base:Math.atan2(x-ax,ay-y),length:Math.hypot(x-ax,ay-y),angle:Math.atan2(x-ax,ay-y),velocity:0,scale,turn,tow,bow:+el.dataset.lineBow||.1,line:svg.querySelector('#'+el.id+'-line'),tail:svg.querySelector('#'+el.id+'-tail'),bows:[...svg.querySelectorAll('#'+el.id+'-tail-rig [data-tail-bow]')],ribbon:svg.querySelector('#'+el.id+'-ribbon'),tailPoint:el.dataset.tail?el.dataset.tail.split(',').map(Number):null};
})}));
// Each stable local control drives one sail plus its physically attached line/tail.
// The old section-wide hover energy is intentionally retired.
for(const scene of scenes){
 scene.svg.setAttribute('role','group');
 for(const part of scene.parts){
  const hit=document.createElementNS('http://www.w3.org/2000/svg','path');
  hit.id=part.el.id+'-hit';hit.setAttribute('width','0');hit.setAttribute('height','0');hit.setAttribute('rx','18');hit.setAttribute('fill','transparent');hit.setAttribute('stroke','transparent');hit.setAttribute('stroke-width','80');hit.setAttribute('stroke-linejoin','round');hit.setAttribute('class','reaction-trigger');hit.setAttribute('tabindex','0');hit.setAttribute('role','button');hit.setAttribute('aria-label','Give the '+part.el.dataset.flyingKite+' kite a gust');hit.setAttribute('data-reaction-owner',part.el.id);scene.svg.append(hit);
  part.hit=hit;part.reaction=window.ObjectReactions?.create({trigger:hit,region:scene.svg});
 }
 const silhouettes={diamond:'M120 22 215 115 120 258 25 115Z',delta:'M120 60 224 198Q175 174 120 170Q65 174 16 198Z',rokkaku:'M120 25 204 78 204 208 120 265 36 208 36 78Z',box:'M56 75 119 43 191 77 191 233 126 267 56 231Z',parafoil:'M26 92Q47 63 64 69Q82 45 102 58Q120 42 138 58Q158 45 176 69Q193 63 214 92L201 201Q120 161 39 201Z'};
 scene.updateHits=()=>{for(const part of scene.parts){const x=part.anchor[0]+part.length*Math.sin(part.base),y=part.anchor[1]-part.length*Math.cos(part.base);part.hit.setAttribute('d',silhouettes[part.el.dataset.flyingKite]);part.hit.setAttribute('transform',`translate(${x} ${y}) rotate(${part.turn}) scale(${part.scale}) translate(${-part.tow[0]} ${-part.tow[1]})`)}};
 new ResizeObserver(scene.updateHits).observe(scene.svg);scene.updateHits();
}
const running=s=>s.visible&&!paused&&!reduced&&!hidden&&!printing;
function tailPoint(x,y,s,t,energy){return[x+105*s+14*Math.sin(s*7-t*2.2)*s*(1+energy*.25),y+100*s+16*Math.sin(s*6-t*2.2)*s]}
function paint(part,time,energy){
 const [ax,ay]=part.anchor,x=ax+part.length*Math.sin(part.angle),y=ay-part.length*Math.cos(part.angle);
 const turn=part.turn+(part.angle-part.base)*55,rad=turn*Math.PI/180;
 part.el.setAttribute('transform',`translate(${x} ${y}) rotate(${turn}) scale(${part.scale}) translate(${-part.tow[0]} ${-part.tow[1]})`);
 const dxLine=x-ax,dyLine=y-ay,cx=ax+dxLine*.5-dyLine*part.bow,cy=ay+dyLine*.5+dxLine*part.bow;
 part.line.setAttribute('d',`M${ax} ${ay}Q${cx} ${cy} ${x} ${y}`);
 if(part.ribbon){
  const f=+part.ribbon.dataset.lineFraction,rx=(1-f)**2*ax+2*(1-f)*f*cx+f*f*x,ry=(1-f)**2*ay+2*(1-f)*f*cy+f*f*y,wave=Math.sin(time*2.2-part.index*.7)*6;
  part.ribbon.querySelector('path').setAttribute('d',`M${rx} ${ry}c18 ${13+wave} 32 ${-8-wave} 48 6`);
  const knot=part.ribbon.querySelector('circle');knot.setAttribute('cx',rx);knot.setAttribute('cy',ry);
 }
 if(part.tail&&part.tailPoint){
  const dx=(part.tailPoint[0]-part.tow[0])*part.scale,dy=(part.tailPoint[1]-part.tow[1])*part.scale;
  const tx=x+dx*Math.cos(rad)-dy*Math.sin(rad),ty=y+dx*Math.sin(rad)+dy*Math.cos(rad);
  const points=Array.from({length:37},(_,i)=>tailPoint(tx,ty,i/36,time,energy));
  part.tail.setAttribute('d','M'+points.map(p=>p.join(' ')).join('L'));
  part.bows.forEach(bow=>{const s=+bow.dataset.tailBow,[bx,by]=tailPoint(tx,ty,s,time,energy),p=tailPoint(tx,ty,s-.01,time,energy),q=tailPoint(tx,ty,s+.01,time,energy),angle=Math.atan2(q[1]-p[1],q[0]-p[0])*180/Math.PI-90;bow.setAttribute('transform',`translate(${bx} ${by}) rotate(${angle})`)});
 }
}
function frame(s,now){
 s.raf=0;if(!running(s)){s.last=0;return}
 const dt=Math.min((now-(s.last||now))/1000,.034);s.last=now;
 s.time+=dt;
 s.parts.forEach(p=>{
  const energy=p.reaction?.energy||0;p.phase+=dt*(1+1.9*energy);
  const gust=Math.sin(p.phase*.92)*.035+Math.sin(p.phase*.51+p.index*.9)*.014;
  const radiusScale=Math.min(1,420/p.length),sweep=Math.max(-.09,Math.min(.09,gust*(1+1.8*energy)))*radiusScale;
  const desired=p.base+sweep,stiffness=5.5+24*energy,damping=3.4+6.5*energy;
  for(let left=dt;left>0;){const h=Math.min(left,1/120);p.velocity+=((desired-p.angle)*stiffness-p.velocity*damping)*h;p.angle+=p.velocity*h;left-=h}
  p.el.dataset.gust=energy.toFixed(4);paint(p,p.phase,energy);
 });
 s.raf=requestAnimationFrame(t=>frame(s,t));
}
function sync(){scenes.forEach(s=>{if(running(s)){if(!s.raf)s.raf=requestAnimationFrame(t=>frame(s,t))}else{cancelAnimationFrame(s.raf);s.raf=0;s.last=0}})}
if(window.WebsiteEffects)WebsiteEffects.subscribe(state=>{paused=state.paused;reduced=state.reduced;hidden=state.hidden;sync()});
media.addEventListener('change',()=>{reduced=media.matches;sync()});
document.addEventListener('visibilitychange',()=>{hidden=document.hidden;sync()});
window.addEventListener('beforeprint',()=>{printing=true;sync()});window.addEventListener('afterprint',()=>{printing=false;sync()});
const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{const s=scenes.find(x=>x.svg===e.target);if(s){s.visible=e.isIntersecting;if(s.visible)s.updateHits()}});sync()},{threshold:.03});
scenes.forEach(s=>observer.observe(s.svg));
})();
