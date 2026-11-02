export default function handler(req,res){res.status(200).json({ok:true,app:'FLEUR',mode:'demo',botConfigured:!!process.env.BOT_TOKEN,adminConfigured:!!process.env.ADMIN_CHAT_ID})}
