'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const config = window.VELLUTI_CONFIG || {};
  const commerce = window.VellutiCommerce;
  const client = commerce.createClient(config);
  const money = value => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value / 100);
  let count = 0, busy = false, quote = null, product = { title: 'The Styling Crème', unitCents: 5000, available: true };
  let productState = config.salesEnabled ? 'loading' : 'preview';
  try { count = commerce.quantity(localStorage.getItem('velluti-bag')); } catch {}
  function text(selector, value) { $$(selector).forEach(el => { el.textContent = value; }); }
  function invalidate() { quote = null; }
  function message(value) { text('#checkout-status', value); }
  function save() { try { localStorage.setItem('velluti-bag', String(count)); } catch {} }
  function close(id) { document.getElementById(id)?.close(); }
  function open(id) { const el = document.getElementById(id); if (el && !el.open) el.showModal(); }
  function render() {
    text('#cart-count, #drawer-count', count);
    text('[data-product-name]', product.title);
    text('[data-price]', money(product.unitCents));
    $$('#cart-content').forEach(el => {
      el.innerHTML = count ? `<div class="cart-line"><a href="product.html" class="cart-thumb" aria-label="View styling crème"><img src="assets/packshot.webp" alt="Velluti illustrative packaging" width="100" height="120"></a><div><h3 id="bag-name"></h3><p id="bag-price"></p><div class="quantity"><button data-change="-1" aria-label="Decrease bag quantity">−</button><span>${count}</span><button data-change="1" aria-label="Increase bag quantity" ${count >= 99 ? 'disabled' : ''}>+</button></div><button class="remove" data-remove>Remove</button></div></div>` : '<div class="empty-bag"><span aria-hidden="true">V</span><h3>A little room for a ritual.</h3><p>Your bag is currently empty.</p><a href="product.html" class="button dark">Discover the essential ↗</a></div>';
    });
    text('#bag-name', product.title);
    text('#bag-price', `${money(product.unitCents)} AUD${productState === 'preview' ? ' · Concept product' : ''}`);
    text('#subtotal', `${money(quote?.subtotalCents ?? count * product.unitCents)} AUD`);
    if ($('#cart-summary')) $('#cart-summary').hidden = !count;
    const blocked = config.salesEnabled && (productState !== 'ready' || !product.available);
    $$('[data-add]').forEach(button => {
      button.disabled = busy || blocked;
      button.textContent = blocked ? productState === 'error' ? 'Temporarily unavailable' : productState === 'loading' ? 'Checking availability…' : 'Sold out' : `Add to bag — ${money(product.unitCents)} ＋`;
    });
    text('[data-availability]', productState === 'preview' ? 'Concept preview · Orders are not open yet' : productState === 'error' ? 'Availability could not be confirmed. Please refresh to try again.' : productState === 'loading' ? 'Checking product availability…' : product.available ? 'Available from the Velluti store' : 'Currently sold out');
    const button = $('#checkout');
    if (button) {
      button.disabled = busy || !count;
      button.textContent = busy ? 'Confirming your bag…' : quote ? 'Continue to Shopify ↗' : config.salesEnabled ? 'Review secure checkout ↗' : 'Preview checkout ↗';
    }
    $$('#cart-content button, [data-pq]').forEach(el => { el.disabled = busy || (el.dataset.change === '1' && count >= 99); });
    save();
  }
  async function loadProduct() {
    if (!config.salesEnabled) return;
    try { product = await client.loadProduct(); productState = 'ready'; }
    catch { productState = 'error'; }
    render();
  }
  document.addEventListener('click', event => {
    const target = event.target;
    if (target.closest('[data-cart]')) { render(); message(config.salesEnabled ? 'Your bag will be checked against current store pricing and availability.' : 'Development preview. Checkout opens after store configuration and testing.'); open('cart'); }
    if (target.closest('[data-add]') && !busy && (!config.salesEnabled || (productState === 'ready' && product.available))) {
      const selected = commerce.quantity($('#product-quantity')?.textContent || 1);
      count = Math.min(99, count + selected); invalidate(); render(); message('Added to your bag.'); open('cart');
    }
    const change = target.closest('[data-change]');
    if (change && !busy) { count = commerce.quantity(count + Number(change.dataset.change)); invalidate(); render(); message('Bag updated.'); }
    if (target.closest('[data-remove]') && !busy) { count = 0; invalidate(); render(); }
    const pq = target.closest('[data-pq]');
    if (pq && !busy) { const el = $('#product-quantity'); el.textContent = Math.max(1, commerce.quantity(Number(el.textContent) + Number(pq.dataset.pq))); }
    const closer = target.closest('[data-close]');
    if (closer) close(closer.dataset.close);
    if (target.closest('[data-continue]')) close('cart');
    if (target.closest('[data-menu]')) open('menu');
    if (target.closest('#menu a')) close('menu');
    const policy = target.closest('[data-policy]');
    if (policy) {
      text('#info-title', policy.dataset.policy);
      text('#info-copy', policy.dataset.policy === 'Shipping & returns' ? 'Shipping regions, rates and return conditions are being finalised. Orders are not currently accepted. Confirmed policies will be published before sales begin.' : 'This store is in development. The final ' + policy.dataset.policy.toLowerCase() + ' policy and business contact details must be approved before launch. This preview stores bag quantity on your device. Google Fonts may load typefaces from Google. No payment details are collected by this storefront.');
      open('info');
    }
  });
  $$('dialog').forEach(dialog => dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  }));
  $('#checkout')?.addEventListener('click', async () => {
    if (busy || !count) return;
    if (!config.salesEnabled) { message('Checkout is not yet available. Your bag is saved on this device.'); return; }
    if (quote && quote.quantity === count) { window.location.assign(quote.checkoutUrl); return; }
    const requestedCount = count;
    busy = true; render(); message('Confirming current pricing and availability with Shopify…');
    try {
      const confirmed = await client.prepareCheckout(requestedCount);
      if (count !== requestedCount) throw new commerce.CommerceError('Your bag changed in another tab. Review it and try again.', 'CHANGED');
      quote = confirmed;
      product = { ...product, title: quote.title, unitCents: quote.unitCents };
      message(`Shopify confirmed ${quote.quantity} ${quote.quantity === 1 ? 'item' : 'items'} · ${money(quote.subtotalCents)} AUD subtotal. ${quote.warnings.length ? 'The store reported an update; review all details at checkout. ' : ''}Shipping and taxes are calculated at Shopify checkout. Review this total, then continue.`);
    } catch (error) { invalidate(); message(error instanceof commerce.CommerceError ? error.message : 'We could not connect to the store. Your bag is saved; please try again.'); }
    finally { busy = false; render(); }
  });
  $('#subscribe')?.addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.target;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const button = form.querySelector('button');
    if (button.disabled) return;
    if (!config.subscriptionEndpoint) { text('#subscribe-status', 'Our mailing list is not open yet. Your email has not been submitted.'); return; }
    button.disabled = true; text('#subscribe-status', 'Submitting…');
    try {
      const endpoint = new URL(config.subscriptionEndpoint);
      if (endpoint.protocol !== 'https:') throw Error('Invalid subscription endpoint');
      const response = await fetch(endpoint.href, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: $('#email').value.trim(), consent: true, source: 'velluti-storefront' }), signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw Error('Subscription unavailable');
      text('#subscribe-status', 'Thank you. Please check your inbox for the next step.'); form.reset();
    } catch { text('#subscribe-status', 'Unable to subscribe right now. Please try again later.'); }
    finally { button.disabled = false; }
  });
  const gallery = $('#gallery');
  if (gallery) {
    const slides = [
      { src: 'assets/packshot.webp', alt: 'Velluti styling crème packaging concept on warm travertine', caption: '01 / THE ESSENTIAL — PACKAGING CONCEPT' },
      { src: 'assets/campaign.webp', alt: 'Illustrative styling crème jar in a sunlit Italian courtyard', caption: '02 / THE CAMPAIGN — ITALIAN INSPIRATION' },
      { src: 'assets/garden.webp', alt: 'Watercolour arches, lemon trees and a fountain', caption: '03 / THE INSPIRATION — OUR VISUAL WORLD' }
    ];
    let active = 0;
    function show(index) {
      active = (index + slides.length) % slides.length;
      const slide = slides[active];
      $('#gallery-image').src = slide.src; $('#gallery-image').alt = slide.alt;
      text('#gallery-caption', slide.caption); text('#gallery-position', `${active + 1} / ${slides.length}`);
      $$('[data-slide]').forEach((el, i) => el.setAttribute('aria-pressed', String(active === i)));
      $('#zoom-image').src = slide.src; $('#zoom-image').alt = slide.alt;
    }
    gallery.addEventListener('click', event => {
      const thumb = event.target.closest('[data-slide]');
      if (thumb) show(Number(thumb.dataset.slide));
      if (event.target.closest('[data-gallery-next]')) show(active + 1);
      if (event.target.closest('[data-gallery-prev]')) show(active - 1);
      if (event.target.closest('[data-zoom]')) open('zoom');
    });
    gallery.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); show(active + (event.key === 'ArrowRight' ? 1 : -1)); }
    });
    show(0);
  }
  function expandHash() {
    const id = window.location.hash.slice(1);
    if (id === 'reviews' && $('#reviews')) $('#reviews').open = true;
  }
  window.addEventListener('hashchange', expandHash); expandHash();
  window.addEventListener('storage', event => {
    if (event.key !== 'velluti-bag') return;
    count = commerce.quantity(event.newValue); invalidate(); render(); message('Your bag was updated in another tab.');
  });
  window.addEventListener('pageshow', event => { if (event.persisted) { invalidate(); loadProduct(); } });
  render(); loadProduct();
})();
