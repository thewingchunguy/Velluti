'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const config = window.VELLUTI_CONFIG || {};
  const catalog = window.VellutiCatalog;
  const money = value => new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value / 100);
  const storageKey = 'velluti-bag-v2';
  const selected = catalog.byId(new URLSearchParams(window.location.search).get('product')) || catalog.products[0];
  let bag = {};
  const bundle = new Set();
  try {
    const stored = localStorage.getItem(storageKey);
    bag = stored === null ? catalog.migrate(localStorage.getItem('velluti-bag')) : catalog.normalize(JSON.parse(stored));
  } catch {}
  function text(selector, value) { $$(selector).forEach(el => { el.textContent = value; }); }
  function message(value) { text('#checkout-status', value); }
  function save() { try { localStorage.setItem(storageKey, JSON.stringify(bag)); } catch {} }
  function close(id) { document.getElementById(id)?.close(); }
  function open(id) { const el = document.getElementById(id); if (el && !el.open) el.showModal(); }
  function render() {
    const totals = catalog.totals(bag);
    text('#cart-count, #drawer-count', totals.count);
    text('#subtotal', `${money(totals.subtotalCents)} AUD`);
    if ($('#cart-summary')) $('#cart-summary').hidden = !totals.count;
    const content = $('#cart-content');
    if (content) content.innerHTML = totals.count ? catalog.lines(bag).map(p => `
      <div class="cart-line"><a href="product.html?product=${p.id}" class="cart-thumb" aria-label="View ${p.name}"><img src="${p.image}" alt="${p.name} placeholder packaging" width="100" height="120"></a>
      <div><h3>${p.name}</h3><p>${money(p.unitCents)} AUD · Placeholder</p>
      <div class="quantity"><button data-change="-1" data-product="${p.id}" aria-label="Decrease ${p.name} quantity">−</button><span>${p.quantity}</span><button data-change="1" data-product="${p.id}" aria-label="Increase ${p.name} quantity" ${p.quantity >= 99 ? 'disabled' : ''}>+</button></div>
      <button class="remove" data-remove="${p.id}" aria-label="Remove ${p.name}">Remove</button><p class="line-total">${money(p.lineCents)} AUD</p></div></div>`).join('') : '<div class="empty-bag"><span aria-hidden="true">V</span><h3>A little room for a ritual.</h3><p>Your bag is currently empty.</p><a href="collection.html" class="button dark">Explore the collection ↗</a></div>';
    if ($('#checkout')) { $('#checkout').disabled = !totals.count; $('#checkout').textContent = 'Preview checkout ↗'; }
    save();
  }
  function addProduct(id, quantity = 1) {
    if (!catalog.byId(id)) return;
    const previous = bag[id] || 0;
    bag = catalog.add(bag, id, quantity); render();
    message(previous === 99 ? 'This placeholder has reached the 99-item limit.' : 'Added to your bag. All products are placeholders.');
    open('cart');
  }
  if ($('#gallery')) {
    text('[data-product-name]', selected.name);
    text('[data-product-description]', selected.description);
    text('[data-product-subtitle]', selected.subtitle);
    text('[data-product-number]', `THE COLLECTION · CONCEPT ${selected.number}`);
    text('[data-current-product]', selected.name);
    text('[data-price]', money(selected.unitCents));
    document.title = selected.name + ' — Velluti';
    const description = $('meta[name="description"]');
    if (description) description.content = selected.name + '. Explore this Velluti placeholder product, AUD $50.';
    const ogTitle = $('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = document.title;
    const canonical = $('link[rel="canonical"]');
    if (canonical) canonical.href = 'https://velluti-grooming-atelier.brawnybay19.chatgpt.site/product.html?product=' + selected.id;
    $$('.product-copy [data-add]').forEach(button => { button.dataset.product = selected.id; });
    $$('[data-related-product]').forEach(card => { card.hidden = card.dataset.relatedProduct === selected.id; });
  }
  $$('[data-add]').forEach(button => {
    const product = catalog.byId(button.dataset.product) || selected;
    button.dataset.product = product.id;
    button.textContent = `Add to bag — ${money(product.unitCents)} ＋`;
  });
  function renderBundle() {
    const items = catalog.products.filter(p => bundle.has(p.id));
    const total = items.reduce((sum, p) => sum + p.unitCents, 0);
    text('[data-bundle-total]', `${money(total)} AUD`);
    text('[data-bundle-status]', items.length ? `${items.length} ${items.length === 1 ? 'product' : 'products'} selected · No bundle discount` : 'Select your placeholder products to create a ritual.');
    $$('[data-bundle-choice]').forEach(button => button.setAttribute('aria-pressed', String(bundle.has(button.dataset.bundleChoice))));
    $$('[data-add-bundle]').forEach(button => { button.disabled = !items.length; button.textContent = items.length ? `Add ${items.length} to bag — ${money(total)} ＋` : 'Choose your products'; });
  }
  document.addEventListener('click', event => {
    const target = event.target;
    if (target.closest('[data-cart]')) { render(); message('All four products are placeholders. You can try the bag; orders are not open.'); open('cart'); }
    const add = target.closest('[data-add]');
    if (add) addProduct(add.dataset.product, add.closest('.product-copy') && $('#product-quantity') ? Number($('#product-quantity').textContent) : 1);
    const change = target.closest('[data-change]');
    if (change) { bag = catalog.set(bag, change.dataset.product, (bag[change.dataset.product] || 0) + Number(change.dataset.change)); render(); message('Bag updated.'); }
    const remove = target.closest('[data-remove]');
    if (remove) { bag = catalog.set(bag, remove.dataset.remove, 0); render(); message('Product removed.'); }
    const pq = target.closest('[data-pq]');
    if (pq) { const el = $('#product-quantity'); el.textContent = Math.max(1, catalog.clamp(Number(el.textContent) + Number(pq.dataset.pq))); }
    const choice = target.closest('[data-bundle-choice]');
    if (choice) { const id = choice.dataset.bundleChoice; bundle.has(id) ? bundle.delete(id) : bundle.add(id); renderBundle(); }
    if (target.closest('[data-add-bundle]') && bundle.size) {
      for (const id of bundle) bag = catalog.add(bag, id);
      render(); message('Your selected placeholder products are in the bag.'); open('cart');
    }
    const closer = target.closest('[data-close]');
    if (closer) close(closer.dataset.close);
    if (target.closest('[data-continue]')) close('cart');
    if (target.closest('[data-menu]')) open('menu');
    if (target.closest('#menu a')) close('menu');
    const policy = target.closest('[data-policy]');
    if (policy) {
      text('#info-title', policy.dataset.policy);
      text('#info-copy', policy.dataset.policy === 'Shipping & returns' ? 'This is a storefront concept. All four products are placeholders, and no orders are accepted. Shipping regions, rates and returns will be confirmed when the real products are ready.' : 'This storefront is in development. The final ' + policy.dataset.policy.toLowerCase() + ' policy and business details will be published before launch. This preview saves your bag on your device. Google Fonts may load typefaces from Google. No payment details are collected.');
      open('info');
    }
    const filter = target.closest('[data-category]');
    if (filter) {
      $$('[data-category]').forEach(button => button.setAttribute('aria-pressed', String(button === filter)));
      $$('.shop-grid .range-card').forEach(card => { card.hidden = filter.dataset.category !== 'all' && card.dataset.categoryName !== filter.dataset.category; });
      const visible = $$('.shop-grid .range-card').filter(card => !card.hidden).length;
      text('#collection-count', `${visible} placeholder ${visible === 1 ? 'product' : 'products'}`);
    }
  });
  $('#sort-products')?.addEventListener('change', event => {
    const grid = $('.shop-grid'); const cards = [...grid.children];
    cards.sort((a,b) => event.target.value === 'name' ? a.dataset.name.localeCompare(b.dataset.name) : a.dataset.number.localeCompare(b.dataset.number));
    cards.forEach(card => grid.appendChild(card));
  });
  $$('dialog').forEach(dialog => dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  }));
  $('#checkout')?.addEventListener('click', () => message('Checkout is not enabled for placeholder products. Your bag is saved on this device.'));
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
      { src: selected.image, alt: selected.name + ' placeholder packaging', caption: '01 / THE ESSENTIAL — PLACEHOLDER PACKAGING' },
      { src: 'assets/campaign.webp', alt: 'Illustrative styling crème jar in a sunlit Italian courtyard', caption: '02 / THE CAMPAIGN — ITALIAN INSPIRATION' },
      { src: 'assets/garden.webp', alt: 'Watercolour arches, lemon trees and a fountain', caption: '03 / THE INSPIRATION — OUR VISUAL WORLD' }
    ];
    const firstThumb = gallery.querySelector('[data-slide="0"] img');
    if (firstThumb) firstThumb.src = selected.image;
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
    if (event.key !== storageKey) return;
    try { bag = catalog.normalize(JSON.parse(event.newValue)); } catch { bag = {}; }
    render(); message('Your bag was updated in another tab.');
  });
  render(); renderBundle();
})();
