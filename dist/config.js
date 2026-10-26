// PUBLIC configuration. Never expose Shopify Admin or private Storefront tokens.
window.VELLUTI_CONFIG = Object.freeze({
  shopDomain: '',                  // your-shop.myshopify.com
  storefrontToken: '',             // PUBLIC Storefront API token
  apiVersion: '2026-10',
  variantId: '',                   // gid://shopify/ProductVariant/...
  checkoutHostnames: [],           // approved custom Shopify checkout domain, if used
  salesEnabled: false,             // enable only after the launch checklist and payment tests
  subscriptionEndpoint: ''        // HTTPS consent-aware subscription backend
});
