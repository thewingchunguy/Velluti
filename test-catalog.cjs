const { test } = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('./dist/catalog.js');
test('four editable placeholders have unique identities and AUD $50 pricing', () => {
 assert.equal(catalog.products.length, 4); assert.equal(new Set(catalog.products.map(p => p.id)).size, 4);
 assert.ok(catalog.products.every(p => p.placeholder && p.unitCents === 5000));
});
test('different products remain separate bag lines', () => {
 let bag = catalog.add({}, 'styling-creme', 2); bag = catalog.add(bag, 'texture-paste', 1);
 assert.equal(catalog.lines(bag).length, 2); assert.deepEqual(catalog.totals(bag), { count: 3, subtotalCents: 15000 });
});
test('adding the same product merges only that product', () => {
 let bag = catalog.add({}, 'texture-paste', 1); bag = catalog.add(bag, 'texture-paste', 2);
 assert.equal(catalog.lines(bag).length, 1); assert.equal(bag['texture-paste'], 3);
});
test('removing one product preserves all other products', () => {
 const bag = catalog.set({ 'styling-creme': 2, 'shaping-pomade': 1 }, 'styling-creme', 0);
 assert.deepEqual(bag, { 'shaping-pomade': 1 }); assert.equal(catalog.totals(bag).subtotalCents, 5000);
});
test('quantities are bounded independently per product', () => {
 const bag = catalog.add({ 'styling-creme': 98, 'texture-paste': 2 }, 'styling-creme', 5);
 assert.equal(bag['styling-creme'], 99); assert.equal(bag['texture-paste'], 2);
});
test('invalid stored identities and quantities are discarded', () => {
 assert.deepEqual(catalog.normalize({ unknown: 1, 'styling-creme': 'bad', 'texture-paste': -8, 'finishing-creme': Infinity }), {});
 assert.deepEqual(catalog.normalize(null), {}); assert.deepEqual(catalog.normalize([]), {});
});
test('all four ritual selections total $200 without an invented discount', () => {
 const bag = catalog.products.reduce((bag,p) => catalog.add(bag,p.id), {});
 assert.deepEqual(catalog.totals(bag), { count: 4, subtotalCents: 20000 });
});
test('the old single-product bag migrates without losing quantity', () => {
 assert.deepEqual(catalog.migrate('3'), { 'styling-creme': 3 }); assert.deepEqual(catalog.migrate('garbage'), {});
});
test('bag serialization preserves identities and subtotals', () => {
 const original = { 'texture-paste': 3, 'finishing-creme': 2 };
 assert.deepEqual(catalog.totals(catalog.normalize(JSON.parse(JSON.stringify(original)))), { count: 5, subtotalCents: 25000 });
});
test('unknown product additions cannot become purchasable bag lines', () => { assert.deepEqual(catalog.add({}, '<script>', 5), {}); });
