# Verification — 26 October 2026

Passed in the in-app browser:
- Homepage and product detail load with semantic headings and labelled controls.
- Add to bag opens the dialog; quantity increment recalculates $50 to $100 AUD; removal returns empty state.
- Bag persists after reload and between home and product pages.
- Product quantity 2 adds 2 to the bag.
- Gallery close-up selection updates its pressed state.
- Unconfigured checkout stays on site and explains checkout is unavailable.
- A consented sample email with no backend reports nothing was submitted; no external subscription request occurs.
- Desktop 1440px and mobile 390px layouts visually inspected through same-origin iframe previews. Native browser panel at 544px also inspected. Viewport QA, not physical-device testing.

Automated checks:
- Node syntax check.
- Mocked commerce tests: AUD total, disabled checkout, Shopify request payload and redirect, GraphQL user error, network failure, invalid domain and subscription guard.
- Relative links and referenced assets checked for existence.

Not verified: real Shopify connection, payments, shipping, tax, refunds, live subscriptions, reviews provider, physical devices, comprehensive screen-reader audit or Lighthouse. Follow the launch checklist in README.md. Preview stays noindex.

## Second development pass

20 Node tests pass against the shared commerce adapter (`node --test test-commerce.cjs`). Coverage includes current AUD pricing, variant identity, sold-out stock, quantity limits, subscriptions/bundles rejection, cart line/count reconciliation, foreign currencies, checkout host validation, API errors, network failures and preview guards. Tests use mocked Shopify responses; a real store has not been connected.

Browser checks pass for gallery next/previous/keyboard navigation, selected image zoom, 2-item/$100 bag, checkout preview guard, empty state after removal, mobile menu navigation into the journal, review deep-link expansion and the newsletter's unconfigured state. Gallery/commerce UI was checked at 320px, 390px, 768px and 1440px as relevant; document widths matched viewport widths on the checked pages. No physical-device or full accessibility/performance audit is claimed.

Static validation passed for relative files/links, anchor targets, unique IDs and one H1 on each of home, product and journal pages. Mobile and desktop compositions were visually reviewed. WebP imagery, intrinsic image dimensions, lazy loading below the fold and direct font stylesheet links are present.


## Four-placeholder collection pass

30 Node tests pass: the existing 20 commerce-adapter tests plus 10 catalog/bag tests. New coverage verifies four unique products at $50, distinct product lines, merged quantities, independent removal, per-product caps, invalid stored data, four-item/$200 totals, legacy migration and serialization.

Browser verified: adding two different products produces separate lines/$100; incrementing only the texture paste produces $150; removing only the styling crème leaves the texture paste and $100; reload preserves the result. Selecting all four ritual products shows $200 and adds all four correct lines. Placeholder checkout remains blocked. The Shaping Pomade URL loads the correct title/artwork and three related products. Collection category filtering shows two texture/shape products, reset shows four, and A–Z sorting changes card order correctly.

Desktop 1440px product lineup and mobile 390px collection were visually reviewed. All products/names/prices and packaging are labelled as placeholders. Real checkout remains disconnected for this four-product preview, as requested. The existing single-variant adapter is retained but is not the four-product storefront's checkout implementation.
