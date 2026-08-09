/* QMES module bootstrap.
   Loads service modules in a stable order and exposes module health diagnostics. */
(function installQmesModuleBootstrap(global){
  const modules = [
    {
      id:"audit",
      src:"./js/audit-trail-service.js?v=20260806-audit2",
      ready:()=>typeof global.qmesRecordAudit === "function"
    },
    {
      id:"inventory-lot",
      src:"./js/inventory-lot-service.js?v=20260806-lot4",
      ready:()=>typeof global.qmesBuildMaterialLotLedger === "function"
    },
    {
      id:"workorder-lot-bridge",
      src:"./js/workorder-lot-bridge.js?v=20260806-bridge2",
      ready:()=>typeof global.qmesCompleteWorkOrderSafely === "function"
    },
    {
      id:"inspection-remove-new-buttons",
      src:"./js/inspection-remove-new-buttons-20260810.js?v=20260810-1",
      ready:()=>global.__QMES_INSPECTION_NEW_BUTTONS_REMOVED__ === true
    }
  ];

  const state = global.__QMES_MODULE_STATE__ = global.__QMES_MODULE_STATE__ || {};

  function loadScript(module){
    if (module.ready()) {
      state[module.id] = { status:"ready", at:new Date().toISOString() };
      return Promise.resolve(state[module.id]);
    }
    const existing = document.querySelector(`script[data-qmes-module="${module.id}"]`);
    if (existing) {
      return new Promise((resolve, reject) => {
        existing.addEventListener("load", () => resolve(), { once:true });
        existing.addEventListener("error", reject, { once:true });
      });
    }
    state[module.id] = { status:"loading", at:new Date().toISOString() };
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = module.src;
      script.async = false;
      script.dataset.qmesModule = module.id;
      script.onload = () => {
        const ok = module.ready();
        state[module.id] = { status:ok ? "ready" : "error", at:new Date().toISOString() };
        ok ? resolve(state[module.id]) : reject(new Error(`${module.id} API not found after load`));
      };
      script.onerror = () => {
        state[module.id] = { status:"error", at:new Date().toISOString() };
        reject(new Error(`${module.id} load failed`));
      };
      document.head.appendChild(script);
    });
  }

  async function initialize(){
    const errors = [];
    for (const module of modules) {
      try { await loadScript(module); }
      catch (error) {
        console.error(`[QMES] ${module.id} 모듈 초기화 실패`, error);
        errors.push({ id:module.id, message:error.message });
      }
    }
    const result = {
      ok:errors.length === 0,
      errors,
      state:{ ...state },
      at:new Date().toISOString()
    };
    global.__QMES_MODULES_READY__ = result.ok;
    global.dispatchEvent(new CustomEvent("qmes:modules-ready", { detail:result }));
    return result;
  }

  function getHealth(){
    const checks = {
      inventory:typeof global.qmesBuildInventoryRows === "function",
      lot:typeof global.qmesBuildMaterialLotLedger === "function",
      recommendation:typeof global.qmesRecommendWorkOrderLots === "function",
      validation:typeof global.qmesValidateWorkOrderLots === "function",
      audit:typeof global.qmesRecordAudit === "function",
      bridge:typeof global.qmesCompleteWorkOrderSafely === "function"
    };
    return {
      ok:Object.values(checks).every(Boolean),
      checks,
      state:{ ...state },
      at:new Date().toISOString()
    };
  }

  global.qmesInitializeModules = initialize;
  global.qmesGetModuleHealth = getHealth;
})(window);
