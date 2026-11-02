import crypto from 'node:crypto';
import {validate,telegram,requireMethod} from './_lib.js';
const prices={rose:1890,peony:2450,tulip:1590,lilac:2190};
const clean=(v,n=160)=>typeof v==='string'?v.trim().slice(0,n):'';
export default async function handler(req,res){
 if(!requireMethod(req,res))return;
 res.setHeader('Cache-Control','no-store');
 const user=validate(req.body?.initData,process.env.BOT_TOKEN);
 if(!user)return res.status(401).json({error:'telegram_auth_required'});
 if(!process.env.ADMIN_CHAT_ID)return res.status(503).json({error:'admin_not_configured'});
 const body=req.body||{}, customer=body.customer||{}, entries=Object.entries(body.items||{});
 if(!entries.length||entries.length>4)return res.status(400).json({error:'invalid_cart'});
 let subtotal=0;
 for(const [id,quantity] of entries){if(!(id in prices)||!Number.isInteger(quantity)||quantity<1||quantity>20)return res.status(400).json({error:'invalid_items'});subtotal+=prices[id]*quantity}
 for(const k of ['name','phone','recipient','recipientPhone','destination','date'])if(!clean(customer[k]))return res.status(400).json({error:'missing_'+k});
 if(!/^\d{4}-\d{2}-\d{2}$/.test(customer.date))return res.status(400).json({error:'invalid_date'});
 const id=crypto.randomBytes(5).toString('hex').toUpperCase();
 const message=['🌷 FLEUR / ТЕСТОВЕ ЗАМОВЛЕННЯ #'+id,'Telegram ID: '+user.id,'Замовник: '+clean(customer.name),'Телефон: '+clean(customer.phone),'Отримувач: '+clean(customer.recipient),'Телефон отримувача: '+clean(customer.recipientPhone),'Адреса: '+clean(customer.destination,220),'Зона: '+(body.outCity?'За містом':'Дніпро'),'Дата: '+customer.date,'Час: '+clean(customer.time),'Листівка: '+clean(customer.card,320),'Анонімно: '+(customer.anonymous?'так':'ні'),'Товари: '+entries.map(([id,n])=>id+' × '+n).join(', '),'Товари: '+subtotal+' ₴','Доставку узгодити окремо','⚠️ ДЕМО: НЕ ПРИЙМАТИ ОПЛАТУ'].join('\n');
 try{await telegram('sendMessage',{chat_id:process.env.ADMIN_CHAT_ID,text:message});return res.status(200).json({ok:true,id,total:subtotal})}catch{return res.status(502).json({error:'notification_failed'})}
}
