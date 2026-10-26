# Velluti — HTML storefront

Italian-inspired men's grooming. Plain HTML, CSS and JavaScript with no build step or application dependencies.

## Run and test

```sh
python3 -m http.server 4173 --directory dist
node --test test-commerce.cjs
```

Open http://localhost:4173 . Use a modern browser and Node 20+ for the test suite. `index.html`, `product.html` and `journal.html` are the entry pages. Serve only `dist/` to keep development files outside the document root.

## Current status

Private development preview: https://velluti-grooming-atelier.brawnybay19.chatgpt.site . GitHub: https://github.com/thewingchunguy/Velluti . Products and prices remain concepts; live orders are disabled.

The supplied screenshot informed the direction. The initial workspace was empty, so no prototype source was replaced. The first implementation and subsequent improvements are preserved in Git history.

Built: responsive home, product and journal pages; original illustrative campaign and packshot imagery; garden watercolour; mobile menu; keyboard image gallery, thumbnails and zoom; persistent bag with AUD totals and quantities; FAQ; empty customer-review section; consent-based newsletter form; page metadata and favicon. No testimonials or certifications are invented.

## Shopify connection

Configure `dist/config.js` with your shopDomain (`*.myshopify.com`), PUBLIC storefrontToken, ProductVariant GID in variantId, and the supported Storefront apiVersion. Never put Shopify Admin credentials or private tokens in frontend files. Product listing read access is required. Keep salesEnabled false until the launch checklist is complete.

`dist/commerce.js` reads the variant in Australian market context, including current AUD price, availability and quantity rules. When salesEnabled is true, product prices replace the $50 placeholder. Unavailable or unconfirmed variants cannot be added. The adapter supports one standard, single-purchase variant; subscriptions and component bundles are deliberately blocked.

Checkout rechecks availability and current price, then creates a Shopify cart and reads its actual subtotal. The visitor reviews that total before a second click follows the returned Shopify checkout URL. Adjusted quantities, wrong merchandise, foreign currency and unapproved checkout hosts are rejected. Bag changes invalidate the quote. Shopify remains authoritative for final inventory, discounts, shipping, taxes and payment.

If your Shopify checkout uses a custom domain, explicitly add its hostname to checkoutHostnames after verifying it belongs to your Shopify store. The *.myshopify.com shop hostname is allowed by default. URLs must use HTTPS. The bag remains on the device after checkout because there is no order-confirmation integration to safely clear it.

Official references: https://shopify.dev/docs/api/storefront/latest/queries/node , https://shopify.dev/docs/api/storefront/latest/objects/ProductVariant , https://shopify.dev/docs/api/storefront/latest/mutations/cartCreate .

## Email subscriptions

Set subscriptionEndpoint to your HTTPS backend. The form requires an email and checked consent; no data is sent while the endpoint is absent. The endpoint receives `{email, consent: true, source: 'velluti-storefront'}` and must implement validation, origin checks, rate limits, double opt-in, consent records, unsubscribe and the applicable privacy requirements. API keys belong on that backend, never in this public file. Test the provider's response contract before launch.

## Before live sales

- Supply approved product name, INCI ingredient list, net contents, usage and safety directions, verified performance and manufacturing origin. Botanical images do not imply ingredients. Current formula descriptions are development goals.
- Approve final packaging and real product photography. All images are concept art; see ASSETS.md.
- Configure Shopify product publication, price, inventory, AUD market, payment provider, tax, shipping regions/rates and fulfilment.
- Verify CORS/public-token permissions and run real-store tests: successful and declined test payments, inventory changes, price changes, quantities, discounts, shipping, taxes, cancellations and refunds. Mock tests are not a substitute.
- Publish approved privacy, terms, shipping and return policies plus business/contact details. The current dialogs are development notices, not final legal documents. Review preview labels/copy before enabling sales.
- Connect and test the email backend, consent, double opt-in and unsubscribe.
- Integrate genuine customer reviews with an appropriate moderation/provider flow. Current reviews are explicitly empty, with no review submission backend.
- Set production domain/metadata, sitemap and truthful product structured data. Keep `noindex` and the robots disallow in place until public launch is approved. Never publish fake ratings or availability.
- Complete physical-device, screen-reader, contrast and Lighthouse/Core Web Vitals audits. Images have dimensions, WebP variants and below-fold lazy loading. Google Fonts has system fallbacks; decide whether to self-host approved fonts.
- Configure hosting security headers, monitoring and operational support. For a custom static host, the document root is `dist/`. The `.openai/hosting.json` retains the existing private Sites deployment identity.

See QA.md for verification actually performed and remaining limits. Reference inspiration: https://freshsupps.com ; Velluti design and copy are original.
