# Velluti — HTML storefront

Italian-inspired men's grooming. Plain HTML, CSS and JavaScript with no build step or application dependencies.

## Run and test

```sh
python3 -m http.server 4173 --directory dist
node --test test-commerce.cjs test-catalog.cjs
```

Open http://localhost:4173 . Use a modern browser and Node 20+ for the test suite. `index.html`, `collection.html`, `product.html?product=styling-creme` and `journal.html` are the entry pages. Serve only `dist/` to keep development files outside the document root.

## Current status

Private development preview: https://velluti-grooming-atelier.brawnybay19.chatgpt.site . GitHub: https://github.com/thewingchunguy/Velluti . Products and prices remain concepts; live orders are disabled.

The supplied screenshot informed the direction. The initial workspace was empty, so no prototype source was replaced. The first implementation and subsequent improvements are preserved in Git history.

Built: a product-first homepage with four placeholder cards and quick add; a dedicated filtered/sorted collection page; individual product detail states; a persistent mixed-product bag; a build-your-ritual selector; mobile navigation; keyboard gallery and zoom; editorial journal; brand storytelling, FAQs and newsletter form. All four products are AUD $50. No invented discounts, customer reviews, ingredients or certifications.

## Replace the four placeholders

`dist/catalog.js` is the editable source for product IDs, names, category, price, imagery and placeholder descriptions. Current concepts: The Styling Crème, The Texture Paste, The Shaping Pomade and The Finishing Crème. They are website placeholders, not verified products or performance claims.

Each product uses `product.html?product=<id>`. The same catalog powers the bag and ritual builder. The builder adds one of each selected product at its normal placeholder price, with no discount. The bag is saved as a product/quantity map under `velluti-bag-v2`; old single-product bag quantities migrate to The Styling Crème.

The four original SVG packaging studies are editable assets in `dist/assets/product-01.svg` through `product-04.svg`. Final names, imagery and product information can be replaced without changing the layout. The placeholder catalog deliberately keeps checkout unavailable even if a production configuration flag is changed.

## Future Shopify connection

The previously developed single-variant Shopify adapter remains preserved in `dist/commerce.js` with its 20 tests. It reads current AUD variant pricing/availability and reconciles a single-product cart before following a validated checkout URL. It is **not wired to the new four-placeholder bag**. Before enabling live sales, implement and test a multi-variant catalog/cart connection using the final Shopify products. Do not turn on sales for these placeholders.

`dist/config.js` preserves the future Shopify configuration fields and current subscription endpoint setting. Only PUBLIC Storefront credentials may ever be placed in browser code. Never expose Shopify Admin or private Storefront tokens. Official API references: https://shopify.dev/docs/api/storefront/latest/queries/node , https://shopify.dev/docs/api/storefront/latest/objects/ProductVariant , https://shopify.dev/docs/api/storefront/latest/mutations/cartCreate .

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
