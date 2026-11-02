import crypto from 'node:crypto';
export function validate(initData, token) {
 if(!initData||!token)return null;
 const params=new URLSearchParams(initData), hash=params.get('hash'), authDate=Number(params.get('auth_date'));
 if(!hash||!/^[a-f0-9]{64}$/i.test(hash)||!authDate||Math.abs(Date.now()/1000-authDate)>86400)return null;
 params.delete('hash');
 const data=[...params.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+'='+v).join('\n');
 const key=crypto.createHmac('sha256','WebAppData').update(token).digest();
 const actual=crypto.createHmac('sha256',key).update(data).digest();
 if(!crypto.timingSafeEqual(Buffer.from(hash,'hex'),actual))return null;
 try{const user=JSON.parse(params.get('user')||'{}');return user?.id?user:null}catch{return null}
}
export async function telegram(method,payload) {
 const token=process.env.BOT_TOKEN;
 if(!token)throw new Error('bot_not_configured');
 const response=await fetch('https://api.telegram.org/bot'+token+'/'+method,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
 const data=await response.json();if(!response.ok||!data.ok)throw new Error('telegram_error');return data;
}
export function requireMethod(req,res){if(req.method!=='POST'){res.setHeader('Allow','POST');res.status(405).json({error:'method_not_allowed'});return false}return true}
