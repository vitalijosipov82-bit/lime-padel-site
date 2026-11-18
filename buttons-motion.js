(() => {
 const selector='a.hero-action,a.hero-badge,a.path-cta,a.coaches__btn,a.club-life__signup,a.benefits__button,a.visit__route,a.site-footer__book,a.site-footer__social,a.button,button,.mobile-menu>summary';
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
 const faces=new WeakMap(),releaseTimers=new WeakMap();let current=null,rect=null,point=null,limits=null,frame=0,refreshFrame=0,pressed=null;
 const paint=['background','color','border','borderRadius','boxShadow','padding','alignItems','justifyContent','alignContent','justifyItems','columnGap','rowGap','gridTemplateColumns','gridTemplateRows','textShadow'];
 function reset(){if(frame)cancelAnimationFrame(frame);frame=0;if(current){current.classList.remove('is-button-following');for(const name of ['--button-x','--button-y','--button-scale'])current.style.removeProperty(name)}current=null;rect=null;point=null;limits=null}
 function stopPress(play=false){if(!pressed)return;const target=pressed;pressed=null;target.classList.remove('is-button-pressing');if(play&&!reduced.matches&&target.isConnected){clearTimeout(releaseTimers.get(target));target.classList.add('is-button-releasing');releaseTimers.set(target,setTimeout(()=>target.classList.remove('is-button-releasing'),650))}}
 function refresh(){
  refreshFrame=0;reset();const all=[...document.querySelectorAll(selector)];const items=[];
  // Restore all native layouts together, then read, then write: no per-button thrash.
  for(const target of all){target.setAttribute('data-button-motion','');if(!target.getClientRects().length||target.matches('[hidden]'))continue;const face=faces.get(target);clearTimeout(releaseTimers.get(target));target.classList.remove('is-button-releasing','is-motion-ready');if(face)face.style.setProperty('display','contents','important');items.push({target,face})}
  const snapshots=items.map(item=>{const s=getComputedStyle(item.target),r=item.target.getBoundingClientRect(),values={};for(const name of paint)values[name]=s[name];return{...item,values,display:s.display,width:parseFloat(s.width)||item.target.offsetWidth,height:parseFloat(s.height)||item.target.offsetHeight,visible:r.width>0&&r.height>0}});
  for(const item of snapshots){
   const {target,values}=item;let face=item.face;if(!item.visible)continue;
   if(!face){
    if(target.classList.contains('visit__route'))target.querySelector(':scope>span')?.classList.add('button-motion__route-icon');
    if(target.classList.contains('club-life__signup')){const label=target.firstElementChild;if(label)label.style.textShadow=getComputedStyle(label).textShadow}
    face=document.createElement('span');face.className='button-motion__face';face.append(...target.childNodes);target.append(face);faces.set(target,face);
   }
   for(const [name,value]of Object.entries(values))face.style[name]=value;
   face.style.setProperty('display',item.display==='inline-flex'?'flex':item.display);
   Object.assign(face.style,{width:'100%',height:'100%',boxSizing:'border-box',position:'relative',flex:'1 1 auto',font:'inherit',letterSpacing:'inherit',lineHeight:'inherit',textTransform:'inherit',whiteSpace:'inherit',textAlign:'inherit'});
   target.style.setProperty('--button-width',item.width+'px');target.style.setProperty('--button-height',item.height+'px');target.style.setProperty('--button-display',item.display);target.classList.add('is-motion-ready');
  }
 }
 function scheduleRefresh(){if(!refreshFrame)refreshFrame=requestAnimationFrame(refresh)}
 function bounds(target,r){const x=Math.min(12,r.width*.05),y=Math.min(7,r.height*.12),result={left:x,right:x,up:y,down:y};for(const other of target.parentElement.children){if(other===target||!other.matches('[data-button-motion]')||!other.getClientRects().length||getComputedStyle(other).visibility==='hidden')continue;const n=other.getBoundingClientRect();if(n.top<r.bottom&&n.bottom>r.top){if(n.left>=r.right-1)result.right=Math.min(result.right,Math.max(0,n.left-r.right-r.width*.0275-2));if(n.right<=r.left+1)result.left=Math.min(result.left,Math.max(0,r.left-n.right-r.width*.0275-2))}if(n.left<r.right&&n.right>r.left){if(n.top>=r.bottom-1)result.down=Math.min(result.down,Math.max(0,n.top-r.bottom-r.height*.0275-2));if(n.bottom<=r.top+1)result.up=Math.min(result.up,Math.max(0,r.top-n.bottom-r.height*.0275-2))}}return result}
 function render(){frame=0;if(!current||!rect||!point||!limits)return;const nx=Math.max(-1,Math.min(1,(point.x-rect.x-rect.width/2)/(rect.width/2))),ny=Math.max(-1,Math.min(1,(point.y-rect.y-rect.height/2)/(rect.height/2)));current.style.setProperty('--button-x',(nx*(nx<0?limits.left:limits.right)).toFixed(2)+'px');current.style.setProperty('--button-y',(ny*(ny<0?limits.up:limits.down)).toFixed(2)+'px');current.style.setProperty('--button-scale','1.055')}
 function move(event){const target=event.target.closest('[data-button-motion].is-motion-ready');if(!target||target.matches(':disabled,[aria-disabled="true"]')){if(current)reset();return}if(event.pointerType==='touch'||reduced.matches||!fine.matches)return;if(current!==target){reset();current=target;rect=target.getBoundingClientRect();limits=bounds(target,rect);target.classList.add('is-button-following')}point={x:event.clientX,y:event.clientY};if(!frame)frame=requestAnimationFrame(render)}
 function syncPointer(){reset();document.removeEventListener('pointermove',move);if(!reduced.matches&&fine.matches)document.addEventListener('pointermove',move,{passive:true})}
 document.addEventListener('pointerout',event=>{if(current&&!current.contains(event.relatedTarget))reset()});
 document.addEventListener('pointerdown',event=>{const target=event.target.closest('[data-button-motion].is-motion-ready');if(!target||event.button!==0||target.matches(':disabled,[aria-disabled="true"]'))return;stopPress();pressed=target;target.classList.remove('is-button-releasing');target.classList.add('is-button-pressing')});
 window.addEventListener('pointerup',()=>stopPress(true));window.addEventListener('pointercancel',()=>{stopPress();reset()});
 document.addEventListener('keydown',event=>{if(!['Enter',' '].includes(event.key)||event.repeat)return;const target=event.target.closest('[data-button-motion].is-motion-ready');if(!target)return;stopPress();pressed=target;target.classList.remove('is-button-releasing');target.classList.add('is-button-pressing')});
 document.addEventListener('keyup',event=>{if(['Enter',' '].includes(event.key))stopPress(true)});
 document.addEventListener('focusin',reset);document.addEventListener('focusout',event=>{if(pressed===event.target)stopPress()});
 window.addEventListener('blur',()=>{stopPress();reset()});window.addEventListener('scroll',reset,{passive:true});window.addEventListener('resize',()=>{stopPress();scheduleRefresh()},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stopPress();reset()}});reduced.addEventListener('change',()=>{stopPress();syncPointer()});fine.addEventListener('change',syncPointer);
 const observer=new MutationObserver(records=>{if(records.some(record=>record.type==='attributes'?record.oldValue!==record.target.getAttribute(record.attributeName):[...record.addedNodes].some(node=>node.nodeType===1&&(node.matches(selector)||node.querySelector(selector)))))scheduleRefresh()});
 refresh();syncPointer();observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','open'],attributeOldValue:true});document.fonts?.ready.then(scheduleRefresh);
})();
