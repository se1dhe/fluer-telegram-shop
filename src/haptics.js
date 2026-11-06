/** Telegram Mini App tactile feedback. Never vibrates outside Telegram. */
const webApp=()=>window.Telegram?.WebApp;
export function fleurHaptic(kind='selection'){
 const tg=webApp();
 if(!tg?.isVersionAtLeast?.('6.1')||!tg?.HapticFeedback)return;
 try{
  if(kind==='success'||kind==='warning'||kind==='error')tg.HapticFeedback.notificationOccurred(kind);
  else if(kind==='selection')tg.HapticFeedback.selectionChanged();
  else tg.HapticFeedback.impactOccurred(kind==='medium'?'medium':'light');
 }catch{/* Haptics are optional and must never interrupt ordering. */}
}
export function installFleurHaptics(){
 // Pointer-up is used for physical taps; keyboard clicks get feedback via click.
 const onPointer=event=>{
  const el=event.target.closest?.('button,[role="button"],[role="tab"],[role="checkbox"],select');
  if(!el||el.disabled||el.getAttribute('aria-disabled')==='true')return;
  fleurHaptic('light');
 };
 const onKeyboard=event=>{
  if(event.detail!==0)return;
  const el=event.target.closest?.('button,[role="button"],[role="tab"],[role="checkbox"],select');
  if(el&&!el.disabled)fleurHaptic('selection');
 };
 document.addEventListener('pointerup',onPointer,{passive:true});
 document.addEventListener('click',onKeyboard);
 return ()=>{document.removeEventListener('pointerup',onPointer);document.removeEventListener('click',onKeyboard);};
}
