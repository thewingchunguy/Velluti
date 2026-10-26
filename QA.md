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
