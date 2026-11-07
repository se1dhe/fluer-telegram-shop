import React,{useState,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {Home,Search,Heart,ShoppingBag,User,ArrowLeft,Plus,Minus,MapPin,Truck,Gift,ChevronRight,ShieldCheck,Check} from 'lucide-react';
import CheckoutFlow from './CheckoutFlow.jsx';
import LanguageDropdown from './LanguageDropdown.jsx';
import {installFleurHaptics,fleurHaptic} from './haptics.js';
import {t,getInitialLang,persistLang,SUPPORTED_LANGS,money,dateTime} from './i18n.js';
import './style.css';

const tg=window.Telegram?.WebApp;
installFleurHaptics();

try{tg?.ready();tg?.expand();tg?.setHeaderColor?.('#101216');tg?.setBackgroundColor?.('#101216')}catch{}

const rawProducts=[
 {id:'rose',price:1890,cat:'chrysanthemums',slug:'burgundy-chrysanthemum'},
 {id:'peony',price:2450,cat:'chrysanthemums',slug:'lime-chrysanthemum'},
 {id:'tulip',price:1590,cat:'chrysanthemums',slug:'rainbow-chrysanthemum'},
 {id:'lilac',price:2190,cat:'roses',slug:'red-roses-pink'},
 {id:'ivory',price:2650,cat:'roses',slug:'ivory-roses'},
 {id:'redcream',price:2890,cat:'roses',slug:'red-roses-cream'},
 {id:'fuchsia',price:2390,cat:'roses',slug:'fuchsia-roses'},
 {id:'eustoma',price:1890,cat:'lisianthus',slug:'pink-lisianthus'}
];
const heroPhoto='/catalog/lime-chrysanthemum.webp';
const tabs=[['home',Home],['catalog',Search],['favs',Heart],['orders',ShoppingBag],['profile',User]];
const categoryIDs=['all','roses','chrysanthemums','lisianthus'];
const getSaved=(key,def)=>{try{const value=JSON.parse(localStorage.getItem(key));return value??def}catch{return def}};
const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};

function App(){
 const[lang,setLang]=useState(getInitialLang);
 const[tab,setTab]=useState('home');
 const[detail,setDetail]=useState(null);
 const[photoMode,setPhotoMode]=useState(0);
 const[cartOpen,setCartOpen]=useState(false);
 const[checkout,setCheckout]=useState(false);
 const[cart,setCart]=useState(()=>getSaved('fleur_cart',{}));
 const[favorites,setFavorites]=useState(()=>getSaved('fleur_favs',[]));
 const[orders,setOrders]=useState(()=>getSaved('fleur_orders',[]));
 const[category,setCategory]=useState('all');
 const[search,setSearch]=useState('');
 const[toast,setToast]=useState('');

 const tr=(key,vars)=>t(lang,key,vars);
 const products=rawProducts.map(p=>({...p,name:tr('product.'+p.id+'.name'),tag:tr('product.'+p.id+'.tag'),desc:tr('product.'+p.id+'.desc'),img:'/catalog/'+p.slug+'.webp',real:'/catalog/'+p.slug+'-real.webp'}));
 const totalItems=rawProducts.reduce((sum,p)=>sum+(Number.isInteger(cart[p.id])&&cart[p.id]>0?Math.min(20,cart[p.id]):0),0);
 const subtotal=products.reduce((sum,p)=>sum+(Number.isInteger(cart[p.id])&&cart[p.id]>0?Math.min(20,cart[p.id]):0)*p.price,0);
 const format=n=>money(n,lang);
 const changeLanguage=code=>{if(!SUPPORTED_LANGS.includes(code)||code===lang)return;setLang(code);persistLang(code);try{tg?.HapticFeedback?.selectionChanged?.()}catch{}};
 const toastText=toast==='saved'?tr('cart.saved'):toast?tr('cart.toast',{name:products.find(p=>p.id===toast)?.name||tr('cart.added')}):'';

 useEffect(()=>{save('fleur_cart',cart)},[cart]);
 useEffect(()=>{save('fleur_favs',favorites)},[favorites]);
 useEffect(()=>{save('fleur_orders',orders)},[orders]);
 useEffect(()=>{document.documentElement.lang=lang;document.title='FLEUR · '+tr('catalog.title')},[lang]);
 useEffect(()=>{if(!toast)return;const timeout=setTimeout(()=>setToast(''),2800);return()=>clearTimeout(timeout)},[toast]);

 const nav=next=>{setTab(next);setDetail(null);setCartOpen(false);setCheckout(false)};
 const back=()=>{if(cartOpen)setCartOpen(false);else if(detail)setDetail(null);else nav('home')};
 useEffect(()=>{
  try{
   tg?.BackButton?.offClick(back);
   if(checkout){tg?.BackButton?.show();return}
   if(cartOpen||detail||tab!=='home'){
    tg?.BackButton?.show();
    tg?.BackButton?.onClick(back);
   }else tg?.BackButton?.hide();
  }catch{}
  return()=>{try{tg?.BackButton?.offClick(back)}catch{}};
 },[checkout,cartOpen,detail,tab]);

 const adjust=(id,delta)=>{
  setCart(prev=>{const next={...prev};const quantity=Math.min(20,Math.max(0,(next[id]||0)+delta));if(quantity)next[id]=quantity;else delete next[id];return next});
  if(delta>0)setToast(id);
  try{tg?.HapticFeedback?.selectionChanged?.()}catch{}
 };
 const favorite=id=>setFavorites(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
 const displayProduct=p=>{setDetail(p.id);setPhotoMode(0)};
 const selectedProduct=detail?products.find(p=>p.id===detail):null;
 const visibleProducts=products.filter(p=>(category==='all'||p.cat===category)&&(p.name+' '+p.desc).toLocaleLowerCase().includes(search.toLocaleLowerCase()));

 const productCard=p=><article className="product" key={p.id} onClick={()=>displayProduct(p)}>
  <div className="photo">
   <img src={p.img} alt={p.name} loading="lazy"/>
   <small>{p.tag}</small>
   <button type="button" className="heart" aria-label={tr('nav.favs')+': '+p.name} onClick={event=>{event.stopPropagation();favorite(p.id)}}><Heart size={17} fill={favorites.includes(p.id)?'currentColor':'none'}/></button>
  </div>
  <div className="pd"><h3>{p.name}</h3><p>{p.desc}</p><div><b>{format(p.price)}</b>
   <button className="round" type="button" aria-label={tr('cart.addLabel',{name:p.name})} onClick={event=>{event.stopPropagation();adjust(p.id,1)}}>{cart[p.id]?<span className="plus-count">{cart[p.id]}</span>:<Plus size={18}/>}</button>
  </div></div>
 </article>;

 return <>
  <header>
   <button className="logo forge-product-brand" onClick={()=>nav('home')} aria-label="FLEUR · BLACKFORGE"><img src="/blackforge/mark.webp" width="36" height="36" alt=""/><span className="forge-product-copy"><strong>FLEUR</strong><small>BY BLACKFORGE</small></span></button>
   <div className="city"><MapPin size={14}/>{tr('city')}</div>
   <LanguageDropdown lang={lang} onChange={changeLanguage}/>
   <button className="iconbutton" aria-label={tr('openCart')} onClick={()=>setCartOpen(true)}><ShoppingBag size={20}/>{totalItems>0&&<em>{totalItems}</em>}</button>
  </header>
  <main>
   {tab==='home'&&<>
    <div className="hero"><div><small>{tr('home.eyebrow')}</small><h1>{tr('home.h1a')}<br/><i>{tr('home.h1b')}</i><br/>{tr('home.h1c')}</h1><p>{tr('home.subtitle')}</p><button onClick={()=>nav('catalog')}>{tr('home.choose')} <ChevronRight size={16}/></button></div><img src={heroPhoto} alt="FLEUR"/>
    </div>
    <div className="benefits"><span><Truck size={19}/>{tr('home.delivery')}</span><span><Gift size={19}/>{tr('home.gift')}</span></div>
    <div className="section"><div><small>{tr('home.featured')}</small><h2>{tr('home.title')}</h2></div><button onClick={()=>nav('catalog')}>{tr('home.all')} <ChevronRight size={15}/></button></div>
    <div className="grid">{products.map(productCard)}</div><div className="note">{tr('home.note')}</div>
   </>}
   {tab==='catalog'&&<>
    <div className="section page"><div><small>{tr('catalog.eyebrow')}</small><h2>{tr('catalog.title')}</h2></div></div>
    <div className="search"><Search size={19}/><input aria-label={tr('catalog.search')} placeholder={tr('catalog.search')} value={search} onChange={event=>setSearch(event.target.value)}/></div>
    <div className="chips">{categoryIDs.map(id=><button key={id} className={category===id?'on':''} onClick={()=>setCategory(id)}>{tr('cat.'+id)}</button>)}</div>
    <p className="muted">{tr('catalog.count',{count:visibleProducts.length})}</p><div className="grid">{visibleProducts.map(productCard)}</div>
   </>}
   {tab==='favs'&&<>
    <div className="section page"><div><small>{tr('fav.eyebrow')}</small><h2>{tr('fav.title')}</h2></div></div>
    {favorites.length?<div className="grid">{products.filter(p=>favorites.includes(p.id)).map(productCard)}</div>:<div className="empty"><Heart size={36}/><h2>{tr('fav.empty')}</h2><p>{tr('fav.hint')}</p><button onClick={()=>nav('catalog')}>{tr('fav.browse')}</button></div>}
   </>}
   {tab==='orders'&&<>
    <div className="section page"><div><small>{tr('orders.eyebrow')}</small><h2>{tr('orders.title')}</h2></div></div>
    {orders.length?orders.map(order=><div className="order" key={order.id}><strong>{tr('orders.test',{id:order.id})}</strong><p>{dateTime(order.date,lang)} · {order.method&&['mono','privat','apple','google'].includes(order.method)?tr('pay.'+order.method):(order.methodName||tr('demo'))}</p><b>{format(order.total)}</b><div className="demo-order-tag">{tr('orders.demoTag')}</div></div>):<div className="empty"><ShoppingBag size={36}/><h2>{tr('orders.empty')}</h2><p>{tr('orders.hint')}</p><button onClick={()=>nav('catalog')}>{tr('orders.browse')}</button></div>}
   </>}
   {tab==='profile'&&<>
    <div className="section page"><div><small>{tr('profile.eyebrow')}</small><h2>{tr('profile.title')}</h2></div></div>
    <div className="profile"><div className="avatar">{(tg?.initDataUnsafe?.user?.first_name||'F')[0]}</div><div><b>{tg?.initDataUnsafe?.user?.first_name||tr('profile.guest')}</b><p>{tr('profile.tagline')}</p></div></div>
    <button className="menu" onClick={()=>nav('orders')}><ShoppingBag size={19}/>{tr('profile.orders')} <ChevronRight/></button>
    <button className="menu" onClick={()=>nav('favs')}><Heart size={19}/>{tr('profile.favs')} <ChevronRight/></button>
    <div className="notice"><ShieldCheck size={20}/>{tr('profile.notice')}</div>
    <div className="release-info">{tr('profile.version')}<br/>{window.location.host}</div>
   </>}
  </main>
  <nav>{tabs.map(([id,Icon])=><button key={id} className={tab===id?'active':''} onClick={()=>nav(id)}><Icon size={21}/><span>{tr('nav.'+id)}</span></button>)}</nav>
  {toast&&!checkout&&!cartOpen&&<div className="cart-toast" role="status"><div><Check size={17}/><span>{toastText}</span></div><button onClick={()=>{setToast('');setDetail(null);setCartOpen(true)}}>{tr('cart.shortcut')} <ChevronRight size={15}/></button></div>}
  {selectedProduct&&<div className="overlay">
   <div className="toolbar"><button onClick={()=>setDetail(null)} aria-label={tr('checkout.back')}><ArrowLeft/></button>{tr('detail.title')}<button onClick={()=>favorite(selectedProduct.id)} aria-label={tr('nav.favs')}><Heart fill={favorites.includes(selectedProduct.id)?'currentColor':'none'}/></button></div>
   <img className="detailimage" src={photoMode===0?selectedProduct.img:selectedProduct.real} alt={selectedProduct.name}/>
   <div className="content"><div className="photo-switch"><button className={photoMode===0?'selected':''} onClick={()=>setPhotoMode(0)}>{tr('detail.studio')}</button><button className={photoMode===1?'selected':''} onClick={()=>setPhotoMode(1)}>{tr('detail.real')}</button></div>
    <p className="photo-disclosure">{tr(photoMode===0?'detail.studioNotice':'detail.realNotice')}</p><small>{tr('detail.collection')} · {selectedProduct.tag}</small>
    <h2>{selectedProduct.name}</h2><p>{selectedProduct.desc}</p><h3>{format(selectedProduct.price)}</h3>
    <div className="info"><Truck size={20}/>{tr('detail.delivery')}</div><div className="info"><Gift size={20}/>{tr('detail.card')}</div>
    <button className="primary" onClick={()=>{adjust(selectedProduct.id,1);setDetail(null);setCartOpen(true)}}>{tr('detail.add')} <Plus size={18}/></button>
   </div>
  </div>}
  {cartOpen&&<div className="overlay">
   <div className="toolbar"><button onClick={()=>setCartOpen(false)} aria-label={tr('checkout.back')}><ArrowLeft/></button>{tr('cart.title')}<span>{tr('cart.count',{count:totalItems})}</span></div>
   <div className="content"><h2>{tr('cart.selected')}</h2>
   {totalItems?products.filter(p=>cart[p.id]).map(p=><div className="cartitem" key={p.id}><img src={p.img} alt={p.name}/><div><h3>{p.name}</h3><p>{format(p.price)}</p><div className="qty"><button onClick={()=>adjust(p.id,-1)} aria-label="-"><Minus size={16}/></button>{cart[p.id]}<button onClick={()=>adjust(p.id,1)} aria-label="+"><Plus size={16}/></button></div></div></div>):<div className="empty"><ShoppingBag/><h2>{tr('cart.empty')}</h2><button onClick={()=>nav('catalog')}>{tr('cart.toCatalog')}</button></div>}
   </div>
   {totalItems>0&&<div className="actionbar"><div>{tr('cart.subtotal')} <b>{format(subtotal)}</b></div><small>{tr('cart.delivery')}</small><button className="primary" onClick={()=>{setCartOpen(false);setCheckout(true)}}>{tr('cart.checkout')} <ChevronRight/></button></div>}
  </div>}
  {checkout&&<CheckoutFlow lang={lang} onLanguageChange={changeLanguage} sum={subtotal} cart={cart} products={products} tg={tg} onCancel={()=>{setCheckout(false);setCartOpen(true)}} onComplete={order=>{setOrders(prev=>[order,...prev]);setCart({});setCheckout(false);setTab('orders');setToast('saved');fleurHaptic('success')}}/>}
 </>;
}
createRoot(document.getElementById('root')).render(<App/>);
