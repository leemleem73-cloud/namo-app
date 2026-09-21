'use strict';

const fs = require('fs');
const path = require('path');
const Babel = require('@babel/standalone');

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const SOURCE_HTML = path.join(PUBLIC, 'index.html');
const OUTPUT_ROOT = path.join(PUBLIC, 'pad-compat');
const OUTPUT_JS = path.join(OUTPUT_ROOT, 'js');
const OUTPUT_HTML = path.join(PUBLIC, 'pad-pc.html');

const BUILD_VERSION = '20260921-pc-parity1';
const TARGETS = {
  chrome: '55',
  safari: '11',
  ios: '11'
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function walk(dir, out) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function transpile(source, filename) {
  const result = Babel.transform(String(source || ''), {
    filename,
    sourceType: 'unambiguous',
    presets: [
      ['env', {
        targets: TARGETS,
        modules: false,
        bugfixes: true
      }],
      ['react', { runtime: 'classic' }]
    ],
    comments: true,
    compact: false,
    retainLines: false
  });
  return result && result.code ? result.code : String(source || '');
}

function writePolyfills() {
  const polyfills = `(function(g){
"use strict";
if(!g.globalThis)g.globalThis=g;
if(!Object.fromEntries){Object.fromEntries=function(iter){var o={},i;if(iter&&typeof iter[Symbol.iterator]==="function"){var it=iter[Symbol.iterator](),n;while(!(n=it.next()).done){o[n.value[0]]=n.value[1];}}else if(iter&&iter.length!=null){for(i=0;i<iter.length;i++)o[iter[i][0]]=iter[i][1];}return o;};}
if(!Object.hasOwn){Object.hasOwn=function(o,p){return Object.prototype.hasOwnProperty.call(o,p);};}
if(!Array.prototype.flat){Array.prototype.flat=function(depth){depth=depth===undefined?1:Number(depth)||0;var out=[];function f(a,d){for(var i=0;i<a.length;i++){var v=a[i];if(Array.isArray(v)&&d>0)f(v,d-1);else out.push(v);}}f(this,depth);return out;};}
if(!Array.prototype.flatMap){Array.prototype.flatMap=function(fn,ctx){return this.map(fn,ctx).flat();};}
if(!Array.prototype.at){Array.prototype.at=function(i){i=Number(i)||0;if(i<0)i=this.length+i;return this[i];};}
if(!String.prototype.replaceAll){String.prototype.replaceAll=function(search,repl){var s=String(this);if(search instanceof RegExp){if(!search.global)throw new TypeError("replaceAll requires global RegExp");return s.replace(search,repl);}return s.split(String(search)).join(repl);};}
if(!Promise.allSettled){Promise.allSettled=function(items){return Promise.all(Array.prototype.map.call(items,function(p){return Promise.resolve(p).then(function(value){return{status:"fulfilled",value:value};},function(reason){return{status:"rejected",reason:reason};});}));};}
if(!g.queueMicrotask){g.queueMicrotask=function(cb){Promise.resolve().then(cb).catch(function(e){setTimeout(function(){throw e;},0);});};}
if(!g.structuredClone){g.structuredClone=function(value){if(value===undefined)return undefined;return JSON.parse(JSON.stringify(value));};}
if(!g.requestIdleCallback){g.requestIdleCallback=function(cb){return setTimeout(function(){cb({didTimeout:false,timeRemaining:function(){return 0;}});},1);};g.cancelIdleCallback=function(id){clearTimeout(id);};}
})(typeof window!=="undefined"?window:this);`;
  fs.writeFileSync(path.join(OUTPUT_ROOT, 'polyfills.js'), polyfills, 'utf8');
}

function transpileScripts() {
  const sourceRoot = path.join(PUBLIC, 'js');
  const files = walk(sourceRoot, []).filter(file => /\.(?:js|jsx)$/i.test(file));
  const failures = [];

  for (const file of files) {
    const relative = path.relative(sourceRoot, file);
    const outFile = path.join(OUTPUT_JS, relative).replace(/\.jsx$/i, '.js');
    ensureDir(path.dirname(outFile));
    try {
      const source = fs.readFileSync(file, 'utf8');
      fs.writeFileSync(outFile, transpile(source, relative), 'utf8');
    } catch (error) {
      failures.push({ relative, error: error && error.message ? error.message : String(error) });
      fs.copyFileSync(file, outFile);
    }
  }

  return { count: files.length, failures };
}

function cleanScriptAttributes(attributes) {
  return String(attributes || '')
    .replace(/\s+type=(["'])text\/babel\1/gi, '')
    .replace(/\s+data-presets=(["'])[^"']*\1/gi, '');
}

function rewriteHtml() {
  let html = fs.readFileSync(SOURCE_HTML, 'utf8');

  html = html.replace(
    /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi,
    function(match, attrs, code) {
      if (!String(code || '').trim()) return match;
      if (/type=(["'])(?:application\/json|application\/ld\+json|text\/template)\1/i.test(attrs || '')) return match;
      try {
        const next = transpile(code, 'index-inline.js');
        return '<script' + cleanScriptAttributes(attrs) + '>\n' + next + '\n</script>';
      } catch (error) {
        return match;
      }
    }
  );

  html = html.replace(
    /<script([^>]*?)\ssrc=(["'])((?:\.\/|\/)?js\/[^"']+)\2([^>]*)><\/script>/gi,
    function(match, before, quote, src, after) {
      const parts = src.split('?');
      let pathname = parts[0].replace(/^\.\//, '').replace(/^\//, '');
      pathname = pathname.replace(/\.jsx$/i, '.js');
      const query = parts.length > 1 ? '?' + parts.slice(1).join('?') : '';
      const attrs = cleanScriptAttributes((before || '') + (after || ''));
      return '<script' + attrs + ' src="/pad-compat/' + pathname + query + '"></script>';
    }
  );

  html = html.replace(
    /(<meta\s+name=(["'])viewport\2[^>]*>)/i,
    '$1\n  <script src="/pad-compat/polyfills.js?v=' + BUILD_VERSION + '"></script>'
  );

  html = html.replace(/<title>[^<]*<\/title>/i, '<title>나모케미칼 QMES</title>');
  fs.writeFileSync(OUTPUT_HTML, html, 'utf8');
}

function main() {
  if (!fs.existsSync(SOURCE_HTML)) throw new Error('public/index.html not found');
  fs.rmSync(OUTPUT_ROOT, { recursive: true, force: true });
  ensureDir(OUTPUT_JS);
  writePolyfills();
  const result = transpileScripts();
  rewriteHtml();

  console.log('[PAD-COMPAT] generated pad-pc.html');
  console.log('[PAD-COMPAT] transpiled scripts:', result.count);
  if (result.failures.length) {
    console.warn('[PAD-COMPAT] fallback copies:', result.failures.length);
    for (const item of result.failures.slice(0, 20)) {
      console.warn('[PAD-COMPAT]', item.relative, item.error);
    }
  }
}

main();
