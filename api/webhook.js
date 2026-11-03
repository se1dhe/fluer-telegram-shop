import {telegram,requireMethod} from './_lib.js';
const botMessages={
 uk:{button:'🌷 Відкрити FLEUR',welcome:'Вітаємо у FLEUR! 🌷\nОберіть букет для подарунка. Це демонстраційний магазин — реальні замовлення та оплата недоступні.'},
 ru:{button:'🌷 Открыть FLEUR',welcome:'Добро пожаловать в FLEUR! 🌷\nВыберите букет для подарка. Это демонстрационный магазин — настоящие заказы и платежи недоступны.'},
 en:{button:'🌷 Open FLEUR',welcome:'Welcome to FLEUR! 🌷\nChoose a beautiful bouquet as a gift. This is a demo shop — live orders and payments are disabled.'}
};
const supported=new Set(['uk','ru','en']);
export function botLanguage(code){
 const lang=typeof code==='string'?code.toLowerCase().split(/[-_]/)[0]:'';
 return supported.has(lang)?lang:'uk';
}
export default async function handler(req,res){
 if(!requireMethod(req,res))return;
 if(!process.env.TELEGRAM_WEBHOOK_SECRET||req.headers['x-telegram-bot-api-secret-token']!==process.env.TELEGRAM_WEBHOOK_SECRET)return res.status(403).json({error:'forbidden'});
 const msg=req.body?.message;
 if(msg?.text?.startsWith('/start')){
  const lang=botLanguage(msg.from?.language_code);
  const copy=botMessages[lang];
  let openUrl;
  try{
   if(process.env.PUBLIC_APP_URL){const url=new URL(process.env.PUBLIC_APP_URL);if(url.protocol==='https:'){url.searchParams.set('lang',lang);openUrl=url.toString()}}
  }catch{}
  const reply_markup=openUrl?{inline_keyboard:[[{text:copy.button,web_app:{url:openUrl}}]]}:undefined;
  try{await telegram('sendMessage',{chat_id:msg.chat.id,text:copy.welcome,reply_markup})}
  catch{return res.status(502).json({error:'telegram_failed'})}
 }
 return res.status(200).json({ok:true});
}
