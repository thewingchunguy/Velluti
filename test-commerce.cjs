const { test } = require('node:test');
const assert = require('node:assert/strict');
const { quantity, cents, configured, createClient } = require('./dist/commerce.js');
const config = { salesEnabled: true, shopDomain: 'velluti-test.myshopify.com', storefrontToken: 'public-test', variantId: 'gid://shopify/ProductVariant/123', apiVersion: '2026-10' };
const price = amount => ({ amount, currencyCode: 'AUD' });
const product = overrides => ({ id: config.variantId, availableForSale: true, price: price('52.00'), requiresComponents: false, quantityRule: { minimum: 1, maximum: null, increment: 1 }, product: { title: 'The Styling Crème', requiresSellingPlan: false }, ...overrides });
const cart = overrides => ({ checkoutUrl: `https://${config.shopDomain}/checkouts/test`, totalQuantity: 2, cost: { subtotalAmount: price('104.00') }, lines: { nodes: [{ quantity: 2, merchandise: { id: config.variantId } }] }, ...overrides });
function client(responses, opts = {}) {
  let calls = [];
  const instance = createClient({ ...config, ...opts }, async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    const result = responses.shift();
    if (result instanceof Error) throw result;
    return { ok: true, json: async () => result };
  });
  return { ...instance, calls };
}
const data = value => ({ data: value });
const success = value => data({ cartCreate: { cart: value, userErrors: [], warnings: [] } });
test('corrupt persisted quantities are bounded and finite', () => {
  assert.equal(quantity('junk'), 0); assert.equal(quantity(Infinity), 0); assert.equal(quantity(-4), 0); assert.equal(quantity('200'), 99); assert.equal(quantity('2.8'), 2);
});
test('AUD decimal pricing becomes integer cents', () => { assert.equal(cents(price('50.01')), 5001); assert.equal(cents(price('0.00')), 0); });
test('invalid and foreign prices are rejected', () => { for (const p of [price('-1'), price('NaN'), price('1.005'), { amount: '50', currencyCode: 'USD' }]) assert.throws(() => cents(p)); });
test('only configured Shopify domains and variant GIDs pass validation', () => { assert.ok(configured(config)); assert.equal(configured({ ...config, shopDomain: 'evil.example' }), false); });
test('preview checkout makes no network calls', async () => { const c = client([], { salesEnabled: false }); await assert.rejects(c.prepareCheckout(2), { code: 'PREVIEW' }); assert.equal(c.calls.length, 0); });
test('missing credentials reject before network', async () => { const c = client([], { storefrontToken: '' }); await assert.rejects(c.loadProduct(), { code: 'CONFIG' }); assert.equal(c.calls.length, 0); });
test('current product price is loaded with Australian context', async () => {
  const c = client([data({ node: product() })]); const p = await c.loadProduct(); assert.equal(p.unitCents, 5200); assert.equal(p.available, true);
  assert.match(c.calls[0].body.query, /@inContext\(country: AU\)/); assert.equal(c.calls[0].body.variables.id, config.variantId);
});
test('missing or wrong product is rejected', async () => { for (const p of [null, product({ id: 'other' })]) { const c = client([data({ node: p })]); await assert.rejects(c.loadProduct(), { code: 'PRODUCT' }); } });
test('subscriptions and component bundles require a different purchase flow', async () => { for (const p of [product({ requiresComponents: true }), product({ product: { requiresSellingPlan: true } })]) await assert.rejects(client([data({ node: p })]).loadProduct(), { code: 'PRODUCT' }); });
test('sold out variants never create checkout', async () => { const c = client([data({ node: product({ availableForSale: false }) })]); await assert.rejects(c.prepareCheckout(2), { code: 'SOLD_OUT' }); assert.equal(c.calls.length, 1); });
test('zero, fractional and excess quantities cannot create checkout', async () => { for (const n of [0, 1.5, 100, -1]) await assert.rejects(client([]).prepareCheckout(n), { code: 'QUANTITY' }); });
test('Shopify quantity rules are honoured', async () => { const c = client([data({ node: product({ quantityRule: { minimum: 3, maximum: 10, increment: 3 } }) })]); await assert.rejects(c.prepareCheckout(2), { code: 'QUANTITY' }); });
test('confirmed cart uses Shopify price, returned subtotal and validated checkout URL', async () => {
  const c = client([data({ node: product() }), success(cart())]); const quote = await c.prepareCheckout(2);
  assert.equal(quote.unitCents, 5200); assert.equal(quote.subtotalCents, 10400); assert.equal(quote.quantity, 2);
  assert.equal(c.calls[1].body.variables.input.lines[0].quantity, 2); assert.equal(c.calls[1].body.variables.input.buyerIdentity.countryCode, 'AU');
});
test('changed stock counts are not silently accepted', async () => { const c = client([data({ node: product() }), success(cart({ totalQuantity: 1 }))]); await assert.rejects(c.prepareCheckout(2), { code: 'CHANGED' }); });
test('wrong merchandise is not silently accepted', async () => { const c = client([data({ node: product() }), success(cart({ lines: { nodes: [{ quantity: 2, merchandise: { id: 'other' } }] } }))]); await assert.rejects(c.prepareCheckout(2), { code: 'CHANGED' }); });
test('foreign checkout currency is rejected', async () => { const c = client([data({ node: product() }), success(cart({ cost: { subtotalAmount: { amount: '104', currencyCode: 'USD' } } }))]); await assert.rejects(c.prepareCheckout(2), { code: 'CURRENCY' }); });
test('untrusted redirect hosts, protocols and embedded credentials are rejected', async () => {
  for (const url of ['https://evil.example/checkout', 'http://velluti-test.myshopify.com/checkout', 'https://user:pass@velluti-test.myshopify.com/checkout']) {
    const c = client([data({ node: product() }), success(cart({ checkoutUrl: url }))]); await assert.rejects(c.prepareCheckout(2), { code: 'CHECKOUT_URL' });
  }
});
test('explicit custom Shopify checkout hostname is accepted', async () => { const c = client([data({ node: product() }), success(cart({ checkoutUrl: 'https://checkout.velluti.example/123' }))], { checkoutHostnames: ['checkout.velluti.example'] }); assert.match((await c.prepareCheckout(2)).checkoutUrl, /checkout.velluti.example/); });
test('GraphQL and cart errors stay actionable', async () => {
  await assert.rejects(client([{ errors: [{ message: 'Denied' }] }]).loadProduct(), { code: 'API' });
  await assert.rejects(client([data({ node: product() }), data({ cartCreate: { cart: null, userErrors: [{ code: 'INVALID' }] } })]).prepareCheckout(2), { code: 'CART' });
});
test('network failure never creates a quote', async () => { await assert.rejects(client([Error('offline')]).prepareCheckout(2), /offline/); });
