import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

test('product add button immediately confirms shopping cart', async ({ page }) => {
  await page.goto(process.env.BASE_URL || 'https://fluer-telegram-shop.vercel.app', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Додати .* до кошика/i }).first().click();
  await expect(page.getByRole('status')).toContainText('додано до кошика');
  await page.getByRole('button', { name: /До кошика/i }).click();
  await expect(page.getByRole('heading', { name: 'Ваш вибір' })).toBeVisible();
});

test('four-step demo order completes without bank data or charges', async ({ page }) => {
  await page.goto(process.env.BASE_URL || 'https://fluer-telegram-shop.vercel.app', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Додати .* до кошика/i }).first().click();
  await page.getByRole('button', { name: /До кошика/i }).click();
  await page.getByRole('button', { name: /Оформити замовлення/i }).click();
  await expect(page.getByText('Крок 1 із 4')).toBeVisible();
  await page.getByPlaceholder('Як до вас звертатися').fill('Тестовий покупець');
  await page.getByPlaceholder('+380 XX XXX XX XX').fill('+380991112233');
  await page.getByRole('button', { name: 'Продовжити' }).click();
  await expect(page.getByText('Крок 2 із 4')).toBeVisible();
  await page.getByPlaceholder('Ім’я').fill('Тестова отримувачка');
  await page.getByPlaceholder('+380 XX XXX XX XX').fill('+380991112233');
  await page.getByPlaceholder('Введіть вулицю').fill('Вулиця Тестова');
  await page.getByPlaceholder('№ будинку').fill('12');
  await page.getByRole('button', { name: 'Продовжити' }).click();
  await expect(page.getByText('Крок 3 із 4')).toBeVisible();
  await page.getByRole('button', { name: 'Продовжити' }).click();
  await expect(page.getByText('Крок 4 із 4')).toBeVisible();
  await page.locator('.co-method').filter({ hasText: 'Apple Pay' }).click();
  await page.getByRole('button', { name: 'Перейти до демо-оплати' }).click();
  await expect(page.getByRole('dialog', { name: 'Демонстраційна форма оплати' })).toBeVisible();
  await expect(page.getByText('Симуляція — без банківської авторизації')).toBeVisible();
  await page.getByRole('button', { name: /Завершити демо-замовлення/i }).click();
  await expect(page.getByText(/Тестове замовлення #DEMO-/)).toBeVisible();
  await expect(page.getByText(/Apple Pay/)).toBeVisible();
});

test('phone inputs use safe iOS font sizing and autocomplete', async ({ page }) => {
  await page.goto(process.env.BASE_URL || 'https://fluer-telegram-shop.vercel.app');
  await page.getByRole('button', { name: /Додати .* до кошика/i }).first().click();
  await page.getByRole('button', { name: /До кошика/i }).click();
  await page.getByRole('button', { name: /Оформити замовлення/i }).click();
  const phone = page.getByPlaceholder('+380 XX XXX XX XX');
  await expect(phone).toHaveAttribute('autocomplete', 'tel');
  await expect(phone).toHaveCSS('font-size', '16px');
  await expect(page.getByRole('button', { name: 'Мій номер у Telegram' })).toBeVisible();
});
