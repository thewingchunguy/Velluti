/* Editable placeholder catalog and pure bag helpers. No real product claims. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.VellutiCatalog = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const products = [
    { id: 'styling-creme', number: '01', name: 'The Styling Crème', category: 'Everyday styling', label: 'STYLING CRÈME', tone: 'cream', subtitle: 'A little ritual. A signature feeling.', description: 'The first expression of the Velluti styling world. An everyday styling concept with a considered point of view.', image: 'assets/product-01.svg' },
    { id: 'texture-paste', number: '02', name: 'The Texture Paste', category: 'Texture & shape', label: 'TEXTURE PASTE', tone: 'olive', subtitle: 'A different kind of character.', description: 'A texture-focused concept for the collection. A place to explore your own style, without overthinking the ritual.', image: 'assets/product-02.svg' },
    { id: 'shaping-pomade', number: '03', name: 'The Shaping Pomade', category: 'Texture & shape', label: 'SHAPING POMADE', tone: 'espresso', subtitle: 'Make it your own.', description: 'A shaping concept with an appreciation for detail. The same Italian-inspired sensibility, another expression of personal style.', image: 'assets/product-03.svg' },
    { id: 'finishing-creme', number: '04', name: 'The Finishing Crème', category: 'The finishing touch', label: 'FINISHING CRÈME', tone: 'terracotta', subtitle: 'The final, considered detail.', description: 'A finishing concept to complete the imagined Velluti ritual. The last detail before you step into the day.', image: 'assets/product-04.svg' }
  ].map(p => Object.freeze({ ...p, unitCents: 5000, placeholder: true }));
  Object.freeze(products);
  const byId = id => products.find(p => p.id === id);
  function clamp(value) { const n = Number(value); return Number.isFinite(n) ? Math.min(99, Math.max(0, Math.trunc(n))) : 0; }
  function normalize(value) {
    const result = {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
    for (const p of products) { const n = clamp(value[p.id]); if (n) result[p.id] = n; }
    return result;
  }
  function set(bag, id, count) {
    const result = normalize(bag);
    if (!byId(id)) return result;
    const n = clamp(count);
    if (n) result[id] = n; else delete result[id];
    return result;
  }
  function add(bag, id, count = 1) { const clean = normalize(bag); return set(clean, id, (clean[id] || 0) + clamp(count)); }
  function lines(bag) { const clean = normalize(bag); return products.filter(p => clean[p.id]).map(p => ({ ...p, quantity: clean[p.id], lineCents: clean[p.id] * p.unitCents })); }
  function totals(bag) { return lines(bag).reduce((a,p) => ({ count: a.count + p.quantity, subtotalCents: a.subtotalCents + p.lineCents }), { count: 0, subtotalCents: 0 }); }
  function migrate(legacy) { const count = clamp(legacy); return count ? { 'styling-creme': count } : {}; }
  return { products, byId, clamp, normalize, set, add, lines, totals, migrate };
});
