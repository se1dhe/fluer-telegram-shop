import React,{useState,useEffect,useRef} from 'react';
import {ArrowLeft,ChevronRight,CheckCircle2,CreditCard,MapPin,ShieldCheck,Gift,Phone,Wallet,Info,X} from 'lucide-react';
import {t,money} from './i18n.js';
import LanguageDropdown from './LanguageDropdown.jsx';
import './checkout.css';

const slots=['09:00–12:00','12:00–15:00','15:00–18:00','18:00–21:00'];
const paymentOptions=[
 {id:'mono',nameKey:'pay.mono',caption:'checkout.cardDemo',badge:'mono',mark:'m'},
 {id:'privat',nameKey:'pay.privat',caption:'checkout.cardDemo',badge:'privat',mark:'24'},
 {id:'apple',nameKey:'pay.apple',caption:'checkout.appleDemo',badge:'apple',mark:'●'},
 {id:'google',nameKey:'pay.google',caption:'checkout.googleDemo',badge:'google',mark:'G'}
];
const today=()=>{const d=new Date(),m=d.getMonth()+1;return d.getFullYear()+'-'+String(m).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const defaults={name:'',phone:'',recipient:'',recipientPhone:'',kind:'courier',town:'',street:'',house:'',flat:'',entrance:'',floor:'',date:today(),slot:slots[1],courierNote:'',card:'',anonymous:false,callRecipient:true,payment:'mono'};

export default function CheckoutFlow({sum,cart,products,tg,lang,onLanguageChange,onCancel,onComplete}){
 const tr=(key,vars)=>t(lang,key,vars);
 const format=n=>money(n,lang);
 const[step,setStep]=useState(1);
 const[data,setData]=useState(()=>({...defaults,town:t(lang,'city')}));
 const[error,setError]=useState('');
 const[paymentOpen,setPaymentOpen]=useState(false);
 const[contactStatus,setContactStatus]=useState('');
 const[complete,setComplete]=useState(false);
 const page=useRef(null);
 const change=(key,value)=>setData(prev=>({...prev,[key]:value}));
 const deliveryFee=data.kind==='courier'?169:data.kind==='pickup'?0:null;
 const total=sum+(deliveryFee??0);
 const selectedPayment=paymentOptions.find(p=>p.id===data.payment)||paymentOptions[0];

 useEffect(()=>{page.current?.scrollTo?.({top:0,behavior:'instant'});setError('')},[step]);
 useEffect(()=>{setData(prev=>{const homeCities=['Дніпро','Днепр','Dnipro'];return homeCities.includes(prev.town)?{...prev,town:t(lang,'city')}:prev})},[lang]);

 const input=(key,label,placeholder,opts={})=><label className="co-field"><span>{label}</span><input
  value={data[key]} onChange={e=>change(key,e.target.value)} placeholder={placeholder}
  autoComplete={opts.autoComplete??'off'} inputMode={opts.inputMode}
  type={opts.type??'text'} required={opts.required??false} maxLength={opts.maxLength??110}
 /></label>;

 const fieldPhone=(key,label,self=false)=><div className="co-phone-field">
  {input(key,label,'+380 XX XXX XX XX',{type:'tel',inputMode:'tel',autoComplete:self?'tel':'off',required:true,maxLength:22})}
  {self&&<button className="co-contact-btn" type="button" onClick={nativeContact}><Phone size={16}/>{tr('checkout.myNumber')}</button>}
 </div>;

 function nativeContact(){
  if(!tg?.requestContact){setContactStatus('checkout.contactUnavailable');return}
  try{tg.requestContact(granted=>setContactStatus(granted?'checkout.contactGranted':'checkout.contactDenied'))}
  catch{setContactStatus('checkout.contactError')}
 }
 const validate=()=>{
  if(step===1&&(!data.name.trim()||data.phone.replace(/\D/g,'').length<9))return 'checkout.errContact';
  if(step===2&&(!data.recipient.trim()||data.recipientPhone.replace(/\D/g,'').length<9))return 'checkout.errRecipient';
  if(step===2&&data.kind!=='pickup'&&(!data.town.trim()||!data.street.trim()||!data.house.trim()))return 'checkout.errAddress';
  if(step===2&&(!data.date||data.date<today()))return 'checkout.errDate';
  return '';
 };
 const next=()=>{const issue=validate();if(issue){setError(issue);try{tg?.HapticFeedback?.notificationOccurred?.('error')}catch{}return}setStep(prev=>Math.min(4,prev+1))};
 const back=()=>{if(paymentOpen){setPaymentOpen(false);return}if(step===1){onCancel();return}setStep(prev=>prev-1)};
 useEffect(()=>{const handler=()=>back();try{tg?.BackButton?.show();tg?.BackButton?.onClick(handler)}catch{}return()=>{try{tg?.BackButton?.offClick(handler)}catch{}}},[step,paymentOpen,tg,onCancel]);
 const submitDemo=()=>{
  if(complete)return;
  setComplete(true);
  const order={id:'DEMO-'+Math.random().toString(36).slice(2,8).toUpperCase(),total,baseTotal:sum,deliveryFee,
   method:data.payment,kind:data.kind,date:new Date().toISOString(),deliveryDate:data.date,
   time:data.slot,items:Object.fromEntries(Object.entries(cart)),status:'demo',localOnly:true};
  try{tg?.HapticFeedback?.notificationOccurred?.('success')}catch{}
  onComplete(order);
 };

 return <div className="co-page" ref={page} role="dialog" aria-label={tr('checkout.aria')}>
  <div className="co-top">
   <button onClick={back} aria-label={tr('checkout.back')}><ArrowLeft size={21}/></button>
   <div><strong>{tr('checkout.title')}</strong><small>{tr('checkout.stepCount',{step})}</small></div>
   <LanguageDropdown lang={lang} onChange={onLanguageChange} checkout/>
    <span className="co-demo-tag">DEMO</span>
  </div>
  <div className="co-step-track">{[1,2,3,4].map(i=><i key={i} className={i<=step?'active':''}/>)}</div>
  <div className="co-body">
   <span className="co-eyebrow">{tr('checkout.step'+step)}</span>
   <h2>{tr('checkout.step'+step+'Title')}</h2>
   <p className="co-subtitle">{tr('checkout.step'+step+'Desc')}</p>

   {step===1&&<div className="co-form">
    {input('name',tr('checkout.name'),tr('checkout.namePlaceholder'),{autoComplete:'name',required:true})}
    {fieldPhone('phone',tr('checkout.phone'),true)}
    {contactStatus&&<p className="co-footnote">{tr(contactStatus)}</p>}
    <div className="co-notice"><ShieldCheck size={20}/>{tr('checkout.privacy')}</div>
   </div>}

   {step===2&&<div className="co-form">
    <div className="co-heading">{tr('checkout.deliveryMethod')}</div>
    <div className="co-delivery-options">{[
     ['courier','checkout.courier','checkout.courierDesc'],
     ['outside','checkout.outside','checkout.outsideDesc'],
     ['pickup','checkout.pickup','checkout.pickupDesc']
    ].map(([id,label,desc])=><button key={id} className={'co-delivery-card '+(data.kind===id?'selected':'')} onClick={()=>{setData(prev=>({...prev,kind:id,...(id==='courier'?{town:tr('city')}:{})}))}}>
     <span className="co-radio"/><strong>{tr(label)}</strong><small>{tr(desc)}</small>
    </button>)}</div>

    {data.kind!=='pickup'&&<>
     {input('town',tr('checkout.town'),tr('checkout.townPlaceholder'),{autoComplete:'address-level2'})}
     {input('street',tr('checkout.street'),tr('checkout.streetPlaceholder'),{autoComplete:'address-line1'})}
     <div className="co-two">{input('house',tr('checkout.house'),tr('checkout.housePlaceholder'),{maxLength:20})}{input('flat',tr('checkout.flat'),tr('checkout.optional'),{maxLength:20})}</div>
     <div className="co-two">{input('entrance',tr('checkout.entrance'),tr('checkout.optional'),{maxLength:20})}{input('floor',tr('checkout.floor'),tr('checkout.optional'),{maxLength:8})}</div>
    </>}
    {data.kind==='pickup'&&<div className="co-notice"><MapPin size={19}/>{tr('checkout.pickupNote')}</div>}
    <div className="co-heading">{tr('checkout.recipientTitle')}</div>
    {input('recipient',tr('checkout.recipient'),tr('checkout.recipientPlaceholder'),{required:true})}
    {fieldPhone('recipientPhone',tr('checkout.recipientPhone'))}
    <div className="co-two">
     <label className="co-field"><span>{tr('checkout.date')}</span><input type="date" min={today()} value={data.date} onChange={e=>change('date',e.target.value)}/></label>
     <label className="co-field"><span>{tr('checkout.time')}</span><select value={data.slot} onChange={e=>change('slot',e.target.value)}>{slots.map(x=><option key={x}>{x}</option>)}</select></label>
    </div>
    <label className="co-field"><span>{tr('checkout.courierNote')}</span><textarea maxLength={240} rows="3" value={data.courierNote} onChange={e=>change('courierNote',e.target.value)} placeholder={tr('checkout.courierPlaceholder')}/></label>
    <div className="co-notice"><Info size={19}/><span>{tr(data.kind==='courier'?'checkout.feeCity':data.kind==='outside'?'checkout.feeOutside':'checkout.feePickup')} {tr('checkout.notLogistics')}</span></div>
   </div>}

   {step===3&&<div className="co-form">
    <div className="co-gift-card"><Gift size={24}/><div><b>{tr('checkout.giftTitle')}</b><p>{tr('checkout.giftDesc')}</p></div></div>
    <label className="co-field"><span>{tr('checkout.cardText')}</span><textarea rows="5" maxLength={320} value={data.card} onChange={e=>change('card',e.target.value)} placeholder={tr('checkout.cardPlaceholder')}/></label>
    <label className="co-toggle"><span><b>{tr('checkout.anonymous')}</b><small>{tr('checkout.anonymousDesc')}</small></span><input type="checkbox" checked={data.anonymous} onChange={e=>change('anonymous',e.target.checked)}/><i/></label>
    <label className="co-toggle"><span><b>{tr('checkout.callRecipient')}</b><small>{tr('checkout.callRecipientDesc')}</small></span><input type="checkbox" checked={data.callRecipient} onChange={e=>change('callRecipient',e.target.checked)}/><i/></label>
    <div className="co-notice"><Gift size={19}/>{tr('checkout.photoNote')}</div>
   </div>}

   {step===4&&<div className="co-form">
    <div className="co-heading">{tr('checkout.paymentMethod')}</div>
    <div className="co-method-list">{paymentOptions.map(opt=><button key={opt.id} className={'co-method '+(data.payment===opt.id?'selected':'')} onClick={()=>change('payment',opt.id)}>
     <span className={'co-paymark '+opt.badge}>{opt.mark}</span><span><b>{tr(opt.nameKey)}</b><small>{tr(opt.caption)}</small></span><i className="co-radio"/>
    </button>)}</div>
    <div className="co-summary">
     <div><span>{tr('checkout.subtotal')}</span><strong>{format(sum)}</strong></div>
     <div><span>{tr(data.kind==='pickup'?'checkout.pickup':'checkout.delivery')}</span><strong>{deliveryFee===null?tr('checkout.feeNegotiable'):format(deliveryFee)}</strong></div>
     <div className="co-summary-total"><span>{tr('checkout.estimated')}</span><strong>{format(total)}{deliveryFee===null?tr('checkout.plusDelivery'):''}</strong></div>
    </div>
    <div className="co-notice"><ShieldCheck size={20}/>{tr('checkout.localNotice')}</div>
   </div>}
   {error&&<p className="co-error">{tr(error)}</p>}
  </div>
  <div className="co-bottom">
   <div className="co-bottom-total"><span>{tr('checkout.orderTotal')}<small>{tr(deliveryFee===null?'checkout.deliverySeparate':'checkout.demoEstimate')}</small></span><strong>{format(total)}</strong></div>
   <button className="co-primary" onClick={step===4?()=>setPaymentOpen(true):next}>{tr(step===4?'checkout.paymentNext':'checkout.continue')} <ChevronRight size={19}/></button>
  </div>

  {paymentOpen&&<div className="co-payment-backdrop"><div className="co-sheet" role="dialog" aria-modal="true" aria-label={tr('checkout.paymentAria')}>
   <div className="co-sheet-top"><span>{tr('checkout.paymentHeading')}</span><button onClick={()=>setPaymentOpen(false)} aria-label={tr('checkout.close')}><X size={20}/></button></div>
   <div className="co-merchant"><span className={'co-paymark '+selectedPayment.badge}>{selectedPayment.mark}</span><div><h3>{tr(selectedPayment.nameKey)}</h3><p>{tr('checkout.merchantNotice')}</p></div></div>
   <div className="co-sheet-sum">{format(total)}<small>{deliveryFee===null?tr('checkout.feeAdded'):''}</small></div>
   {['mono','privat'].includes(data.payment)?<div className="co-demo-card">
    <div className="co-card-head"><CreditCard size={22}/>{tr('checkout.testCard')}</div>
    <div className="co-card-number">•••• •••• •••• 0000</div>
    <div className="co-card-grid"><span>{tr('checkout.expiry')}<br/><b>{tr('checkout.expiryPlaceholder')}</b></span><span>CVV<br/><b>•••</b></span></div>
    <p>{tr('checkout.cardSafe')}</p>
   </div>:<div className="co-wallet-demo"><Wallet size={35}/><strong>{tr(selectedPayment.nameKey)}</strong><p>{tr('checkout.walletDesc')}</p><div className="co-wallet-line"><span>{tr('checkout.walletMerchant')}</span><b>{format(total)}</b></div></div>}
   <div className="co-demo-warning"><ShieldCheck size={17}/>{tr('checkout.simulation')}</div>
   <button className="co-primary" disabled={complete} onClick={submitDemo}><CheckCircle2 size={19}/>{tr('checkout.complete')}</button>
   <p className="co-sheet-caption">{tr('checkout.localSaved')}</p>
  </div></div>}
 </div>;
}
