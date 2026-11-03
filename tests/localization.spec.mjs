import {test,expect} from '@playwright/test';

test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const base=process.env.BASE_URL||'http://127.0.0.1:4173';

test('query language, translated catalog and persistent manual override',async({page})=>{
 await page.goto(base+'/?lang=en');
 await expect(page.getByRole('heading',{name:/Flowers/})).toBeVisible();
 await expect(page.getByRole('button',{name:'English'})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Catalog',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Flower catalog'})).toBeVisible();
 await expect(page.getByPlaceholder('Find your perfect bouquet')).toBeVisible();
 await expect(page.getByText('Burgundy Symphony')).toBeVisible();
 await page.getByRole('button',{name:'Русский'}).click();
 await expect(page.getByRole('heading',{name:'Каталог цветов'})).toBeVisible();
 await expect(page.getByText('Бордовая симфония')).toBeVisible();
 await expect(page.getByRole('button',{name:'Русский'})).toHaveAttribute('aria-pressed','true');
 await page.reload();
 await expect(page.getByRole('heading',{name:/Цветы/})).toBeVisible();
 await expect(page.getByRole('button',{name:'Русский'})).toHaveAttribute('aria-pressed','true');
 await expect(page).not.toHaveURL(/lang=en/);
});

test('language can change within checkout without losing form data or cart',async({page})=>{
 await page.goto(base+'/?lang=uk');
 await page.getByRole('button',{name:/Додати .* до кошика/}).first().click();
 await page.getByRole('button',{name:'До кошика',exact:true}).click();
 await page.getByRole('button',{name:'Оформити замовлення'}).click();
 await expect(page.getByText('Крок 1 із 4')).toBeVisible();
 await page.getByPlaceholder('Як до вас звертатися').fill('Test Guest');
 await page.getByPlaceholder('+380 XX XXX XX XX').fill('+380991112233');
 await page.locator('.co-lang-switch').getByRole('button',{name:'English'}).click();
 await expect(page.getByText('Step 1 of 4')).toBeVisible();
 await expect(page.getByPlaceholder('How should we address you?')).toHaveValue('Test Guest');
 await page.getByRole('button',{name:'Continue'}).click();
 await expect(page.getByText('Step 2 of 4')).toBeVisible();
 await expect(page.getByText('Who is receiving the flowers?')).toBeVisible();
 await page.locator('.co-lang-switch').getByRole('button',{name:'Русский'}).click();
 await expect(page.getByText('Шаг 2 из 4')).toBeVisible();
 await expect(page.getByText('Кому вручить цветы?')).toBeVisible();
});

test('country flags are visible and accessible in all three languages', async({page})=>{
 await page.goto(base+'/?lang=uk');
 const sw=page.locator('.fleur-lang-switch');
 for(const [name,flag] of [['Українська','🇺🇦'],['Русский','🇷🇺'],['English','🇬🇧']]){
  const button=sw.getByRole('button',{name});
  await expect(button).toBeVisible();
  await expect(button).toContainText(flag);
 }
 await sw.getByRole('button',{name:'English'}).click();
 await expect(page.getByRole('heading',{name:/Flowers/})).toBeVisible();
 await sw.getByRole('button',{name:'Русский'}).click();
 await expect(page.getByRole('heading',{name:/Цветы/})).toBeVisible();
 await sw.getByRole('button',{name:'Українська'}).click();
 await expect(page.getByRole('heading',{name:/Квіти/})).toBeVisible();
});
test('validation errors change language in-place without resetting checkout fields',async({page})=>{
 await page.goto(base+'/?lang=ru');
 await page.getByRole('button',{name:/Добавить .* в корзину/}).first().click();
 await page.getByRole('button',{name:'В корзину',exact:true}).click();
 await page.getByRole('button',{name:'Оформить заказ'}).click();
 await page.getByRole('button',{name:'Продолжить'}).click();
 await expect(page.getByText('Укажите имя и корректный номер телефона.')).toBeVisible();
 await page.locator('.co-lang-switch').getByRole('button',{name:'English'}).click();
 await expect(page.getByText('Enter your name and a valid phone number.')).toBeVisible();
 await expect(page.getByText('Укажите имя и корректный номер телефона.')).toHaveCount(0);
});
