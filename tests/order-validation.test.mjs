import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import handler from '../api/order.js';

const token='test-token';
const oldToken=process.env.BOT_TOKEN;
const oldAdmin=process.env.ADMIN_CHAT_ID;
process.env.BOT_TOKEN=token;
process.env.ADMIN_CHAT_ID='12345';

function signedData(){
 const params=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id:42})});
 const data=[...params.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+'='+v).join('\\n');
 const key=crypto.createHmac('sha256','WebAppData').update(token).digest();
 params.set('hash',crypto.createHmac('sha256',key).update(data).digest('hex'));
 return params.toString();
}
function request(items,date){
 const customer={name:'Buyer',phone:'+380991112233',recipient:'Recipient',recipientPhone:'+380991112233',destination:'Dnipro',date};
 return {method:'POST',body:{initData:signedData(),items,customer}};
}
async function invoke(req){
 let status=200,body;
 const res={setHeader(){},status(code){status=code;return this},json(value){body=value;return this}};
 await handler(req,res);
 return {status,body};
}
const tomorrow=()=>new Date(Date.now()+86400000*3).toISOString().slice(0,10);

test('rejects inherited prototype names as products',async()=>{
 const result=await invoke(request({constructor:1},tomorrow()));
 assert.equal(result.status,400);
 assert.equal(result.body.error,'invalid_items');
});
test('rejects impossible dates',async()=>{
 const result=await invoke(request({rose:1},'2027-02-30'));
 assert.equal(result.status,400);
 assert.equal(result.body.error,'invalid_date');
});
test('rejects past dates',async()=>{
 const result=await invoke(request({rose:1},'2020-01-01'));
 assert.equal(result.status,400);
 assert.equal(result.body.error,'past_date');
});
test('requires Telegram authentication',async()=>{
 const req=request({rose:1},tomorrow());
 req.body.initData='bad';
 const result=await invoke(req);
 assert.equal(result.status,401);
});
test('rejects inflated cart quantities',async()=>{
 const result=await invoke(request({rose:999},tomorrow()));
 assert.equal(result.status,400);
});
test.after(()=>{
 if(oldToken===undefined)delete process.env.BOT_TOKEN;else process.env.BOT_TOKEN=oldToken;
 if(oldAdmin===undefined)delete process.env.ADMIN_CHAT_ID;else process.env.ADMIN_CHAT_ID=oldAdmin;
});
