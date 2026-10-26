'use strict';
const $ = s => document.querySelector(s);
const config = window.VELLUTI_CONFIG || {};
let quantity = 0;
try { quantity = Math.min(99, Math.max(0, parseInt(localStorage.getItem('velluti-bag'),10)||0)); } catch {}
const money = n => new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(n);
function render(){
 $('#cart-count').textContent=quantity; $('#drawer-count').textContent=quantity;
 $('#cart-content').innerHTML=quantity ? `<div class="cart-line"><div class="cart-thumb" aria-hidden="true">V</div><div><h3>The Styling Crème</h3><p>${money(50)} AUD · Concept product</p><div class="quantity"><button data-change="-1" aria-label="Decrease bag quantity">−</button><span>${quantity}</span><button data-change="1" aria-label="Increase bag quantity" ${quantity===99?'disabled':''}>+</button></div><button class="remove" data-remove>Remove</button></div></div>` : '<h3>A little room for a ritual.</h3><p>Your bag is currently empty.</p>';
 $('#subtotal').textContent=money(quantity*50)+' AUD'; $('#cart-summary').hidden=!quantity;
 $('#checkout-status').textContent=config.salesEnabled?'':'Development preview. Checkout opens after store configuration and testing.';
 try{localStorage.setItem('velluti-bag',String(quantity));}catch{}
}
function openDialog(id){const el=document.getElementById(id);if(!el.open)el.showModal();}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),2500);}
document.addEventListener('click',e=>{
 const add=e.target.closest('[data-add]');if(add){const amount=Number($('#product-quantity')?.textContent||1);quantity=Math.min(99,quantity+amount);render();openDialog('cart');}
 if(e.target.closest('[data-cart]')){render();openDialog('cart');}
 const close=e.target.closest('[data-close]');if(close)document.getElementById(close.dataset.close).close();
 if(e.target.closest('[data-continue]'))$('#cart').close();
 const change=e.target.closest('[data-change]');if(change){quantity=Math.min(99,Math.max(0,quantity+Number(change.dataset.change)));render();}
 if(e.target.closest('[data-remove]')){quantity=0;render();}
 const pq=e.target.closest('[data-pq]');if(pq){const el=$('#product-quantity');el.textContent=Math.min(99,Math.max(1,Number(el.textContent)+Number(pq.dataset.pq)));}
 const gallery=e.target.closest('[data-view]');if(gallery){$('#product-stage').className='product-visual '+gallery.dataset.view;document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===gallery)));}
 if(e.target.closest('[data-zoom]'))openDialog('zoom');
 const policy=e.target.closest('[data-policy]');if(policy){$('#info-title').textContent=policy.dataset.policy;$('#info-copy').textContent=policy.dataset.policy==='Shipping & returns'?'Shipping rates, delivery regions and return conditions are being finalised. Orders are not currently accepted. Confirmed policies will be published before sales begin.':'This store is in development. The final '+policy.dataset.policy.toLowerCase()+' policy, business contact details and any applicable consent information must be approved and published before launch. This preview stores bag quantity on your device and does not collect payment details.';openDialog('info');}
});
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
$('#checkout').addEventListener('click',async()=>{
 const status=$('#checkout-status'),button=$('#checkout');
 if(!config.salesEnabled||!config.shopDomain||!config.storefrontToken||!config.variantId){status.textContent='Checkout is not yet available. Your bag is saved on this device.';return;}
 if(!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(config.shopDomain)||!/^gid:\/\/shopify\/ProductVariant\/\d+$/.test(config.variantId)){status.textContent='Store configuration needs attention. Please try again later.';return;}
 button.disabled=true;status.textContent='Preparing your secure checkout…';
 try{
 const response=await fetch(`https://${config.shopDomain}/api/${config.apiVersion}/graphql.json`,{method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Storefront-Access-Token':config.storefrontToken},body:JSON.stringify({query:'mutation CreateCart($input: CartInput!){cartCreate(input:$input){cart{checkoutUrl} userErrors{message}}}',variables:{input:{buyerIdentity:{countryCode:'AU'},lines:[{merchandiseId:config.variantId,quantity}]}}}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('Checkout request failed');const result=await response.json();const payload=result.data?.cartCreate;
 if(result.errors?.length||payload?.userErrors?.length||!payload?.cart?.checkoutUrl)throw Error('Checkout unavailable');
 const url=new URL(payload.cart.checkoutUrl);if(url.protocol!=='https:')throw Error('Invalid checkout');window.location.assign(url.href);
 }catch{status.textContent='We could not open checkout. Your bag is saved; please try again.';}finally{button.disabled=false;}
});
$('#subscribe').addEventListener('submit',async e=>{e.preventDefault();const status=$('#subscribe-status'),button=e.target.querySelector('button');if(!config.subscriptionEndpoint){status.textContent='Our mailing list is not open yet. Your email has not been submitted.';return;}button.disabled=true;status.textContent='Submitting…';try{const url=new URL(config.subscriptionEndpoint);if(url.protocol!=='https:')throw Error();const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:$('#email').value,consent:true,source:'velluti-storefront'}),signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error();status.textContent='Thank you. Please check your inbox for the next step.';e.target.reset();}catch{status.textContent='Unable to subscribe right now. Please try again later.';}finally{button.disabled=false;}});
window.addEventListener('storage',e=>{if(e.key==='velluti-bag'){quantity=Math.min(99,Math.max(0,parseInt(e.newValue,10)||0));render();}});
render();
