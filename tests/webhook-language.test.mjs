import test from 'node:test';
import assert from 'node:assert/strict';
import {
 CHOOSE_LANGUAGE,languageKeyboard,botMessages,appUrlForLanguage,languageFromChatMenu,handleBotUpdate
} from '../api/webhook.js';
import {getInitialLang} from '../src/i18n.js';

const appUrl='https://flowerly-dnipro-tma.vercel.app/?campaign=fleur';
const commands=(options={})=>{
 const calls=[];
 const api=async(method,payload)=>{
  calls.push({method,payload});
  if(options.failMenu&&method==='setChatMenuButton')throw Error('temporary Telegram API issue');
  if(method==='getChatMenuButton')return {ok:true,result:options.savedMenu||{type:'default'}};
  return {ok:true,result:true};
 };
 return {calls,api};
};
const pick=(lang)=>({
 callback_query:{
  id:'cb-id-'+lang,
  from:{id:12345,language_code:'uk'},
  message:{message_id:234,chat:{id:12345,type:'private'}},
  data:'setlang:'+lang
 }
});

test('/start always offers four distinct inline language buttons regardless of user Telegram language',async()=>{
 const {api,calls}=commands();
 for(const message of [
  {message:{chat:{id:12345,type:'private'},from:{language_code:'en'},text:'/start'}},
  {message:{chat:{id:12345,type:'private'},from:{language_code:'ru'},text:'/start campaign'}}
 ]){
  const result=await handleBotUpdate(message,api,appUrl);
  assert.equal(result.type,'language_prompt');
 }
 assert.equal(calls.length,4);
 for(const {method,payload} of calls.filter(x=>x.method==='sendMessage')){
  assert.equal(method,'sendMessage');
  assert.equal(payload.text,CHOOSE_LANGUAGE);
  assert.deepEqual(payload.reply_markup,languageKeyboard);
  assert.deepEqual(
   payload.reply_markup.inline_keyboard.map(row=>row[0].callback_data),
   ['setlang:uk','setlang:pl','setlang:en','setlang:ru']
  );
 }
});

test('each selected language returns a localized menu, preserved query and per-chat menu button',async()=>{
 for(const lang of ['uk','en','ru','pl']){
  const {api,calls}=commands();
  const result=await handleBotUpdate(pick(lang),api,appUrl);
  assert.deepEqual(result,{handled:true,type:'language_selected',lang,menuConfigured:true});
  assert.deepEqual(calls.map(x=>x.method),[
   'answerCallbackQuery','sendMessage','setChatMenuButton','editMessageText'
  ]);
  const message=calls[1].payload;
  assert.equal(message.chat_id,12345);
  assert.equal(message.text,botMessages[lang].welcome);
  assert.equal(message.reply_markup.inline_keyboard[0][0].text,botMessages[lang].button);
  const sentUrl=new URL(message.reply_markup.inline_keyboard[0][0].web_app.url);
  assert.equal(sentUrl.searchParams.get('campaign'),'fleur');
  assert.equal(sentUrl.searchParams.get('lang'),lang);
  const menu=calls[2].payload;
  assert.equal(menu.chat_id,12345);
  assert.equal(menu.menu_button.type,'web_app');
  assert.equal(menu.menu_button.web_app.url,sentUrl.toString());
  assert.equal(calls[3].payload.text,botMessages[lang].selected);
  assert.equal(calls[3].payload.message_id,234);
 }
});

test('unsupported callbacks are acknowledged without choosing a language',async()=>{
 const {api,calls}=commands();
 const result=await handleBotUpdate(pick('invalid'),api,appUrl);
 assert.equal(result.type,'invalid_language');
 assert.deepEqual(calls.map(x=>x.method),['answerCallbackQuery']);
});

test('group chat and mismatched callback origin cannot set user menu',async()=>{
 const {api,calls}=commands();
 const event=pick('en');
 event.callback_query.message.chat.type='supergroup';
 event.callback_query.message.chat.id=-1001234;
 const result=await handleBotUpdate(event,api,appUrl);
 assert.equal(result.type,'invalid_chat');
 assert.deepEqual(calls.map(x=>x.method),['answerCallbackQuery']);
});

test('a menu-button API failure cannot prevent the localized welcome from reaching a user',async()=>{
 const {api,calls}=commands({failMenu:true});
 const result=await handleBotUpdate(pick('ru'),api,appUrl);
 assert.equal(result.type,'language_selected');
 assert.equal(calls[1].method,'sendMessage');
 assert.equal(calls.at(-1).method,'editMessageText');
});

test('invalid URL never yields an insecure web_app button',async()=>{
 assert.equal(appUrlForLanguage('http://unsecured.example','en'),null);
 assert.equal(appUrlForLanguage('invalid address','en'),null);
 assert.equal(appUrlForLanguage(appUrl,'invalid'),null);
 const {api,calls}=commands();
 await handleBotUpdate(pick('en'),api,'http://unsecured.example');
 assert.equal(calls[1].payload.reply_markup,undefined);
 assert.equal(calls.some(x=>x.method==='setChatMenuButton'),false);
});

test('the bot-selected deep-link language is stored for later direct WebApp launches',()=>{
 const original=globalThis.window;
 const state=new Map([['fleur_lang','ru']]);
 globalThis.window={
  location:{search:'?lang=en'},
  localStorage:{getItem:key=>state.get(key)||null,setItem:(key,value)=>state.set(key,value)}
 };
 try{
  assert.equal(getInitialLang(),'en');
  assert.equal(state.get('fleur_lang'),'en');
  globalThis.window.location.search='?lang=pl';
  assert.equal(getInitialLang(),'pl');
  assert.equal(state.get('fleur_lang'),'pl');
  globalThis.window.location.search='';
  assert.equal(getInitialLang(),'pl');
 }finally{
  if(original===undefined)delete globalThis.window;
  else globalThis.window=original;
 }
});

test('returning private user keeps the previous Polish language on /start',async()=>{
 const savedMenu={type:'web_app',web_app:{url:appUrlForLanguage(appUrl,'pl')}};
 const {api,calls}=commands({savedMenu});
 const result=await handleBotUpdate({message:{chat:{id:12345,type:'private'},from:{id:12345},text:'/start'}},api,appUrl);
 assert.deepEqual(result,{handled:true,type:'returning_user',lang:'pl'});
 assert.deepEqual(calls.map(x=>x.method),['getChatMenuButton','sendMessage']);
 assert.equal(calls[1].payload.text,botMessages.pl.welcome);
 assert.equal(new URL(calls[1].payload.reply_markup.inline_keyboard[0][0].web_app.url).searchParams.get('lang'),'pl');
});
test('a forged Telegram menu URL cannot override the user language',()=>{
 assert.equal(languageFromChatMenu({type:'web_app',web_app:{url:'https://evil.example/?lang=pl'}},appUrl),null);
 assert.equal(languageFromChatMenu({type:'web_app',web_app:{url:appUrlForLanguage(appUrl,'ru')}},appUrl),'ru');
});
