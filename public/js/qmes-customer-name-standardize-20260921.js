/* QMES customer-name standardizer - 2026-09-21
 * Additive patch only. Existing sales modules remain unchanged.
 * Standard customer label: "(주) 현대자동차"
 */
(function(){
  "use strict";
  if(window.__QMES_CUSTOMER_NAME_STANDARDIZE_20260921__) return;
  window.__QMES_CUSTOMER_NAME_STANDARDIZE_20260921__=true;

  const STANDARD="(주) 현대자동차";
  const SALES_KEY="qmes-erp-sales-v1";
  const META_KEY="qmes-sales-order-meta-v1";
  const PLAN_KEY="qmes-erp-plan-v1";

  function clean(v){
    return String(v==null?"":v).replace(/\s+/g," ").trim();
  }

  function normalize(name){
    const raw=clean(name);
    const compact=raw.replace(/\s+/g,"").replace(/^주식회사/,"(주)");
    if(compact==="현대자동차" || compact==="(주)현대자동차") return STANDARD;
    return raw;
  }

  window.qmesNormalizeCustomerName20260921=normalize;

  function read(key,fallback){
    try{
      const value=JSON.parse(localStorage.getItem(key)||"null");
      return value==null?fallback:value;
    }catch(_){
      return fallback;
    }
  }

  function normalizeStorage(){
    let changed=false;

    const sales=read(SALES_KEY,[]);
    if(Array.isArray(sales)){
      sales.forEach(row=>{
        if(!row || typeof row!=="object") return;
        const next=normalize(row.customer);
        if(row.customer!==next){
          row.customer=next;
          changed=true;
        }
        if(row.orderMeta && typeof row.orderMeta==="object"){
          const metaNext=normalize(row.orderMeta.customerOverride);
          if(row.orderMeta.customerOverride!==metaNext){
            row.orderMeta.customerOverride=metaNext;
            changed=true;
          }
        }
      });
      if(changed) localStorage.setItem(SALES_KEY,JSON.stringify(sales));
    }

    let metaChanged=false;
    const meta=read(META_KEY,{});
    if(meta && typeof meta==="object" && !Array.isArray(meta)){
      Object.keys(meta).forEach(key=>{
        const item=meta[key];
        if(!item || typeof item!=="object") return;
        const next=normalize(item.customerOverride);
        if(item.customerOverride!==next){
          item.customerOverride=next;
          metaChanged=true;
        }
      });
      if(metaChanged) localStorage.setItem(META_KEY,JSON.stringify(meta));
    }

    let planChanged=false;
    const plans=read(PLAN_KEY,[]);
    if(Array.isArray(plans)){
      plans.forEach(row=>{
        if(!row || typeof row!=="object") return;
        const next=normalize(row.customer);
        if(row.customer!==next){
          row.customer=next;
          planChanged=true;
        }
      });
      if(planChanged) localStorage.setItem(PLAN_KEY,JSON.stringify(plans));
    }

    return changed || metaChanged || planChanged;
  }

  function normalizeTextNode(node){
    if(!node || node.nodeType!==Node.TEXT_NODE) return;
    const original=String(node.nodeValue||"");
    const trimmed=clean(original);
    const next=normalize(trimmed);
    if(!trimmed || next===trimmed) return;

    const lead=(original.match(/^\s*/)||[""])[0];
    const tail=(original.match(/\s*$/)||[""])[0];
    node.nodeValue=lead+next+tail;
  }

  function normalizeDom(root){
    const base=root && root.nodeType===Node.ELEMENT_NODE ? root : document.body;
    if(!base) return;

    if(base.nodeType===Node.ELEMENT_NODE){
      const own=[...base.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE);
      own.forEach(normalizeTextNode);
    }

    const walker=document.createTreeWalker(base,NodeFilter.SHOW_TEXT,{
      acceptNode(node){
        const parent=node.parentElement;
        if(!parent) return NodeFilter.FILTER_REJECT;
        if(/^(SCRIPT|STYLE|TEXTAREA|INPUT|OPTION)$/i.test(parent.tagName)) return NodeFilter.FILTER_REJECT;
        const value=clean(node.nodeValue);
        return value && normalize(value)!==value ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });

    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(normalizeTextNode);
  }

  let queued=false;
  function apply(){
    if(queued) return;
    queued=true;
    queueMicrotask(()=>{
      queued=false;
      normalizeStorage();
      normalizeDom(document.body);
    });
  }

  function boot(){
    apply();

    const observer=new MutationObserver(mutations=>{
      mutations.forEach(mutation=>{
        mutation.addedNodes.forEach(node=>{
          if(node.nodeType===Node.TEXT_NODE) normalizeTextNode(node);
          else if(node.nodeType===Node.ELEMENT_NODE) normalizeDom(node);
        });
      });
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});

    window.addEventListener("qmes:erp-data-changed",apply);
    window.addEventListener("qmes:data-updated",apply);
    window.addEventListener("storage",event=>{
      if([SALES_KEY,META_KEY,PLAN_KEY].includes(event.key)) apply();
    });

    [300,1000,2500,5000].forEach(ms=>setTimeout(apply,ms));
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true});
  else boot();
})();