/* Effect design → independent inputs → rigid paint. No scene-wide hover transform. */
(()=>{'use strict';
const R=window.ObjectReactions;if(!R)return;const NS='http://www.w3.org/2000/svg';
// Navigation stays a native link; only its original emblem and cord move.
for(const link of document.querySelectorAll('.logo')){
 const emblem=link.querySelector('#reactive-logo-kite'),cord=link.querySelector('#reactive-logo-cord');if(!emblem)continue;
 const x={value:0,velocity:0},y={value:0,velocity:0},turn={value:0,velocity:0};
 R.create({trigger:link,onFrame:({dt,energy,still})=>{
  if(still)for(const s of[x,y,turn])s.value=s.velocity=0;
  const a=still?0:R.spring(turn,-10*energy,dt,{min:-10,max:0}),dx=still?0:R.spring(x,-14*energy,dt,{min:-14,max:0}),dy=still?0:R.spring(y,-26*energy,dt,{min:-26,max:0});
  emblem.setAttribute('transform',`translate(${dx} ${dy}) rotate(${a} 47 29)`);
  cord.setAttribute('d',`M${47+dx} ${29+dy}C${47+dx} ${47+dy} 24 54 24 71C24 80 31 86 41 86`);
  return Math.abs(x.velocity)+Math.abs(y.velocity)+Math.abs(turn.velocity)>.01;
 }});
}
// The whole beak/head is one rigid object. Fixed feet and grip remain in place.
const bird=document.querySelector('#guided-bird-hit'),head=document.querySelector('#reactive-bird-head');
if(bird&&head){const a={value:0,velocity:0};let phase=0;R.create({trigger:bird,region:bird.closest('[data-object-scene]'),idle:true,onFrame:({dt,time,energy,still})=>{
 phase+=dt*(1.5+energy*2.5);const target=Math.sin(phase)*(.25+2.75*energy);if(still)a.value=a.velocity=0;
 const angle=still?0:R.spring(a,target,dt,{stiffness:100,damping:20,min:-3,max:3});head.setAttribute('transform',`rotate(${angle} 278 670)`);
}})}
// Original rooted trunks stay fixed. Canopy, air marks and a three-leaf pool each
// have a separate owner; released leaves inherit their real attachment transform.
for(const tree of document.querySelectorAll('[data-reactive-tree]')){
 const prefix=tree.id,scene=tree.closest('svg'),canopy=tree.querySelector('#'+prefix+'-canopy'),attached=tree.querySelector('#'+prefix+'-attached-leaves'),leafNodes=[...attached.children],marks=tree.querySelector('.tree-gust-marks'),a={value:0,velocity:0};
 const holder=document.createElementNS(NS,'g');holder.setAttribute('transform',tree.getAttribute('transform'));const hit=document.createElementNS(NS,'rect');
 for(const[k,v]of Object.entries({id:prefix+'-hit',x:4,y:20,width:212,height:295,fill:'transparent',stroke:'none',rx:18,tabindex:0,role:'button','aria-label':'Send a breeze through the tree',class:'reaction-trigger'}))hit.setAttribute(k,v);
 holder.append(hit);scene.append(holder);scene.setAttribute('role','group');
 const resize=()=>{const m=holder.getScreenCTM();if(!m)return;const scale=Math.max(.01,Math.hypot(m.a,m.b)),w=Math.max(212,44/scale),h=Math.max(295,44/scale);const r=scene.getBoundingClientRect();let x=110-w/2;const left=x*m.a+m.e,right=(x+w)*m.a+m.e;if(left<r.left)x+=(r.left-left)/scale;if(right>r.right)x-=(right-r.right)/scale;hit.setAttribute('x',x);hit.setAttribute('y',167.5-h/2);hit.setAttribute('width',w);hit.setAttribute('height',h)};new ResizeObserver(resize).observe(scene);resize();
 const spots=[[60,116,-30],[148,116,30],[104,62,-15]];
 const pool=R.particles({nodes:[...tree.querySelector('.detached-leaves').children],origins:spots.map(([x,y,angle])=>()=>{const r=a.value*Math.PI/180,c=Math.cos(r),s=Math.sin(r);return[105+(x-105)*c-(y-180)*s,180+(x-105)*s+(y-180)*c,angle+a.value]}),ground:309,gravity:125,wind:24,interval:.38,lifetime:2.2,onSpawn:p=>leafNodes[p.originIndex].setAttribute('opacity','0'),onRetire:p=>leafNodes[p.originIndex].setAttribute('opacity','1')});
 R.create({trigger:hit,region:scene,idle:true,onDestroy:()=>pool.clear(),onFrame:({dt,time,energy,still})=>{
  if(still){a.value=a.velocity=0;pool.clear()}
  const target=Math.sin(time*1.3)*.2+(Math.sin(time*14)*3+Math.sin(time*8)*2)*energy;
  const angle=still?0:R.spring(a,target,dt,{stiffness:380,damping:20,min:-5,max:5});canopy.setAttribute('transform',`rotate(${angle} 105 180)`);
  attached.setAttribute('opacity',still?0:energy);marks.setAttribute('opacity',still?0:energy*.65);marks.setAttribute('transform',`translate(${Math.sin(time*8)*energy*3} 0)`);
  return !still&&pool.update(dt,energy);
 }});
}
// Stable real CTA hit boxes, subtly expanding paint. Arrow keeps its own channel.
for(const button of document.querySelectorAll('.button')){
 const surface=document.createElement('span');surface.className='reaction-button-surface';surface.setAttribute('aria-hidden','true');button.prepend(surface);button.setAttribute('data-reaction-button','');
 R.create({trigger:button,onFrame:({energy})=>{surface.style.transform=`translateY(${-1.5*energy}px) scale(${1+.025*energy})`;surface.style.backgroundColor=energy>.05?'var(--butter)':''}});
}
})();
