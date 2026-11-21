/* Original, brand-independent internal-part motion and a constrained force model.
   SVG coordinates are design units. Roots and reading surfaces never transform. */
(()=>{'use strict';
const TAU=Math.PI*2,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const parse=(el,name,fallback)=>{try{return JSON.parse(el.getAttribute(name))??fallback}catch{return fallback}};
const state=()=>window.WebsiteEffects?.state??{paused:false,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches,hidden:document.hidden};
const visible=el=>el.closest('[data-motion-region]')?.dataset.inView!=='false';
// Object scenes use object-scenes.js; flat-image deformation is not an adapter.
const local=[];
const rigs=[...document.querySelectorAll('[data-articulation]')].map(root=>{
 const trigger=root.closest('[data-motion-trigger]')||root,rig={root,trigger,hover:false,focus:false,touch:false,energy:0,time:0};
 rig.parts=[...root.querySelectorAll('[data-part-motion]')].map(el=>({el,spec:parse(el,'data-part-motion',{}),x:0,y:0,a:0}));
 trigger.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')rig.hover=true});
 trigger.addEventListener('pointerleave',()=>rig.hover=false);
 trigger.addEventListener('pointerdown',()=>rig.focus=false);trigger.addEventListener('focusin',()=>rig.focus=trigger.matches(':focus-visible'));
 trigger.addEventListener('focusout',()=>rig.focus=false);
 trigger.addEventListener('click',e=>{if(trigger.tagName==='BUTTON'){rig.touch=!rig.touch;trigger.setAttribute('aria-pressed',String(rig.touch))}});
 return rig;
});
function drawRig(r,dt,staticPose=false){
 const active=r.hover||r.focus||r.touch;
 r.energy+=((active?1:0)-r.energy)*(1-Math.exp(-dt*10));
 if(staticPose)r.energy=0;
 r.time+=dt*(1+r.energy*.8);
 r.root.dataset.motionState=staticPose?'still':active?'active':'idle';
 const byId={};
 for(const p of r.parts){const s=p.spec,phase=r.time*TAU/(s.period||3.6)+(s.phase||0),wave=Math.sin(phase),idle=s.idle||{},on=s.active||{};
  for(const key of ['x','y','a'])p[key]=staticPose?0:(Number(idle[key]||0)+(Number(on[key]||0)-Number(idle[key]||0))*r.energy)*wave+Number((s.open||{})[key]||0)*r.energy;
  const o=s.origin||[0,0];p.el.setAttribute('transform',`translate(${p.x.toFixed(3)} ${p.y.toFixed(3)}) rotate(${p.a.toFixed(3)} ${o[0]} ${o[1]})`);
  byId[p.el.dataset.part]={x:Number(p.el.dataset.cx||0)+p.x,y:Number(p.el.dataset.cy||0)+p.y};
 }
 r.root.querySelectorAll('[data-part-link]').forEach(line=>{const [from,to]=line.dataset.partLink.split(' '),a=byId[from],b=byId[to];if(a&&b)line.setAttribute('d',`M${a.x} ${a.y}L${b.x} ${b.y}`)});
 r.root.querySelectorAll('[data-link-signal]').forEach(dot=>{const path=r.root.querySelector(`[data-part-link="${dot.dataset.linkSignal}"]`);if(!path)return;const distance=staticPose?0:((r.time/(Number(dot.dataset.period)||2.5)+(Number(dot.dataset.phase)||0))%1);const p=path.getPointAtLength(path.getTotalLength()*distance);dot.setAttribute('cx',p.x);dot.setAttribute('cy',p.y)});
}
const forces=[...document.querySelectorAll('[data-force-model]')].map(root=>{
 const spec=parse(root,'data-force-model',{}),input=document.querySelector(spec.input),f={root,spec,input,body:root.querySelector('[data-force-body]'),tether:root.querySelector('[data-force-tether]'),tail:root.querySelector('[data-force-tail]'),phase:0,time:0,angle:0,velocity:0,intensity:0,wasAssembled:true,assemblyTime:2,lastMatrix:[1,0,0,1,0,0]};
 f.pieces=[...root.querySelectorAll('[data-loose-piece]')].map((el,i)=>{const s=parse(el,'data-loose-piece',{}),pts=s.vertices,c=[pts.reduce((a,p)=>a+p[0],0)/pts.length,pts.reduce((a,p)=>a+p[1],0)/pts.length];let edge=null;for(let k=0;k<pts.length;k++){const a=pts[k],b=pts[(k+1)%pts.length],length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(!edge||length>edge.length)edge={a,b,length}}
 let rest=-Math.atan2(edge.b[1]-edge.a[1],edge.b[0]-edge.a[0]);const mid=[(edge.a[0]+edge.b[0])/2-c[0],(edge.a[1]+edge.b[1])/2-c[1]];if(mid[0]*Math.sin(rest)+mid[1]*Math.cos(rest)<0)rest+=Math.PI;
 return {el,c,pts:pts.map(p=>[p[0]-c[0],p[1]-c[1]]),x:c[0],y:c[1],vx:0,vy:0,a:0,va:0,rest,seed:i*2.1+.4,mass:s.mass||1};});
 const read=()=>{const min=Number(input?.min||0),max=Number(input?.max||1);f.target=clamp((Number(input?.value||0)-min)/(max-min||1),0,1);if(state().paused||state().reduced)drawForce(f,0,true)};input?.addEventListener('input',read);read();f.intensity=f.target;
 new MutationObserver(()=>{if(state().paused||state().reduced)drawForce(f,0,true)}).observe(root.closest('[data-assembled]')||root,{attributes:true,attributeFilter:['data-assembled']});return f;
});
const matrixPoint=(m,p)=>[m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]];
function pieceBounds(p){const c=Math.cos(p.a),s=Math.sin(p.a),v=p.pts.map(q=>[q[0]*c-q[1]*s,q[0]*s+q[1]*c]);return {left:Math.min(...v.map(q=>q[0])),right:Math.max(...v.map(q=>q[0])),top:Math.min(...v.map(q=>q[1])),bottom:Math.max(...v.map(q=>q[1]))}}
function drawLoose(f,dt,still){const spec=f.spec,ground=spec.ground_y||420,left=spec.left||30,right=spec.right||1090,top=spec.top||24,w=Math.sqrt(f.intensity);
 for(const p of f.pieces){
  if(still){if(f.target===0){p.a=p.rest;const b=pieceBounds(p);p.y=ground-b.bottom;p.vx=p.vy=p.va=0}else{p.x=p.c[0]+Math.sin(p.seed)*170;p.y=p.c[1]+Math.cos(p.seed)*45;p.a=.12*Math.sin(p.seed)}}
  for(let remaining=still?0:dt;remaining>0;){const h=Math.min(remaining,1/120);remaining-=h;
   const ax=w*(70+330*Math.sin(f.time*.8+p.seed)+110*Math.sin(f.time*1.67+p.seed*.7))/p.mass;
   const ay=340*(1-w)-w*320*Math.sin(f.time*.97+p.seed);
   p.vx+=(ax-1.35*p.vx)*h;p.vy+=(ay-1.1*p.vy)*h;p.va+=(w*3.6*Math.sin(f.time*1.1+p.seed)-3*p.va)*h;
   p.x+=p.vx*h;p.y+=p.vy*h;p.a+=p.va*h;
   let b=pieceBounds(p);
   if(p.x+b.left<left){p.x=left-b.left;p.vx=Math.abs(p.vx)*.55}if(p.x+b.right>right){p.x=right-b.right;p.vx=-Math.abs(p.vx)*.55}
   if(p.y+b.top<top){p.y=top-b.top;p.vy=Math.abs(p.vy)*.4}
   if(p.y+b.bottom>=ground){p.y=ground-b.bottom;if(p.vy>0)p.vy=-p.vy*.16;if(f.target===0){const delta=Math.atan2(Math.sin(p.rest-p.a),Math.cos(p.rest-p.a));p.va+=(55*delta-12*p.va)*h;p.vx*=Math.exp(-h*9);if(Math.abs(delta)<.002&&Math.abs(p.va)<.015){p.a=p.rest;p.va=0}b=pieceBounds(p);p.y=ground-b.bottom}}
  }
  const c=Math.cos(p.a),s=Math.sin(p.a),m=[c,s,-s,c,p.x-c*p.c[0]+s*p.c[1],p.y-s*p.c[0]-c*p.c[1]];p.el.style.transform=`matrix(${m.join(',')})`;
 }

 // Resolve grounded contacts so a resting sheet cannot disappear inside another.
 if(f.target===0){for(let pass=0;pass<6;pass++){const resting=f.pieces.filter(p=>p.y+pieceBounds(p).bottom>=ground-.3).sort((a,b)=>a.x-b.x);for(let i=1;i<resting.length;i++){const a=resting[i-1],b=resting[i],ab=pieceBounds(a),bb=pieceBounds(b),overlap=a.x+ab.right-(b.x+bb.left)+8;if(overlap>0){a.x-=overlap/2;b.x+=overlap/2}}for(const p of resting){const b=pieceBounds(p);p.x=clamp(p.x,left-b.left,right-b.right)}}
  for(const p of f.pieces){const c=Math.cos(p.a),s=Math.sin(p.a);p.el.style.transform=`matrix(${c},${s},${-s},${c},${p.x-c*p.c[0]+s*p.c[1]},${p.y-s*p.c[0]-c*p.c[1]})`}
 }
}
function slackCord(anchor,end,length,ground){
 const arcLength=control=>{let sum=0;const n=32;for(let i=0;i<=n;i++){const t=i/n,dx=2*((1-t)*(control[0]-anchor[0])+t*(end[0]-control[0])),dy=2*((1-t)*(control[1]-anchor[1])+t*(end[1]-control[1]));sum+=(i===0||i===n?1:i%2?4:2)*Math.hypot(dx,dy)}return sum/(3*n)};
 let lo=0,hi=length*2;for(let i=0;i<20;i++){const mid=(lo+hi)/2;if(arcLength([anchor[0]+mid,ground])<length)lo=mid;else hi=mid}return `M${anchor}Q${anchor[0]+(lo+hi)/2} ${ground} ${end}`;
}
function drawForce(f,dt,staticPose=false){
 const s=f.spec,anchor=s.anchor||[250,390],rest=s.rest||[250,160],radius=Math.hypot(rest[0]-anchor[0],rest[1]-anchor[1]),zero=Math.atan2(rest[0]-anchor[0],anchor[1]-rest[1]),assembled=f.root.closest('[data-assembled]')?.dataset.assembled!=='false';
 f.time+=dt;f.intensity+=(f.target-f.intensity)*(1-Math.exp(-dt*4));if(staticPose)f.intensity=f.target;
 const lift=clamp(f.intensity/.25,0,1),smoothLift=lift*lift*(3-2*lift),restDrop=(s.ground_y||420)-(rest[1]+(s.body_bottom_offset||128));
 const hz=f.target===0?0:(s.low_hz||.16)+((s.high_hz||.60)-(s.low_hz||.16))*f.intensity;
 f.phase+=dt*TAU*hz;
 const amplitude=f.target===0?0:((s.low_angle||.07)+((s.high_angle||.65)-(s.low_angle||.07))*f.intensity)*smoothLift;
 const target=Math.sin(f.phase)*amplitude;
 for(let left=dt;left>0;){const h=Math.min(left,1/120);f.velocity+=(90*(target-f.angle)-18*f.velocity)*h;f.angle+=f.velocity*h;left-=h}
 if(staticPose){f.angle=0;f.velocity=0}
 const effectiveRadius=radius-restDrop*(1-smoothLift),angle=zero+f.angle,x=anchor[0]+effectiveRadius*Math.sin(angle),y=anchor[1]-effectiveRadius*Math.cos(angle),bank=staticPose?0:clamp(f.velocity*9,-18,18)*smoothLift,a=bank*Math.PI/180,c=Math.cos(a),sn=Math.sin(a),matrix=[c,sn,-sn,c,x-c*rest[0]+sn*rest[1],y-sn*rest[0]-c*rest[1]];
 if(!assembled&&f.wasAssembled){for(const p of f.pieces){const pos=matrixPoint(f.lastMatrix,p.c);p.x=pos[0];p.y=pos[1];p.a=Math.atan2(f.lastMatrix[1],f.lastMatrix[0]);p.vx=35*Math.sin(p.seed);p.vy=-20*Math.cos(p.seed);p.va=.15*Math.sin(p.seed)}}
 if(assembled&&!f.wasAssembled){f.assemblyTime=0;f.pieces.forEach(p=>p.start={x:p.x,y:p.y,a:p.a})}
 f.assemblyTime+=dt;
 f.body?.setAttribute('transform',assembled?`matrix(${matrix.join(' ')})`:'matrix(1 0 0 1 0 0)');
 if(assembled){for(const p of f.pieces){if(f.assemblyTime>=1||staticPose){p.el.style.transform='matrix(1,0,0,1,0,0)'}else{const t=clamp(f.assemblyTime,0,1),e=t*t*(3-2*t),dest=matrixPoint(matrix,p.c),wx=p.start.x+(dest[0]-p.start.x)*e,wy=p.start.y+(dest[1]-p.start.y)*e,local=[c*(wx-matrix[4])+sn*(wy-matrix[5]),-sn*(wx-matrix[4])+c*(wy-matrix[5])],pa=p.start.a*(1-e),co=Math.cos(pa),si=Math.sin(pa);p.el.style.transform=`matrix(${co},${si},${-si},${co},${local[0]-co*p.c[0]+si*p.c[1]},${local[1]-si*p.c[0]-co*p.c[1]})`}}}
 else drawLoose(f,dt,staticPose);
 // A resting assembled body has slack cord; the airborne tether is taut.
 f.tether?.setAttribute('d',smoothLift>.999?`M${anchor[0]} ${anchor[1]}L${x} ${y}`:slackCord(anchor,[x,y],radius,s.ground_y||420));
 if(f.tail){const offset=s.tail_offset||[20,120],startX=x+offset[0]*c-offset[1]*sn,startY=y+offset[0]*sn+offset[1]*c,flutter=staticPose?0:Math.sin(f.phase*2.7)*(5+14*f.intensity)*smoothLift;f.tail.setAttribute('d',`M${startX} ${startY}c60 ${-15*smoothLift+flutter} 35 ${42*smoothLift-flutter} 85 ${38*smoothLift}s55 ${-18*smoothLift+flutter} 76 ${-7*smoothLift}`)}
 f.wasAssembled=assembled;f.lastMatrix=matrix;f.root.dataset.forceLevel=String(f.target);f.root.dataset.forceMode=assembled?(f.target===0?'assembled-rest':'assembled-flight'):(f.target===0?'loose-rest':'loose-wind');f.root.dataset.motionState=staticPose?'still':'running';
 // Match the visible airflow to the actual force, including an honest zero.
 f.root.querySelectorAll('[data-force-air]').forEach(el=>{el.style.animation='none';el.style.strokeDashoffset=String(staticPose?0:-f.phase*45)});
}
let last=0,frame;
function tick(now){const dt=Math.min((now-last)/1000||0,1/30);last=now;const s=state();
 if(!s.paused&&!s.reduced&&!s.hidden){rigs.forEach(r=>{if(visible(r.root))drawRig(r,dt)});forces.forEach(f=>{if(visible(f.root))drawForce(f,dt)});local.forEach(r=>{if(visible(r.el)){r.energy+=((r.hover||r.focus||r.selected?1:0)-r.energy)*(1-Math.exp(-dt*8));r.el.style.setProperty('--motion-energy',r.energy)}})}
 frame=requestAnimationFrame(tick);
}
function sync(s){if(s.paused||s.reduced){rigs.forEach(r=>drawRig(r,0,true));forces.forEach(f=>drawForce(f,0,true));local.forEach(r=>{r.energy=0;r.el.style.setProperty('--motion-energy',0)})}if(s.hidden||s.paused||s.reduced){cancelAnimationFrame(frame);frame=0}else if(!frame){last=performance.now();frame=requestAnimationFrame(tick)}}
rigs.forEach(r=>drawRig(r,0,true));forces.forEach(f=>drawForce(f,0,true));
if(window.WebsiteEffects)window.WebsiteEffects.subscribe(sync);else{matchMedia('(prefers-reduced-motion:reduce)').addEventListener('change',()=>sync(state()));document.addEventListener('visibilitychange',()=>sync(state()));sync(state())}
window.ArticulatedEffects={version:1,rigs:rigs.map(r=>r.root),forces:forces.map(f=>f.root)};
})();
