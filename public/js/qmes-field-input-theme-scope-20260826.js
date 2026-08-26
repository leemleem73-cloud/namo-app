/* QMES field-input theme scope guard — 2026-08-26
 * Root cause fix: enterprise/global theme rules were authored against every <main>
 * descendant and therefore overrode the established iPad field-input UI.
 * This script scopes those global MAIN-content rules away whenever .qmes-ipad-pop
 * is mounted. Header and sidebar rules remain untouched.
 *
 * No size overrides, no DOM mutation observer, no repeated element patching.
 */
(function(){
  'use strict';
  if(window.__QMES_FIELD_INPUT_THEME_SCOPE__) return;
  window.__QMES_FIELD_INPUT_THEME_SCOPE__=true;

  const TARGETS=[
    'qmes-global-light-theme-20260826.css',
    'qmes-enterprise-ui-20260826.css',
    'qmes-enterprise-readable-size-20260826.css',
    'qmes-modern-corporate-ui-20260826.css',
    'qmes-text-sharpness-20260826.css',
    'qmes-spc-readability-fix-20260826.css',
    'qmes-production-process-corporate-fix-20260826.css',
    'qmes-workorder-issued-clean-20260826.css'
  ];

  function isTarget(sheet){
    const href=String(sheet?.href||'');
    return TARGETS.some(name=>href.includes(name));
  }

  function scopeSelector(selector){
    if(!selector || !selector.includes('main')) return selector;
    if(selector.includes('body:not(:has(.qmes-ipad-pop))')) return selector;
    if(selector.includes('.qmes-ipad-pop')) return selector;

    return selector.split(',').map(part=>{
      const s=part.trim();
      if(!s.includes('main')) return s;
      if(/\bbody\b/.test(s)) return s.replace(/\bbody\b/,'body:not(:has(.qmes-ipad-pop))');
      return `body:not(:has(.qmes-ipad-pop)) ${s}`;
    }).join(', ');
  }

  function walkRules(rules){
    if(!rules) return;
    for(const rule of Array.from(rules)){
      if(rule?.selectorText){
        const next=scopeSelector(rule.selectorText);
        if(next!==rule.selectorText){
          try{rule.selectorText=next;}catch(_){/* invalid/locked rule: leave original */}
        }
      }
      if(rule?.cssRules) walkRules(rule.cssRules);
    }
  }

  function apply(){
    for(const sheet of Array.from(document.styleSheets)){
      if(!isTarget(sheet)) continue;
      try{walkRules(sheet.cssRules);}catch(_){/* stylesheet not ready yet */}
    }
  }

  apply();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply,{once:true});
  window.addEventListener('load',apply,{once:true});
  window.addEventListener('qmes:enterprise-ui-ready',apply);
  setTimeout(apply,120);
  setTimeout(apply,600);
})();
