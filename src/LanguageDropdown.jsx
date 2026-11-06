import React,{useEffect,useId,useRef,useState} from 'react';
import {ChevronDown,Check} from 'lucide-react';
import {LANG_FLAGS,LANG_NAMES,SUPPORTED_LANGS} from './i18n.js';
import './language-dropdown.css';

const ariaNames={
 uk:'Оберіть мову',ru:'Выберите язык',en:'Choose language',pl:'Wybierz język'
};

/** Compact BLACKFORGE-style language control, used in the store and checkout. */
export default function LanguageDropdown({lang,onChange,checkout=false}){
 const [open,setOpen]=useState(false);
 const root=useRef(null);
 const trigger=useRef(null);
 const menuId=useId();
 useEffect(()=>{
  if(!open)return;
  const outside=event=>{
   if(!root.current?.contains(event.target))setOpen(false);
  };
  const escape=event=>{
   if(event.key==='Escape'){event.preventDefault();setOpen(false);trigger.current?.focus();}
  };
  document.addEventListener('pointerdown',outside);
  document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
 },[open]);
 const label=ariaNames[lang]||ariaNames.uk;
 return <div ref={root} className={'fleur-language-dropdown'+(checkout?' fleur-language-checkout':'')}>
  <button ref={trigger} type="button" className="fleur-language-trigger" aria-label={label+': '+LANG_NAMES[lang]}
    aria-haspopup="menu" aria-expanded={open} aria-controls={open?menuId:undefined} onClick={()=>setOpen(value=>!value)}>
   <span className="fleur-language-flag" aria-hidden="true">{LANG_FLAGS[lang]}</span>
   <span className="fleur-language-short">{lang.toUpperCase()}</span>
   <ChevronDown size={14} aria-hidden="true" className={open?'rotate':''}/>
  </button>
  {open&&<div id={menuId} className="fleur-language-popover" role="menu" aria-label={label}>
   {SUPPORTED_LANGS.map(code=><button key={code} type="button" role="menuitemradio" lang={code} aria-checked={code===lang}
    className={'fleur-language-option'+(code===lang?' selected':'')}
    onClick={()=>{onChange(code);setOpen(false);trigger.current?.focus();}}>
    <span className="fleur-language-flag" aria-hidden="true">{LANG_FLAGS[code]}</span>
    <span>{LANG_NAMES[code]}</span>
    {code===lang&&<Check size={16} aria-hidden="true"/>}
   </button>)}
  </div>}
 </div>;
}
