import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {I18N,SUPPORTED_LANGS,LANG_LABELS,DATE_LOCALES,t,money} from '../src/i18n.js';
const keys=Object.keys(I18N.uk).sort();
const source=[
readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8'),
readFileSync(new URL('../src/CheckoutFlow.jsx',import.meta.url),'utf8')
].join('\n');
test('supported languages match beauty TMA locale options',()=>{
 assert.deepEqual(SUPPORTED_LANGS,['uk','ru','en']);
 for(const lang of SUPPORTED_LANGS){assert.ok(LANG_LABELS[lang]);assert.ok(DATE_LOCALES[lang])}
});
test('all three dictionaries have identical non-empty keys and interpolations',()=>{
 for(const lang of SUPPORTED_LANGS){
  assert.deepEqual(Object.keys(I18N[lang]).sort(),keys,lang+' key mismatch');
  for(const key of keys){
   assert.equal(typeof I18N[lang][key],'string',lang+'/'+key);
   assert.ok(I18N[lang][key].length,lang+'/'+key+' empty');
   const tags=s=>[...s.matchAll(/\{([a-zA-Z_]+)\}/g)].map(x=>x[1]).sort();
   assert.deepEqual(tags(I18N[lang][key]),tags(I18N.uk[key]),lang+'/'+key+' interpolation mismatch');
  }
 }
});
test('all literal translation calls in components are implemented',()=>{
 const references=[...source.matchAll(/\btr\('([^']+)'/g)].map(x=>x[1]);
 for(const ref of references)assert.ok(ref in I18N.uk,'missing translation '+ref);
 for(const step of [1,2,3,4])for(const suffix of ['', 'Title','Desc']) assert.ok('checkout.step'+step+suffix in I18N.en);
 for(const cat of ['all','roses','chrysanthemums','lisianthus'])assert.ok('cat.'+cat in I18N.ru);
 for(const id of ['rose','peony','tulip','lilac','ivory','redcream','fuchsia','eustoma'])
 for(const part of ['name','desc','tag'])assert.ok('product.'+id+'.'+part in I18N.en);
});
test('locale text, placeholders and currencies render correctly',()=>{
 assert.equal(t('en','nav.profile'),'Profile');
 assert.equal(t('ru','cart.addLabel',{name:'Розовая мечта'}),'Добавить Розовая мечта в корзину');
 assert.equal(t('uk','orders.test',{id:'DEMO-A'}),'Тестове замовлення #DEMO-A');
 assert.equal(t('en','cart.count',{count:2}),'2 pcs');
 assert.match(money(2450,'en'),/2,450 ₴/);
 assert.equal(t('invalid','nav.home'),I18N.uk['nav.home']);
});
