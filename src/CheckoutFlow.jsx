import React,{useState,useEffect,useRef} from 'react';
import{ArrowLeft,ChevronRight,Check,CheckCircle2,CreditCard,MapPin,ShieldCheck,Truck,Gift,Phone,Wallet,CalendarDays,Clock3,Package,Info, X}from 'lucide-react';
import './checkout.css';

const slots=['09:00–12:00','12:00–15:00','15:00–18:00','18:00–21:00'];
const paymentOptions=[
{id:'mono',name:'monobank',caption:'Оплата карткою · демонстраційна форма',badge:'mono',mark:'m'},
{id:'privat',name:'ПриватБанк · LiqPay',caption:'Оплата карткою · демонстраційна форма',badge:'privat',mark:'24'},
{id:'apple',name:'Apple Pay',caption:'Приклад підтвердження Apple Pay',badge:'apple',mark:'●'},
{id:'google',name:'Google Pay',caption:'Приклад підтвердження Google Pay',badge:'google',mark:'G'}];
const formatMoney=n=>n.toLocaleString('uk-UA')+' ₴';
const today=()=>{const d=new Date();const m=d.getMonth()+1;return d.getFullYear()+'-'+String(m).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const initial={name:'',phone:'',recipient:'',recipientPhone:'',kind:'courier',town:'Дніпро',street:'',house:'',flat:'',entrance:'',floor:'',date:today(),slot:slots[1],courierNote:'',card:'',anonymous:false,callRecipient:true,payment:'mono'};
const methods={mono:'monobank',privat:'ПриватБанк / LiqPay',apple:'Apple Pay',google:'Google Pay'};
export default function CheckoutFlow({sum,cart,products,tg,onCancel,onComplete}){
 const[step,setStep]=useState(1),[data,setData]=useState(initial),[err,setErr]=useState(''),[paymentOpen,setPaymentOpen]=useState(false),[contactStatus,setContactStatus]=useState('');
 const [complete,setComplete]=useState(false);
 const scroll=useRef(null);
 const change=(key,value)=>setData(p=>({...p,[key]:value}));
 const fee=data.kind==='courier'?169:data.kind==='pickup'?0:null;
 const total=sum+(fee??0);
 useEffect(()=>{scroll.current?.scrollTo?.({top:0,behavior:'instant'});setErr('')},[step]);
 const input=(key,title,placeholder,attrs={})=><label className="co-field"><span>{title}</span><input value={data[key]} onChange={e=>change(key,e.target.value)} placeholder={placeholder} autoComplete={attrs.autoComplete??'off'} inputMode={attrs.inputMode} type={attrs.type??'text'} required={attrs.required??false} maxLength={attrs.maxLength??110}/></label>;
 const nativeContact=()=>{if(!tg?.requestContact){setContactStatus('Автозаповнення доступне через поле номера на iPhone.');return}
  try{tg.requestContact(granted=>setContactStatus(granted?'Номер передано боту за вашим дозволом. Для цього поля також доступне автозаповнення iPhone.':'Доступ не надано. Введіть номер або використайте автозаповнення iPhone.'))}catch{setContactStatus('Нативний запит номера недоступний у цій версії Telegram.')}};
 const validate=()=>{if(step===1&&(!data.name.trim()||data.phone.replace(/\D/g,'').length<9))return 'Вкажіть ім’я та коректний номер телефону.';
 if(step===2&&(!data.recipient.trim()||data.recipientPhone.replace(/\D/g,'').length<9))return 'Вкажіть ім’я та телефон отримувача.';
 if(step===2&&data.kind!=='pickup'&&(!data.town.trim()||!data.street.trim()||!data.house.trim()))return 'Вкажіть населений пункт, вулицю та будинок.';
 if(step===2&&(!data.date||data.date<today()))return 'Оберіть дату доставки не раніше сьогодні.';
 return ''};
 const next=()=>{const message=validate();if(message){setErr(message);tg?.HapticFeedback?.notificationOccurred?.('error');return}setStep(v=>Math.min(4,v+1))};
 const back=()=>{if(paymentOpen){setPaymentOpen(false);return}if(step===1){onCancel();return}setStep(v=>v-1)};
 const submitDemo=()=>{if(complete)return;setComplete(true);
 const order={id:'DEMO-'+Math.random().toString(36).slice(2,8).toUpperCase(),total,baseTotal:sum,deliveryFee:fee,method:data.payment,methodName:methods[data.payment],kind:data.kind,date:new Date().toISOString(),deliveryDate:data.date,time:data.slot,items:Object.fromEntries(Object.entries(cart)),status:'demo',localOnly:true};
 try{tg?.HapticFeedback?.notificationOccurred?.('success')}catch{}
 onComplete(order);
 };
 const fieldPhone=(key,title,self=false)=><div className="co-phone-field">{input(key,title,'+380 XX XXX XX XX',{type:'tel',inputMode:'tel',autoComplete:self?'tel':'off',required:true,maxLength:22})}{self&&<button className="co-contact-btn" type="button" onClick={nativeContact}><Phone size={16}/> Мій номер у Telegram</button>}</div>;
 const payChoice=paymentOptions.find(x=>x.id===data.payment);
 return <div className="co-page" ref={scroll} role="dialog" aria-label="Оформлення замовлення">
 <div className="co-top"><button onClick={back} aria-label="Повернутися"><ArrowLeft size={21}/></button><div><strong>Оформлення</strong><small>Крок {step} із 4</small></div><span className="co-demo-tag">DEMO</span></div>
 <div className="co-step-track">{[1,2,3,4].map(i=><i key={i} className={i<=step?'active':''}/>)}</div>
 <div className="co-body">
 <span className="co-eyebrow">{['','01 / КОНТАКТИ','02 / ДОСТАВКА','03 / ДЕТАЛІ','04 / ОПЛАТА'][step]}</span>
 <h2>{['','Залишайтесь на зв’язку','Куди доставити?','Зробімо це особливим','Як зручно оплатити?'][step]}</h2>
 <p className="co-subtitle">{['','Ми підготували просту форму оформлення.','Оберіть спосіб отримання, адресу та зручний час.','Листівка, побажання і сюрприз для близьких.','Оберіть платіжний сценарій. Усі оплати лише демонстраційні.'][step]}</p>
 {step===1&&<div className="co-form">{input('name','Ваше ім’я','Як до вас звертатися',{autoComplete:'name',required:true})}{fieldPhone('phone','Ваш номер телефону',true)}{contactStatus&&<p className="co-footnote">{contactStatus}</p>}<div className="co-notice"><ShieldCheck size={20}/> Дані залишаються у вашому пристрої: у демо ми не надсилаємо їх платіжним системам.</div></div>}
 {step===2&&<div className="co-form"><div className="co-heading">Спосіб отримання</div>
 <div className="co-delivery-options">{[['courier','Кур’єром','По Дніпру'],['outside','За місто','Передмістя та область'],['pickup','Самовивіз','Забрати у студії']].map(([value,label,sub])=><button key={value} className={'co-delivery-card '+(data.kind===value?'selected':'')} onClick={()=>{change('kind',value);if(value==='courier')change('town','Дніпро')}}><span className="co-radio"/><strong>{label}</strong><small>{sub}</small></button>)}</div>
 {data.kind!=='pickup'&&<>{input('town','Населений пункт','Дніпро, Слобожанське…',{autoComplete:'address-level2'})}{input('street','Вулиця','Введіть вулицю',{autoComplete:'address-line1'})}<div className="co-two">{input('house','Будинок','№ будинку',{maxLength:20})}{input('flat','Квартира / офіс','Необов’язково',{maxLength:20})}</div><div className="co-two">{input('entrance','Під’їзд','Необов’язково',{maxLength:20})}{input('floor','Поверх','Необов’язково',{maxLength:8})}</div></>}
 {data.kind==='pickup'&&<div className="co-notice"><MapPin size={19}/> Адреса студії та доступність самовивозу підтверджуються менеджером. Це демо.</div>}
 <div className="co-heading">Кому вручити квіти?</div>{input('recipient','Ім’я отримувача','Ім’я',{autoComplete:'off',required:true})}{fieldPhone('recipientPhone','Телефон отримувача')}
 <div className="co-two"><label className="co-field"><span>Дата</span><input type="date" min={today()} value={data.date} onChange={e=>change('date',e.target.value)}/></label><label className="co-field"><span>Час</span><select value={data.slot} onChange={e=>change('slot',e.target.value)}>{slots.map(x=><option key={x}>{x}</option>)}</select></label></div>
 <label className="co-field"><span>Коментар кур’єру</span><textarea maxLength={240} rows="3" value={data.courierNote} onChange={e=>change('courierNote',e.target.value)} placeholder="Домофон, орієнтири, побажання…"/></label>
 <div className="co-notice"><Info size={19}/>{data.kind==='courier'?'Демонстраційний тариф по Дніпру: 169 ₴.':data.kind==='outside'?'Вартість доставки за місто погоджується окремо.':'Самовивіз: без вартості доставки.'} Це не реальний розрахунок логістики.</div></div>}
 {step===3&&<div className="co-form"><div className="co-gift-card"><Gift size={24}/><div><b>Листівка до букета</b><p>Ваші слова зроблять подарунок особливим</p></div></div><label className="co-field"><span>Текст листівки</span><textarea rows="5" maxLength={320} value={data.card} onChange={e=>change('card',e.target.value)} placeholder="Декілька теплих слів…"/></label>
 <label className="co-toggle"><span><b>Анонімний сюрприз</b><small>Не зазначати ім’я відправника</small></span><input type="checkbox" checked={data.anonymous} onChange={e=>change('anonymous',e.target.checked)}/><i/></label>
 <label className="co-toggle"><span><b>Зв’язатися з отримувачем</b><small>Уточнити зручний час вручення</small></span><input type="checkbox" checked={data.callRecipient} onChange={e=>change('callRecipient',e.target.checked)}/><i/></label>
 <div className="co-notice"><Gift size={19}/> Фотографію готового букета можна додати до майбутнього комерційного сценарію.</div></div>}
 {step===4&&<div className="co-form"><div className="co-heading">Спосіб оплати</div><div className="co-method-list">{paymentOptions.map(x=><button key={x.id} className={'co-method '+(data.payment===x.id?'selected':'')} onClick={()=>change('payment',x.id)}><span className={'co-paymark '+x.badge}>{x.mark}</span><span><b>{x.name}</b><small>{x.caption}</small></span><i className="co-radio"/></button>)}</div>
 <div className="co-summary"><div><span>Вартість букетів</span><strong>{formatMoney(sum)}</strong></div><div><span>{data.kind==='pickup'?'Самовивіз':'Доставка'}</span><strong>{fee===null?'За погодженням':formatMoney(fee)}</strong></div><div className="co-summary-total"><span>Орієнтовна сума</span><strong>{formatMoney(total)}{fee===null?' + доставка':''}</strong></div></div>
 <div className="co-notice"><ShieldCheck size={20}/> Тестовий сценарій: жодних коштів не списуємо, справжні реквізити не запитуємо, замовлення зберігається тільки в цьому браузері.</div></div>}
 {err&&<p className="co-error">{err}</p>}
 </div>
 <div className="co-bottom"><div className="co-bottom-total"><span>Сума замовлення <small>{fee===null?'Доставка окремо':'Демо-розрахунок'}</small></span><strong>{formatMoney(total)}</strong></div><button className="co-primary" onClick={step===4?()=>setPaymentOpen(true):next}>{step===4?'Перейти до демо-оплати':'Продовжити'}<ChevronRight size={19}/></button></div>
 {paymentOpen&&<div className="co-payment-backdrop"><div className="co-sheet" role="dialog" aria-modal="true" aria-label="Демонстраційна форма оплати"><div className="co-sheet-top"><span>ПРИКЛАД ПЛАТІЖНОЇ ФОРМИ</span><button onClick={()=>setPaymentOpen(false)} aria-label="Закрити"><X size={20}/></button></div><div className="co-merchant"><span className={'co-paymark '+payChoice.badge}>{payChoice.mark}</span><div><h3>{payChoice.name}</h3><p>FLEUR · Демонстрація без списання</p></div></div><div className="co-sheet-sum">{formatMoney(total)}<small>{fee===null?' + вартість доставки за узгодженням':''}</small></div>
 {['mono','privat'].includes(data.payment)?<div className="co-demo-card"><div className="co-card-head"><CreditCard size={22}/> Тестова банківська картка</div><div className="co-card-number">•••• •••• •••• 0000</div><div className="co-card-grid"><span>ТЕРМІН ДІЇ<br/><b>ММ / РР</b></span><span>CVV<br/><b>•••</b></span></div><p>Для безпеки введення реального номера картки та CVV вимкнене у демонстрації.</p></div>:<div className="co-wallet-demo"><Wallet size={35}/><strong>{payChoice.name}</strong><p>Так виглядатиме етап підтвердження оплати. Системний платіжний лист Apple / Google не викликається без підключеного еквайрингу.</p><div className="co-wallet-line"><span>FLEUR · Квіти й доставка</span><b>{formatMoney(total)}</b></div></div>}
 <div className="co-demo-warning"><ShieldCheck size={17}/> Симуляція — без банківської авторизації</div><button className="co-primary" disabled={complete} onClick={submitDemo}><CheckCircle2 size={19}/> Завершити демо-замовлення · 0 ₴ списання</button><p className="co-sheet-caption">Підтвердження створює лише локальний запис в історії замовлень.</p></div></div>}
 </div>;
}
