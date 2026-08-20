/* QMES raw-material name master — manual name entry + PostgreSQL inventory_items sync
 * 2026-08-20
 * User enters only the name; code/type/unit are generated automatically.
 */
(function installMaterialNameMaster(global) {
  "use strict";

  const API_PATH = "/api/inventory/items";
  const DEFAULT_MATERIALS = [
    { code:"RM-NMP", name:"NMP" },
    { code:"RM-BYK180", name:"BYK180 (분산제)" },
    { code:"RM-AOH30", name:"AOH30 (Boehmite)" },
    { code:"RM-SBS", name:"SBS" },
    { code:"RM-PVDF", name:"PVdF" },
    { code:"RM-SBR", name:"SBR" }
  ];
  const text = (value) => String(value ?? "").trim();
  const normalizedName = (value) => text(value).normalize("NFKC").replace(/\s+/g, " ").toLocaleLowerCase("ko-KR");
  const currentUser = () => {
    const raw = global.__QMES_USER__ || global.__QMES_CURRENT_USER__ || "";
    return typeof raw === "object" ? text(raw.name || raw.uid || raw.id) : text(raw);
  };

  function ensureDb() {
    global.DB = global.DB || {};
    if (!global.DB.itemMaster || typeof global.DB.itemMaster !== "object") global.DB.itemMaster = {};
    DEFAULT_MATERIALS.forEach((material) => {
      if (global.DB.itemMaster[material.code]) return;
      global.DB.itemMaster[material.code] = {
        ...material, type:"원재료", category:"RM", unit:"kg", active:true,
        source:"legacy-seed", createdAt:"", createdBy:"", updatedAt:"", updatedBy:""
      };
    });
  }

  function hashName(value) {
    const source = normalizedName(value);
    let hash = 0x811c9dc5;
    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, "0").toUpperCase();
  }
  const makeCode = (name) => `RM-${hashName(name)}`;

  async function request(path, options = {}) {
    const response = await fetch(path, {
      credentials:"same-origin",
      headers:{"Content-Type":"application/json", ...(options.headers || {})},
      ...options
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      throw new Error(payload.message || `원료마스터 요청 실패 (${response.status})`);
    }
    return payload.data;
  }

  function fromApi(row) {
    const code = text(row?.item_code || row?.itemCode || row?.code).toUpperCase();
    const name = text(row?.item_name || row?.itemName || row?.name);
    if (!code || !name) return null;
    return {
      code, name, type:"원재료", category:"RM", unit:text(row?.unit) || "kg",
      active:row?.active !== false,
      safetyStock:Number(row?.safety_stock ?? row?.safetyStock ?? 0) || 0,
      expiryDays:row?.expiry_days ?? row?.expiryDays ?? null,
      source:"inventory_items", erpCode:text(row?.erp_code || row?.erpCode),
      createdAt:text(row?.created_at || row?.createdAt),
      createdBy:text(row?.created_by || row?.createdBy),
      updatedAt:text(row?.updated_at || row?.updatedAt),
      updatedBy:text(row?.updated_by || row?.updatedBy)
    };
  }

  function upsertLocal(material) {
    ensureDb();
    const previous = global.DB.itemMaster[material.code] || {};
    const saved = {
      ...previous, ...material, code:text(material.code).toUpperCase(), name:text(material.name),
      type:"원재료", category:"RM", unit:text(material.unit) || "kg", active:material.active !== false
    };
    global.DB.itemMaster[saved.code] = saved;
    return saved;
  }

  function all() {
    ensureDb();
    return Object.values(global.DB.itemMaster)
      .filter((row) => row && (row.type === "원재료" || row.category === "RM"))
      .sort((a, b) => text(a.name).localeCompare(text(b.name), "ko"));
  }
  const listActive = () => all().filter((row) => row.active !== false);
  const getByName = (name) => {
    const key = normalizedName(name);
    return all().find((row) => normalizedName(row.name) === key) || null;
  };
  const getByCode = (code) => {
    ensureDb();
    return global.DB.itemMaster[text(code).toUpperCase()] || null;
  };
  const notify = (detail) => global.dispatchEvent(new CustomEvent("qmes:material-master-changed", { detail }));

  async function pull() {
    ensureDb();
    const rows = await request(API_PATH);
    let changed = 0;
    (Array.isArray(rows) ? rows : []).forEach((row) => {
      const category = text(row?.category).toUpperCase();
      if (category && category !== "RM" && category !== "RAW_MATERIAL") return;
      const material = fromApi(row);
      if (!material) return;
      upsertLocal(material);
      changed += 1;
    });
    if (typeof global.dbSave === "function") global.dbSave();
    notify({ action:"pull", changed });
    return listActive();
  }

  async function persist(material, action) {
    const row = await request(API_PATH, {
      method:"POST",
      body:JSON.stringify({
        itemCode:material.code, itemName:material.name, category:"RM", unit:"kg",
        safetyStock:Number(material.safetyStock || 0), expiryDays:material.expiryDays ?? null
      })
    });
    const fromServer = fromApi(row) || material;
    const saved = upsertLocal({
      ...material,
      ...fromServer,
      createdBy:fromServer.createdBy || material.createdBy || currentUser(),
      updatedBy:currentUser(),
      updatedAt:fromServer.updatedAt || new Date().toISOString()
    });
    if (typeof global.auditLog === "function") global.auditLog("원료마스터", action, saved.code, saved.name);
    if (typeof global.dbSave === "function") global.dbSave();
    notify({ action, material:saved });
    return saved;
  }

  async function add(name) {
    const cleanName = text(name).replace(/\s+/g, " ");
    if (!cleanName) throw new Error("원료명을 입력하세요.");
    if (cleanName.length > 80) throw new Error("원료명은 80자 이내로 입력하세요.");
    await pull();
    if (getByName(cleanName)) throw new Error("이미 등록된 원료명입니다.");
    const timestamp = new Date().toISOString();
    return await persist({
      code:makeCode(cleanName), name:cleanName, type:"원재료", category:"RM", unit:"kg",
      active:true, source:"manual", erpCode:"", createdAt:timestamp, createdBy:currentUser(),
      updatedAt:timestamp, updatedBy:currentUser()
    }, "등록");
  }

  async function rename(code, nextName) {
    await pull();
    const current = getByCode(code);
    if (!current) throw new Error("변경할 원료를 찾을 수 없습니다.");
    const cleanName = text(nextName).replace(/\s+/g, " ");
    if (!cleanName) throw new Error("원료명을 입력하세요.");
    const duplicate = getByName(cleanName);
    if (duplicate && duplicate.code !== current.code) throw new Error("이미 등록된 원료명입니다.");
    return await persist({
      ...current, name:cleanName, updatedAt:new Date().toISOString(), updatedBy:currentUser()
    }, "명칭변경");
  }

  function erpExport() {
    return all().map((row) => ({
      materialCode:row.erpCode || row.code,
      qmesMaterialCode:row.code,
      materialName:row.name,
      materialType:"RAW_MATERIAL",
      baseUnit:String(row.unit || "kg").toUpperCase(),
      status:row.active === false ? "OBSOLETE" : "ACTIVE",
      updatedAt:row.updatedAt || row.createdAt || ""
    }));
  }

  ensureDb();
  global.qmesMaterialNameMaster = { all, listActive, getByName, getByCode, add, rename, pull, erpExport };

  const initialPull = () => pull().catch((error) => console.warn("원료마스터 공용 동기화 실패:", error.message));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialPull, { once:true });
  else initialPull();
  notify({ action:"ready" });
})(window);
