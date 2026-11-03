import {test,expect} from '@playwright/test';
import {I18N} from '../src/i18n.js';

test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const base=process.env.BASE_URL||'http://127.0.0.1:4173';

const bounds = async element => element.evaluate(el=>{
 const rect=el.getBoundingClientRect();
 return {left:rect.left,right:rect.right,width:rect.width,top:rect.top,bottom:rect.bottom,
  viewport:window.innerWidth,transform:getComputedStyle(el).transform,
  docWidth:document.documentElement.scrollWidth};
});

for(const width of [320,360,390,430,768]){
 test('cart toast stays centered and checkout flag row fits at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:844});
  await page.goto(base+'/?lang=en');
  await expect(page.getByRole('heading',{name:/Flowers/})).toBeVisible();
  const flags=page.locator('.fleur-lang-switch button');
  await expect(flags).toHaveCount(3);
  for(let i=0;i<3;i++) {
   const b=await bounds(flags.nth(i));
   expect(b.left, 'header language '+i).toBeGreaterThanOrEqual(-1);
   expect(b.right, 'header language '+i).toBeLessThanOrEqual(width+1);
  }
  await page.getByRole('button',{name:/Add .* to cart/}).first().click();
  const toast=page.locator('.cart-toast');
  await expect(toast).toBeVisible();
  await expect(toast).toContainText('added to cart');
  const t=await bounds(toast);
  expect(t.transform,'toast should not use horizontal transform').toBe('none');
  expect(t.left).toBeGreaterThanOrEqual(10);
  expect(t.right).toBeLessThanOrEqual(width-10);
  expect(Math.abs((t.left+t.right)/2-width/2),'toast must be horizontally centered').toBeLessThan(2.1);
  const cta=await bounds(toast.getByRole('button',{name:'View cart'}));
  expect(cta.left).toBeGreaterThanOrEqual(t.left);
  expect(cta.right).toBeLessThanOrEqual(t.right+1);
  await toast.getByRole('button',{name:'View cart'}).click();
  await expect(page.getByRole('heading',{name:'Your selection'})).toBeVisible();
  await page.getByRole('button',{name:'Checkout'}).click();
  await expect(page.getByText('Step 1 of 4')).toBeVisible();
  const checkoutFlags=page.locator('.co-lang-switch button');
  await expect(checkoutFlags).toHaveCount(3);
  const flagPositions=await Promise.all([0,1,2].map(i=>bounds(checkoutFlags.nth(i))));
  expect(flagPositions[0].left).toBeLessThan(flagPositions[1].left);
  expect(flagPositions[1].left).toBeLessThan(flagPositions[2].left);
  for(const [i,p] of flagPositions.entries()){
   expect(p.left,'checkout language '+i).toBeGreaterThanOrEqual(-1);
   expect(p.right,'checkout language '+i).toBeLessThanOrEqual(width+1);
  }
  const scroll=await page.evaluate(()=>document.documentElement.scrollWidth);
  expect(scroll,'viewport must not scroll horizontally').toBeLessThanOrEqual(width+1);
 });
}

for(const lang of ['uk','ru','en']){
 test('translated core pages and payment choices for '+lang,async({page})=>{
  await page.goto(base+'/?lang='+lang);
  const copy=I18N[lang];
  await expect(page.getByRole('heading',{name:new RegExp(copy['home.h1a'].replace('.','\\.'))})).toBeVisible();
  await page.getByRole('button',{name:copy['nav.catalog'],exact:true}).click();
  await expect(page.getByRole('heading',{name:copy['catalog.title']})).toBeVisible();
  await expect(page.getByPlaceholder(copy['catalog.search'])).toBeVisible();
  for(const id of ['rose','peony','tulip','lilac','ivory','redcream','fuchsia','eustoma'])
   await expect(page.getByRole('heading',{name:copy['product.'+id+'.name']})).toBeVisible();
  await page.getByRole('button',{name:copy['nav.favs'],exact:true}).click();
  await expect(page.getByRole('heading',{name:copy['fav.title']})).toBeVisible();
  await page.getByRole('button',{name:copy['nav.orders'],exact:true}).click();
  await expect(page.getByRole('heading',{name:copy['orders.title']})).toBeVisible();
  await page.getByRole('button',{name:copy['nav.profile'],exact:true}).click();
  await expect(page.getByRole('heading',{name:copy['profile.title']})).toBeVisible();
  await page.getByRole('button',{name:copy['nav.home'],exact:true}).click();
  await page.getByRole('button',{name:copy['cart.addLabel'].replace('{name}',copy['product.rose.name'])}).first().click();
  await page.locator('.cart-toast').getByRole('button',{name:copy['cart.shortcut']}).click();
  await expect(page.getByRole('heading',{name:copy['cart.selected']})).toBeVisible();
  await page.getByRole('button',{name:copy['cart.checkout']}).click();
  await expect(page.getByText(copy['checkout.step1Title'])).toBeVisible();
  await page.getByPlaceholder(copy['checkout.namePlaceholder']).fill('Test Customer');
  await page.getByPlaceholder('+380 XX XXX XX XX').fill('+380991112233');
  await page.getByRole('button',{name:copy['checkout.continue']}).click();
  await expect(page.getByText(copy['checkout.step2Title'])).toBeVisible();
  await page.getByPlaceholder(copy['checkout.recipientPlaceholder'],{exact:true}).fill('Test Recipient');
  await page.getByPlaceholder('+380 XX XXX XX XX').fill('+380991112233');
  await page.getByPlaceholder(copy['checkout.streetPlaceholder']).fill('Test street');
  await page.getByPlaceholder(copy['checkout.housePlaceholder']).fill('12');
  await page.getByRole('button',{name:copy['checkout.continue']}).click();
  await expect(page.getByText(copy['checkout.step3Title'])).toBeVisible();
  await page.getByRole('button',{name:copy['checkout.continue']}).click();
  await expect(page.getByText(copy['checkout.step4Title'])).toBeVisible();
  await expect(page.getByText(copy['pay.privat'])).toBeVisible();
  await page.locator('.co-method').filter({hasText:copy['pay.privat']}).click();
  await page.getByRole('button',{name:copy['checkout.paymentNext']}).click();
  await expect(page.getByText(copy['checkout.testCard'])).toBeVisible();
  await expect(page.getByText(copy['checkout.cardSafe'])).toBeVisible();
 });
}
