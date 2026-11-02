# FLEUR — Telegram Mini App для доставки квітів

Demo-first storefront for Dnipro and nearby towns. Responsive Ukrainian-language catalog, cart, recipient form, delivery time selection and Telegram test-order notification.

**Status:** TEST ONLY — no payment, shipping fulfillment, stock control, database or guaranteed delivery. Prices and product images are placeholders. Never use this demo to process real payments.

## Architecture
- `index.html`: mobile storefront, Telegram WebApp SDK, cart and checkout.
- `api/order.js`: validates Telegram signed initData, recomputes prices on server and notifies admin chat.
- `api/webhook.js`: handles Telegram `/start` commands; guarded by webhook secret header.
- `api/health.js`: diagnostic endpoint.
- `api/_lib.js`: Telegram authentication and API helpers.
- Deployment: GitHub main → Vercel production.

## Setup
1. Revoke any bot token pasted in chat via @BotFather and generate a new one.
2. In Vercel project environment variables (Production), set:
   - `BOT_TOKEN`: rotated Telegram bot token (secret)
   - `ADMIN_CHAT_ID`: numeric chat ID to receive test orders; bot needs permission to send messages there
   - `TELEGRAM_WEBHOOK_SECRET`: cryptographically random 32+ character string
   - `PUBLIC_APP_URL`: final deployed HTTPS URL
3. Redeploy production to apply variables.
4. Set webhook with Telegram Bot API `setWebhook`, using `https://YOUR_DOMAIN/api/webhook` and `secret_token` matching `TELEGRAM_WEBHOOK_SECRET`.
5. In BotFather, assign Mini App URL (Menu Button), or open the bot and send `/start`.
6. Test `/api/health`, `/start`, storefront cart and Telegram-initiated checkout. A regular browser lacks Telegram initData, so sending orders from a standard browser is intentionally rejected.

## Safety
- API validates Telegram HMAC and auth_date, and does not trust client-submitted prices.
- Webhook checks Telegram secret-token header.
- No tokens or personal customer details belong in Git history.
- The demo currently sends customer name, phone and address to the configured admin Telegram chat. Only test with consent.
- Orders are not persisted in a server database; repeated submissions can trigger duplicate admin notifications.
- Before launch: database, idempotency, rate limits, proper bot setup, consent/privacy documentation, delivery rules, real catalog management, admin interface, payment integration and stock reservations.

## Demo limitations
No real delivery fee is calculated for outskirts. Checkout explicitly calls the request a test; success means Telegram sent a notification to the configured admin only, not that an order was fulfilled.
