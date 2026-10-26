/* Shared browser/Node commerce adapter. Only public Storefront credentials belong here. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VellutiCommerce = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  class CommerceError extends Error {
    constructor(message, code = 'UNAVAILABLE') { super(message); this.name = 'CommerceError'; this.code = code; }
  }
  function quantity(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.min(99, Math.max(0, Math.trunc(parsed))) : 0;
  }
  function cents(money) {
    if (!money || money.currencyCode !== 'AUD' || !/^\d+(\.\d{1,2})?$/.test(String(money.amount))) {
      throw new CommerceError('Australian pricing is unavailable. Please try again later.', 'CURRENCY');
    }
    const value = Math.round(Number(money.amount) * 100);
    if (!Number.isSafeInteger(value)) throw new CommerceError('The price could not be verified.', 'PRICE');
    return value;
  }
  function configured(config) {
    return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(config.shopDomain || '') &&
      /^gid:\/\/shopify\/ProductVariant\/\d+$/.test(config.variantId || '') &&
      /^\d{4}-(01|04|07|10)$/.test(config.apiVersion || '') && !!config.storefrontToken;
  }
  function createClient(config, fetcher = fetch) {
    async function request(query, variables) {
      if (!configured(config)) throw new CommerceError('Store connection is not configured.', 'CONFIG');
      const response = await fetcher(`https://${config.shopDomain}/api/${config.apiVersion}/graphql.json`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': config.storefrontToken },
        body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(15000)
      });
      if (!response.ok) throw new CommerceError('The store is unavailable. Your bag is saved.', 'NETWORK');
      const result = await response.json();
      if (result.errors?.length || !result.data) throw new CommerceError('The store could not confirm this request. Please try again.', 'API');
      return result.data;
    }
    async function loadProduct() {
      const data = await request(`query VellutiProduct($id: ID!) @inContext(country: AU) {
        node(id: $id) { ... on ProductVariant {
          id availableForSale price { amount currencyCode }
          quantityRule { minimum maximum increment } requiresComponents
          product { title requiresSellingPlan }
        } }
      }`, { id: config.variantId });
      const variant = data.node;
      if (!variant || variant.id !== config.variantId) throw new CommerceError('This product is not currently available.', 'PRODUCT');
      if (variant.requiresComponents || variant.product?.requiresSellingPlan) throw new CommerceError('This product requires a different purchase option.', 'PRODUCT');
      return { title: variant.product?.title || 'The Styling Crème', unitCents: cents(variant.price), available: variant.availableForSale === true, rules: variant.quantityRule || { minimum: 1, maximum: null, increment: 1 } };
    }
    async function prepareCheckout(count) {
      if (!config.salesEnabled) throw new CommerceError('Checkout is not yet available. Your bag is saved.', 'PREVIEW');
      const requested = quantity(count);
      if (!requested || requested !== count) throw new CommerceError('Please check the quantity in your bag.', 'QUANTITY');
      const product = await loadProduct();
      if (!product.available) throw new CommerceError('This product is currently sold out. Your bag is saved.', 'SOLD_OUT');
      const { minimum, maximum, increment } = product.rules;
      if (requested < minimum || (maximum && requested > maximum) || requested % increment !== 0) {
        throw new CommerceError('This quantity is not available. Please adjust your bag.', 'QUANTITY');
      }
      const data = await request(`mutation VellutiCart($input: CartInput!) @inContext(country: AU) {
        cartCreate(input: $input) {
          cart { checkoutUrl totalQuantity cost { subtotalAmount { amount currencyCode } }
            lines(first: 10) { nodes { quantity merchandise { ... on ProductVariant { id } } } }
          }
          userErrors { code message }
          warnings { code message }
        }
      }`, { input: { buyerIdentity: { countryCode: 'AU' }, lines: [{ merchandiseId: config.variantId, quantity: requested }] } });
      const payload = data.cartCreate;
      if (payload?.userErrors?.length || !payload?.cart) throw new CommerceError('The store could not prepare checkout. Please check availability and try again.', 'CART');
      const cart = payload.cart;
      const lines = cart.lines?.nodes;
      if (cart.totalQuantity !== requested || lines?.length !== 1 || lines[0].quantity !== requested || lines[0].merchandise?.id !== config.variantId) {
        throw new CommerceError('Availability changed. Please review your bag and try again.', 'CHANGED');
      }
      const url = new URL(cart.checkoutUrl);
      const allowed = [config.shopDomain, ...(config.checkoutHostnames || [])];
      if (url.protocol !== 'https:' || url.username || url.password || !allowed.includes(url.hostname)) {
        throw new CommerceError('The checkout address could not be verified.', 'CHECKOUT_URL');
      }
      return { ...product, subtotalCents: cents(cart.cost?.subtotalAmount), quantity: requested, checkoutUrl: url.href, warnings: payload.warnings || [] };
    }
    return { loadProduct, prepareCheckout };
  }
  return { CommerceError, quantity, cents, configured, createClient };
});
