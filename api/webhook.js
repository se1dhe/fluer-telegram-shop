import {telegram,requireMethod} from './_lib.js';

// Mirrors beauty-booking-bot/client.py: /start always asks, setlang:xx unlocks the menu.
// Keeping the chosen language on the per-chat Telegram menu works without a database.
export const CHOOSE_LANGUAGE='🌐 Wybierz język / Оберіть мову / Choose language / Выберите язык';
export const languageKeyboard={
 inline_keyboard:[
  [{text:'🇺🇦 Українська',callback_data:'setlang:uk'}],
  [{text:'🇬🇧 English',callback_data:'setlang:en'}],
  [{text:'🇷🇺 Русский',callback_data:'setlang:ru'}],
  [{text:'🇵🇱 Polski',callback_data:'setlang:pl'}]
 ]
};
export const botMessages={
 uk:{button:'🌷 Відкрити FLEUR',welcome:'Вітаємо у FLEUR! 🌷\nОберіть букет для подарунка. Це демонстраційний магазин — реальні замовлення та оплата недоступні.',selected:'✅ Мова: Українська'},
 en:{button:'🌷 Open FLEUR',welcome:'Welcome to FLEUR! 🌷\nChoose a beautiful bouquet as a gift. This is a demo shop — live orders and payments are disabled.',selected:'✅ Language: English'},
 ru:{button:'🌷 Открыть FLEUR',welcome:'Добро пожаловать в FLEUR! 🌷\nВыберите букет для подарка. Это демонстрационный магазин — настоящие заказы и платежи недоступны.',selected:'✅ Язык: Русский'},
 pl:{button:'🌷 Otwórz FLEUR',welcome:'Witamy we FLEUR! 🌷\nWybierz bukiet na wyjątkową okazję. To sklep demonstracyjny — prawdziwe zamówienia i płatności są wyłączone.',selected:'✅ Język: Polski'}
};
const supported=new Set(['uk','ru','en','pl']);
export function botLanguage(code){
 const lang=typeof code==='string'?code.toLowerCase().split(/[-_]/)[0]:'';
 return supported.has(lang)?lang:'uk';
}
export function appUrlForLanguage(publicUrl,lang){
 if(!supported.has(lang)||!publicUrl)return null;
 try{
  const url=new URL(publicUrl);
  if(url.protocol!=='https:'||!url.hostname)return null;
  url.searchParams.set('lang',lang);
  return url.toString();
 }catch{return null}
}

// Telegram delivers these updates to /api/webhook, authenticated by secret header.
// Injection of the API caller keeps all bot flows testable without sending real messages.
export async function handleBotUpdate(update,api=telegram,publicAppUrl=process.env.PUBLIC_APP_URL){
 const msg=update?.message;
 if(typeof msg?.text==='string'&&/^\/start(?:@[A-Za-z0-9_]+)?(?:\s|$)/.test(msg.text)){
  await api('sendMessage',{
   chat_id:msg.chat.id,
   text:CHOOSE_LANGUAGE,
   reply_markup:languageKeyboard
  });
  return {handled:true,type:'language_prompt'};
 }

 const cb=update?.callback_query;
 if(!cb||typeof cb.data!=='string'||!cb.data.startsWith('setlang:'))return {handled:false};

 const lang=cb.data.slice('setlang:'.length);
 if(!supported.has(lang)){
  await api('answerCallbackQuery',{callback_query_id:cb.id});
  return {handled:true,type:'invalid_language'};
 }

 // Telegram web_app buttons in keyboard messages are supported for private chats.
 // Do not let a group chat use someone else's callback to set their personal menu.
 const chat=cb.message?.chat;
 if(!chat||chat.type!=='private'||String(chat.id)!==String(cb.from?.id)){
  await api('answerCallbackQuery',{callback_query_id:cb.id});
  return {handled:true,type:'invalid_chat'};
 }

 const copy=botMessages[lang];
 const appUrl=appUrlForLanguage(publicAppUrl,lang);
 await api('answerCallbackQuery',{callback_query_id:cb.id});
 await api('sendMessage',{
  chat_id:chat.id,
  text:copy.welcome,
  ...(appUrl?{reply_markup:{inline_keyboard:[[{text:copy.button,web_app:{url:appUrl}}]]}}:{})
 });

 // Preserve the choice in Telegram itself: the bottom menu button now opens the
 // selected language even when this user reopens the bot after a long time.
 if(appUrl){
  try{await api('setChatMenuButton',{
   chat_id:chat.id,
   menu_button:{type:'web_app',text:copy.button,web_app:{url:appUrl}}
  })}catch(error){console.error('telegram_set_chat_menu_failed',error?.message)}
 }
 // Remove the old language choices to avoid multiple conflicting welcome messages.
 if(cb.message.message_id!=null){
  try{await api('editMessageText',{
   chat_id:chat.id,
   message_id:cb.message.message_id,
   text:copy.selected
  })}catch(error){console.error('telegram_edit_language_prompt_failed',error?.message)}
 }
 return {handled:true,type:'language_selected',lang,menuConfigured:Boolean(appUrl)};
}

export default async function handler(req,res){
 if(!requireMethod(req,res))return;
 if(!process.env.TELEGRAM_WEBHOOK_SECRET||req.headers['x-telegram-bot-api-secret-token']!==process.env.TELEGRAM_WEBHOOK_SECRET){
  return res.status(403).json({error:'forbidden'});
 }
 try{
  const result=await handleBotUpdate(req.body);
  return res.status(200).json({ok:true,...result});
 }catch(error){
  console.error('telegram_webhook_failed',error?.message);
  return res.status(502).json({error:'telegram_failed'});
 }
}
