# Velluti HTML storefront

Plain HTML, CSS and JavaScript. No package installation or build step required. Serve `dist/` with any static web server (`python3 -m http.server 4173 --directory dist`). Open index.html for home and product.html for the product detail page. Local file opening also works for browsing; HTTP is required for integration tests.

## Status
Development preview, not ready for live sales. No prototype source was supplied; the workspace was empty. The supplied screenshot informed the visual direction. All created files are separate in this directory.

Implemented: responsive homepage and product page; accessible native dialog bag; localStorage bag persistence with graceful storage failure handling; quantity updates, removal, AUD totals; product gallery modes and campaign modal; native details accordions; reduced-motion support; focus indicators; semantic navigation; consent-aware subscription form; Shopify Storefront cartCreate checkout adapter.

The checkout follows Shopify's documented cartCreate response and redirects to its checkoutUrl: https://shopify.dev/docs/api/storefront/latest/mutations/cartCreate

## Configure integrations
Edit dist/config.js. Only PUBLIC Storefront tokens may be used in this browser-delivered file. Never expose Shopify Admin tokens or private Storefront tokens.
- shopDomain: your *.myshopify.com domain.
- storefrontToken: a public Storefront API token with required product/cart permissions.
- variantId: the published Shopify ProductVariant GID for the confirmed product.
- apiVersion: 2026-10; review version support before future launches.
- salesEnabled: keep false until all launch tests pass.
- subscriptionEndpoint: HTTPS POST backend accepting {email, consent, source}. Must implement origin restrictions, validation, rate limits, anti-abuse controls, consent records, double opt-in and unsubscribe. No email is submitted when absent.

Shopify is authoritative for price, inventory, taxes, shipping and payments. Current $50 local totals are placeholders. Before enabling sales, replace local hard-coded product data with Shopify product queries (including availability and AUD contextual price), reconcile the displayed total with returned cart costs, handle sold-out/unpublished variants, and test production permissions/CORS.

## Required before live launch
- Confirm product identity, formula/INCI, net weight, verified performance, safety/application instructions, final packaging and photography.
- Configure Shopify product, inventory, AUD market/prices, tax settings, shipping zones/rates, fulfilment and payment provider.
- Run test payment, decline, refund, delivery and tax scenarios, plus inventory and price changes. Current adapter has not been tested against a real Shopify store.
- Publish approved privacy, terms, shipping and returns policies plus business/contact details. Current policy dialogs are development notices only.
- Connect email backend; test consent and unsubscribe end to end.
- Integrate genuine reviews from a verified review provider. The current review section is explicitly empty; no review submission is implemented.
- Replace illustrative assets with approved final assets. Campaign imagery is AI-generated; garden artwork is AI-generated and the packaging rendering is an original code illustration. Botanicals do not imply ingredients.
- Set production canonical URL, Open Graph metadata, favicon, sitemap and verified Product structured data. Remove noindex only after approval for public launch. No fabricated availability or ratings are emitted.
- Self-host approved fonts if required; current Google Fonts request has system fallbacks. Confirm font/privacy requirements and final Lighthouse/Core Web Vitals audits.
- Complete screen-reader, keyboard and physical-device testing. See QA.md for checks actually performed.
- Set custom domain, monitoring, error reporting and suitable static-host security headers/CSP.

## Source control
GitHub source repository: https://github.com/thewingchunguy/Velluti . A separate Sites source repository is used for private preview deployment. The storefront remains a development preview; GitHub publication does not enable live checkout.

## Design references and assets
Fresh Supps informed the shopping progression (clear product CTA, benefit breakdown, storytelling, bag): https://freshsupps.com . Velluti branding, artwork and layout are original.
Generated campaign prompt and provenance: ASSETS.md.
