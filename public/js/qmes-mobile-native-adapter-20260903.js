(() => {
  'use strict';

  if (window.__QMES_MOBILE_NATIVE_ADAPTER_V1__) return;
  window.__QMES_MOBILE_NATIVE_ADAPTER_V1__ = true;

  const frame = document.getElementById('workFrame');
  if (!frame) return;

  const params = new URLSearchParams(location.search);
  const currentTab = () => params.get('tab') || (() => {
    try { return sessionStorage.getItem('qmes_current_tab') || 'dash'; }
    catch (_) { return 'dash'; }
  })();

  const STYLE_ID = 'qmw-native-adapter-style-v1';
  const KEEP_TABLE_TABS = new Set(['spc', 'trace', 'dash']);

  const nativeCss = `
    html,body,#root,#root>div{
      width:100%!important;max-width:100%!important;min-width:0!important;
      margin:0!important;padding:0!important;
    }
    html,body{overflow-x:hidden!important;background:#f4f6f8!important;color:#172b3e!important}
    body.qmw-native-work{font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important;font-size:14px!important}
    body.qmw-native-work *{box-sizing:border-box!important}

    body.qmw-native-work #root>div>header,
    body.qmw-native-work #qmes-sync-sidebar,
    body.qmw-native-work #qmes-sync-hamburger,
    body.qmw-native-work #qmes-all-menu-dropdown,
    body.qmw-native-work #qmes-user-dropdown,
    body.qmw-native-work .qmes-top-menu-bar,
    body.qmw-native-work .qmes-top-menu,
    body.qmw-native-work .qmes-submenu-row{
      display:none!important;
    }

    body.qmw-native-work #root>div{
      min-height:100vh!important;background:#f4f6f8!important;color:#172b3e!important;
    }
    body.qmw-native-work #root>div>main,
    body.qmw-native-work main{
      width:100%!important;max-width:100%!important;min-width:0!important;
      margin:0!important;padding:10px!important;overflow:visible!important;background:#f4f6f8!important;
    }
    body.qmw-native-work main>div,
    body.qmw-native-work main>section,
    body.qmw-native-work main>article,
    body.qmw-native-work main>form{
      width:100%!important;max-width:100%!important;min-width:0!important;margin-left:0!important;margin-right:0!important;
    }

    body.qmw-native-work h1{font-size:20px!important;line-height:1.3!important;letter-spacing:-.035em!important;color:#172f46!important}
    body.qmw-native-work h2{font-size:17px!important;line-height:1.35!important;letter-spacing:-.025em!important;color:#203a51!important}
    body.qmw-native-work h3{font-size:15px!important;line-height:1.4!important;color:#29455d!important}
    body.qmw-native-work label{font-size:12px!important;font-weight:800!important;color:#455d72!important;line-height:1.45!important}

    body.qmw-native-work input,
    body.qmw-native-work select,
    body.qmw-native-work textarea{
      width:100%!important;max-width:100%!important;min-width:0!important;
      font-size:16px!important;line-height:1.35!important;
      border-radius:10px!important;box-shadow:none!important;
    }
    body.qmw-native-work input,
    body.qmw-native-work select{min-height:48px!important}
    body.qmw-native-work textarea{min-height:96px!important;resize:vertical!important}
    body.qmw-native-work button,
    body.qmw-native-work [role="button"]{
      min-height:44px!important;max-width:100%!important;border-radius:10px!important;
      touch-action:manipulation!important;line-height:1.25!important;
    }

    body.qmw-native-work form{width:100%!important;max-width:100%!important}
    body.qmw-native-work form .grid,
    body.qmw-native-work main .grid{max-width:100%!important;gap:10px!important}
    body.qmw-native-work form .flex,
    body.qmw-native-work main .flex{flex-wrap:wrap!important;gap:8px!important}
    body.qmw-native-work [role="tablist"]{
      display:flex!important;flex-wrap:nowrap!important;max-width:100%!important;overflow-x:auto!important;
      -webkit-overflow-scrolling:touch!important;scrollbar-width:none!important;
    }
    body.qmw-native-work [role="tablist"]>*{flex:0 0 auto!important;white-space:nowrap!important}

    body.qmw-native-work .qmes-wo-cert,
    body.qmw-native-work .qmes-production,
    body.qmw-native-work .qmes-prod-process,
    body.qmw-native-work .ipad-pop,
    body.qmw-native-work .inv-enterprise-root,
    body.qmw-native-work #qmes-inventory-host,
    body.qmw-native-work .iqc-page,
    body.qmw-native-work .pqc-page,
    body.qmw-native-work .oqc-page,
    body.qmw-native-work .namo-enterprise-dashboard{
      width:100%!important;max-width:100%!important;min-width:0!important;
      margin-left:0!important;margin-right:0!important;
    }

    body.qmw-native-work .qmw-table-host{
      width:100%!important;max-width:100%!important;min-width:0!important;
    }
    body.qmw-native-work .qmw-table-host.qmw-scroll-table{
      overflow-x:auto!important;overflow-y:visible!important;-webkit-overflow-scrolling:touch!important;
      border:1px solid #dfe6ec!important;border-radius:13px!important;background:#fff!important;
    }
    body.qmw-native-work table.qmw-data-table{
      width:max-content!important;min-width:680px!important;max-width:none!important;
      border-collapse:separate!important;border-spacing:0!important;white-space:nowrap!important;
    }
    body.qmw-native-work table.qmw-data-table th{
      background:#edf3f7!important;color:#365169!important;font-size:11px!important;font-weight:900!important;
    }
    body.qmw-native-work table.qmw-data-table td,
    body.qmw-native-work table.qmw-data-table th{padding:10px 9px!important;vertical-align:middle!important}

    body.qmw-native-work [role="dialog"]{
      position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;
      max-width:none!important;max-height:none!important;margin:0!important;padding:8px!important;
      overflow:auto!important;align-items:flex-start!important;background:rgba(15,34,53,.42)!important;
    }
    body.qmw-native-work [role="dialog"]>div,
    body.qmw-native-work [role="dialog"]>form{
      width:100%!important;max-width:none!important;max-height:none!important;margin:0!important;
      border-radius:14px!important;overflow:visible!important;
    }

    @media(max-width:699px){
      body.qmw-native-work #root>div>main,
      body.qmw-native-work main{padding:8px!important}

      body.qmw-native-work .grid,
      body.qmw-native-work [class*="grid-cols-2"],
      body.qmw-native-work [class*="grid-cols-3"],
      body.qmw-native-work [class*="grid-cols-4"],
      body.qmw-native-work [class*="grid-cols-5"],
      body.qmw-native-work [class*="grid-cols-6"]{
        grid-template-columns:minmax(0,1fr)!important;
      }

      body.qmw-native-work table.qmw-card-table{
        display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;
        border:0!important;background:transparent!important;white-space:normal!important;
      }
      body.qmw-native-work table.qmw-card-table thead{
        position:absolute!important;width:1px!important;height:1px!important;margin:-1px!important;
        padding:0!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;white-space:nowrap!important;border:0!important;
      }
      body.qmw-native-work table.qmw-card-table tbody{
        display:grid!important;width:100%!important;gap:10px!important;background:transparent!important;
      }
      body.qmw-native-work table.qmw-card-table tr{
        display:block!important;width:100%!important;min-width:0!important;margin:0!important;padding:6px 12px!important;
        border:1px solid #dfe6ec!important;border-radius:14px!important;background:#fff!important;
        box-shadow:0 3px 12px rgba(20,45,69,.04)!important;
      }
      body.qmw-native-work table.qmw-card-table td{
        display:grid!important;width:100%!important;min-width:0!important;
        grid-template-columns:minmax(86px,34%) minmax(0,1fr)!important;align-items:center!important;gap:10px!important;
        padding:9px 0!important;border:0!important;border-bottom:1px solid #edf1f4!important;
        white-space:normal!important;overflow:visible!important;text-overflow:clip!important;max-width:none!important;
      }
      body.qmw-native-work table.qmw-card-table td:last-child{border-bottom:0!important}
      body.qmw-native-work table.qmw-card-table td::before{
        content:attr(data-qmw-label);color:#748392!important;font-size:10px!important;font-weight:850!important;line-height:1.35!important;
      }
      body.qmw-native-work table.qmw-card-table td:empty::after{content:'-';color:#a0aab3}
      body.qmw-native-work table.qmw-card-table td input,
      body.qmw-native-work table.qmw-card-table td select,
      body.qmw-native-work table.qmw-card-table td textarea,
      body.qmw-native-work table.qmw-card-table td button{width:100%!important;max-width:100%!important}
      body.qmw-native-work table.qmw-card-table td button{min-height:44px!important}

      body.qmw-native-work table.qmw-data-table{min-width:620px!important}

      body.qmw-native-work .px-6,
      body.qmw-native-work .px-5,
      body.qmw-native-work .p-6,
      body.qmw-native-work .p-5{padding-left:10px!important;padding-right:10px!important}
      body.qmw-native-work [class*="text-3xl"],
      body.qmw-native-work [class*="text-4xl"]{font-size:20px!important;line-height:1.3!important}
    }

    @media(min-width:700px) and (max-width:1180px){
      body.qmw-native-work #root>div>main,
      body.qmw-native-work main{padding:16px!important}
      body.qmw-native-work .grid{gap:12px!important}
      body.qmw-native-work [class*="grid-cols-3"],
      body.qmw-native-work [class*="grid-cols-4"],
      body.qmw-native-work [class*="grid-cols-5"],
      body.qmw-native-work [class*="grid-cols-6"]{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      body.qmw-native-work input,
      body.qmw-native-work select{min-height:50px!important}
      body.qmw-native-work button{min-height:46px!important}
    }
  `;

  function ensureStyle(doc) {
    if (!doc || !doc.head || !doc.body) return false;
    doc.body.classList.add('qmw-native-work');
    if (!doc.getElementById(STYLE_ID)) {
      const style = doc.createElement('style');
      style.id = STYLE_ID;
      style.textContent = nativeCss;
      doc.head.appendChild(style);
    }
    return true;
  }

  function normalizeMain(doc) {
    if (!doc || !doc.body) return;
    const viewport = Math.max(320, frame.clientWidth || window.innerWidth || 390);
    const direct = doc.querySelectorAll('main > div, main > section, main > article, main > form');
    direct.forEach(el => {
      if (el.closest('[role="dialog"]')) return;
      const rect = el.getBoundingClientRect();
      const cs = doc.defaultView && doc.defaultView.getComputedStyle ? doc.defaultView.getComputedStyle(el) : null;
      const minWidth = cs ? (parseFloat(cs.minWidth) || 0) : 0;
      if (rect.width > viewport * 1.15 || minWidth > viewport + 16) {
        el.style.setProperty('width', '100%', 'important');
        el.style.setProperty('max-width', '100%', 'important');
        el.style.setProperty('min-width', '0', 'important');
      }
    });
  }

  function getHeaders(table) {
    const rows = Array.from(table.querySelectorAll('thead tr'));
    const row = rows.length ? rows[rows.length - 1] : null;
    if (!row) return [];
    return Array.from(row.querySelectorAll('th')).map((th, index) => {
      const text = String(th.textContent || '').replace(/\s+/g, ' ').trim();
      return text || `항목 ${index + 1}`;
    });
  }

  function isComplexTable(table) {
    return Array.from(table.querySelectorAll('th,td')).some(cell => Number(cell.colSpan || 1) > 1 || Number(cell.rowSpan || 1) > 1);
  }

  function prepareTables(doc, tab) {
    if (!doc || !doc.body) return;
    const isPhone = (frame.clientWidth || window.innerWidth || 390) < 700;
    doc.querySelectorAll('main table').forEach(table => {
      table.classList.remove('qmw-card-table', 'qmw-data-table');
      const parent = table.parentElement;
      if (parent) {
        parent.classList.add('qmw-table-host');
        parent.classList.remove('qmw-scroll-table');
      }

      const headers = getHeaders(table);
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      const tooWide = headers.length > 8;
      const keepTable = !isPhone || KEEP_TABLE_TABS.has(tab) || isComplexTable(table) || !headers.length || !rows.length || tooWide;

      if (keepTable) {
        table.classList.add('qmw-data-table');
        if (parent) parent.classList.add('qmw-scroll-table');
        return;
      }

      table.classList.add('qmw-card-table');
      rows.forEach(row => {
        Array.from(row.children).forEach((cell, index) => {
          if (cell.tagName !== 'TD') return;
          const label = headers[index] || `항목 ${index + 1}`;
          cell.setAttribute('data-qmw-label', label);
        });
      });
    });
  }

  function applyNative(doc) {
    if (!ensureStyle(doc)) return;
    const tab = currentTab();
    normalizeMain(doc);
    prepareTables(doc, tab);
    try {
      doc.documentElement.style.setProperty('scroll-behavior', 'smooth');
      doc.documentElement.scrollLeft = 0;
      doc.body.scrollLeft = 0;
    } catch (_) {}
  }

  function installObserver(doc) {
    if (!doc || !doc.body || !doc.defaultView || doc.defaultView.__QMW_NATIVE_OBSERVER_V1__) return;
    doc.defaultView.__QMW_NATIVE_OBSERVER_V1__ = true;
    let timer = 0;
    const rerun = () => {
      clearTimeout(timer);
      timer = setTimeout(() => applyNative(doc), 100);
    };
    const observer = new doc.defaultView.MutationObserver(rerun);
    observer.observe(doc.body, { childList: true, subtree: true });
    doc.defaultView.addEventListener('resize', rerun, { passive: true });
    doc.defaultView.addEventListener('orientationchange', rerun, { passive: true });
  }

  function applyFrame() {
    try {
      const doc = frame.contentDocument;
      if (!doc || !doc.body) return;
      applyNative(doc);
      installObserver(doc);
    } catch (_) {}
  }

  frame.addEventListener('load', () => {
    [40, 160, 420, 900, 1600].forEach(delay => setTimeout(applyFrame, delay));
  });

  window.addEventListener('resize', () => setTimeout(applyFrame, 80), { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(applyFrame, 120), { passive: true });

  [0, 250, 800].forEach(delay => setTimeout(applyFrame, delay));
})();
