import {telegram,requireMethod} from './_lib.js';
export default async function handler(req,res){
 if(!requireMethod(req,res))return;
 if(!process.env.TELEGRAM_WEBHOOK_SECRET||req.headers['x-telegram-bot-api-secret-token']!==process.env.TELEGRAM_WEBHOOK_SECRET)return res.status(403).json({error:'forbidden'});
 const msg=req.body?.message;
 if(msg?.text?.startsWith('/start')){
  const url=process.env.PUBLIC_APP_URL;
  const reply_markup=url?{inline_keyboard:[[{text:'🌷 Відкрити FLEUR',web_app:{url}}]]}:undefined;
  try{await telegram('sendMessage',{chat_id:msg.chat.id,text:'Вітаємо у FLEUR! 🌷\nОберіть букет для подарунка. Це демонстраційний магазин — реальні замовлення та оплата недоступні.',reply_markup})}catch{return res.status(502).json({error:'telegram_failed'})}
 }
 return res.status(200).json({ok:true});
}
