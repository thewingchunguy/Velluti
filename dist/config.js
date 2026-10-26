// Public Storefront API access only. Never put Shopify Admin/private tokens here.
window.VELLUTI_CONFIG = Object.freeze({
  shopDomain: '', // e.g. your-shop.myshopify.com
  storefrontToken: '', // PUBLIC Storefront API token
  apiVersion: '2026-10',
  variantId: '', // gid://shopify/ProductVariant/...
  salesEnabled: false, // enable only after launch checklist and payment tests
  subscriptionEndpoint: '' // Your HTTPS consent-aware email subscription backend
});
