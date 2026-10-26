const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
function boot(config={}, fetchImpl=async()=>{throw Error('Unexpected request')}) {
 const elements=new Map();const get=s=>{if(!elements.has(s))elements.set(s,{textContent:'',classList:{add(){},remove(){}},addEventListener(type,fn){this[type]=fn;},hidden:false,disabled:false});return elements.get(s);};
 const saved=new Map();const document={querySelector:get,querySelectorAll:()=>[],addEventListener(){}};
 const window={VELLUTI_CONFIG:config,addEventListener(){},location:{assign(url){window.redirect=url;}}};
 vm.runInNewContext(readFileSync(__dirname+'/dist/app.js','utf8'),{document,window,localStorage:{getItem:k=>saved.get(k)||'2',setItem:(k,v)=>saved.set(k,v)},Intl,URL,AbortSignal,setTimeout(){},fetch:fetchImpl});
 return {get,window};
}
(async()=>{
 let requested=false;let app=boot({},async()=>{requested=true;});await app.get('#checkout').click();assert.equal(requested,false);assert.match(app.get('#checkout-status').textContent,/not yet available/);
 assert.equal(app.get('#subtotal').textContent,'$100.00 AUD');
 const config={salesEnabled:true,shopDomain:'velluti-test.myshopify.com',storefrontToken:'public-test',variantId:'gid://shopify/ProductVariant/123',apiVersion:'2026-10'};
 app=boot(config,async(url,options)=>{assert.equal(url,'https://velluti-test.myshopify.com/api/2026-10/graphql.json');const input=JSON.parse(options.body).variables.input;assert.equal(input.lines[0].quantity,2);assert.equal(input.buyerIdentity.countryCode,'AU');return {ok:true,json:async()=>({data:{cartCreate:{cart:{checkoutUrl:'https://velluti-test.myshopify.com/checkouts/test'},userErrors:[]}}})};});await app.get('#checkout').click();assert.match(app.window.redirect,/https:\/\//);
 app=boot(config,async()=>({ok:true,json:async()=>({data:{cartCreate:{cart:null,userErrors:[{message:'Sold out'}]}}})}));await app.get('#checkout').click();assert.equal(app.window.redirect,undefined);assert.match(app.get('#checkout-status').textContent,/could not open/);assert.equal(app.get('#checkout').disabled,false);
 app=boot(config,async()=>{throw Error('network')});await app.get('#checkout').click();assert.match(app.get('#checkout-status').textContent,/bag is saved/);
 app=boot({...config,shopDomain:'example.com'});await app.get('#checkout').click();assert.match(app.get('#checkout-status').textContent,/configuration/);
 app=boot();await app.get('#subscribe').submit({preventDefault(){},target:{querySelector:()=>({})}});assert.match(app.get('#subscribe-status').textContent,/not been submitted/);
 console.log('PASS: AUD total, checkout guard, Shopify request and redirect, API error, network failure, invalid domain, subscription guard. Mocked integration only.');
})().catch(e=>{console.error(e);process.exitCode=1;});
