/* QMES live inventory integration - 2026-08-07
 * Source of truth:
 *   IQC passed receipts -> inbound stock
 *   Work-order actual input -> consumption
 * The original inventory screen/data remain untouched; this file replaces only the runtime InventoryTab.
 */
(function installLiveInventory(global){
  "use strict";

  const PASS_VALUES = new Set(["합격", "PASS", "OK", "적합"]);

  function text(value){ return String(value ?? "").trim(); }
  function upper(value){ return text(value).toUpperCase().replace(/\s+/g, ""); }

  function materialKey(value){
    const v = upper(value);
    if (v.includes("BYK180") || v.includes("BYK-180") || v.includes("분산제")) return "BYK180";
    if (v.includes("AOH30") || v.includes("BOEHMITE")) return "AOH30";
    if (v.includes("PVDF")) return "PVDF";
    if (v.includes("NMP")) return "NMP";
    if (v.includes("SBR")) return "SBR";
    if (v.includes("SBS")) return "SBS";
    if (v.includes("20KG") && (v.includes("캔") || v.includes("CAN"))) return "CAN20";
    return v;
  }

  function quantity(value, fallbackUnit){
    const raw = text(value).replace(/,/g, "");
    if (!raw) return 0;
    const match = raw.match(/^(-?\d+(?:\.\d+)?)\s*(KG|G|T|EA|L|캔)?$/i);
    if (!match) {
      const n = Number(raw);
      return Number.isFinite(n) ? n : 0;
    }
    const amount = Number(match[1]);
    const unit = upper(match[2] || fallbackUnit || "KG");
    if (!Number.isFinite(amount)) return 0;
    if (unit === "G") return amount / 1000;
    if (unit === "T") return amount * 1000;
    return amount;
  }

  function lotKey(material, lot){ return `${materialKey(material)}|${upper(lot)}`; }

  function isHoldLot(lot){
    const target = upper(lot);
    if (!target) return false;
    try {
      if (typeof global.qmesActiveHold === "function" && global.qmesActiveHold(lot)) return true;
    } catch (_error) {}
    return (global.DB?.holds || []).some((row) => {
      const status = text(row?.status);
      return upper(row?.target).includes(target) && /차단|홀드|격리/.test(status);
    });
  }

  function buildUsage(){
    const usage = new Map();
    const workOrders = global.DB?.woDocs && typeof global.DB.woDocs === "object"
      ? Object.entries(global.DB.woDocs)
      : [];

    workOrders.forEach(([workOrderNo, workOrder]) => {
      (Array.isArray(workOrder?.inputs) ? workOrder.inputs : []).forEach((input) => {
        const lot = text(input?.materialLot || input?.lot);
        const act = quantity(input?.act, input?.unit || "kg");
        if (!lot || !(act > 0)) return;
        const key = lotKey(input?.name, lot);
        const current = usage.get(key) || { used:0, workOrders:[] };
        current.used += act;
        current.workOrders.push({ workOrderNo, used:act, item:text(workOrder?.item) });
        usage.set(key, current);
      });
    });
    return usage;
  }

  function buildLotLedger(){
    const usage = buildUsage();
    const receipts = new Map();
    const iqcRows = Array.isArray(global.DB?.iqc) ? global.DB.iqc : [];

    iqcRows.forEach((row, index) => {
      if (!PASS_VALUES.has(text(row?.judge).toUpperCase())) return;
      const name = text(row?.name || row?.material || row?.item);
      const lot = text(row?.lot || row?.lotNo || row?.materialLot);
      if (!name || !lot) return;
      const receiptId = text(row?.inNo || row?.serverId || row?.id || `${index}`);
      const key = lotKey(name, lot);
      const current = receipts.get(key) || {
        key,
        materialKey:materialKey(name),
        name,
        lot:upper(lot),
        received:0,
        receiptIds:new Set(),
        supplier:text(row?.supplier),
        receivedAt:text(row?.recv || row?.receivedAt || row?.inspectedAt).slice(0,10)
      };
      if (!current.receiptIds.has(receiptId)) {
        current.receiptIds.add(receiptId);
        current.received += quantity(row?.qty ?? row?.incomingQty ?? row?.incoming_qty, "kg");
      }
      if (text(row?.supplier)) current.supplier = text(row.supplier);
      if (text(row?.recv || row?.receivedAt || row?.inspectedAt)) {
        current.receivedAt = text(row?.recv || row?.receivedAt || row?.inspectedAt).slice(0,10);
      }
      receipts.set(key, current);
    });

    return Array.from(receipts.values()).map((row) => {
      const used = usage.get(row.key)?.used || 0;
      const remaining = Math.max(0, Number((row.received - used).toFixed(3)));
      const hold = isHoldLot(row.lot);
      return {
        materialKey:row.materialKey,
        name:row.name,
        lot:row.lot,
        supplier:row.supplier || "-",
        receivedAt:row.receivedAt || "-",
        received:Number(row.received.toFixed(3)),
        used:Number(used.toFixed(3)),
        remaining,
        hold,
        status:remaining <= 0 ? "소진" : hold ? "홀드" : "사용가능",
        workOrders:usage.get(row.key)?.workOrders || []
      };
    });
  }

  function baseInventory(){
    try {
      if (typeof INVENTORY !== "undefined" && Array.isArray(INVENTORY)) return INVENTORY;
    } catch (_error) {}
    return [
      { code:"RM-NMP", name:"NMP", stock:0, safety:2400, unit:"kg", loc:"위험물창고 D-01", cond:"밀폐 · 25±5℃" },
      { code:"RM-BYK180", name:"BYK180 (분산제)", stock:0, safety:100, unit:"kg", loc:"원재료창고 A-05", cond:"25±5℃" },
      { code:"RM-AOH30", name:"AOH30 (Boehmite)", stock:0, safety:1800, unit:"kg", loc:"원재료창고 A-01", cond:"25±5℃ · 습도 50%↓" },
      { code:"RM-SBS", name:"SBS", stock:0, safety:300, unit:"kg", loc:"드라이룸 DR-02", cond:"RH 0.54%↓" },
      { code:"RM-PVDF", name:"PVdF", stock:0, safety:400, unit:"kg", loc:"드라이룸 DR-02", cond:"RH 0.54%↓" },
      { code:"RM-SBR", name:"SBR", stock:0, safety:300, unit:"kg", loc:"원재료창고 A-03", cond:"25±5℃ · 습도 50%↓" },
      { code:"PK-CAN20", name:"포장용기 20kg 캔", stock:0, safety:400, unit:"EA", loc:"부자재창고 C-02", cond:"-" }
    ];
  }

  function buildInventoryRows(){
    const lots = buildLotLedger();
    return baseInventory().map((base) => {
      const key = materialKey(base.name);
      const matched = lots.filter((lot) => lot.materialKey === key);
      const linked = matched.length > 0;
      const stock = linked
        ? matched.reduce((sum, lot) => sum + lot.remaining, 0)
        : Number(base.stock || 0);
      const holdStock = matched.filter((lot) => lot.hold).reduce((sum, lot) => sum + lot.remaining, 0);
      const availableStock = Math.max(0, stock - holdStock);
      return {
        ...base,
        stock:Number(stock.toFixed(3)),
        availableStock:Number(availableStock.toFixed(3)),
        holdStock:Number(holdStock.toFixed(3)),
        lotCount:matched.filter((lot) => lot.remaining > 0).length,
        linked,
        lots:matched,
        status:availableStock < Number(base.safety || 0) ? "부족" : "정상"
      };
    });
  }

  global.qmesBuildInventoryLotRows = buildLotLedger;
  global.qmesBuildInventoryRows = buildInventoryRows;

  function LiveInventoryTab(){
    const ReactRef = global.React;
    const [version, setVersion] = ReactRef.useState(0);
    const rows = buildInventoryRows();
    const short = rows.filter((row) => row.availableStock < Number(row.safety || 0));
    const linkedCount = rows.filter((row) => row.linked).length;

    ReactRef.useEffect(() => {
      const refresh = () => setVersion((value) => value + 1);
      global.addEventListener("storage", refresh);
      global.addEventListener("focus", refresh);
      global.addEventListener("qmes:data-updated", refresh);
      global.addEventListener("qmes:lot-validation", refresh);
      document.addEventListener("qmes:data-updated", refresh);
      return () => {
        global.removeEventListener("storage", refresh);
        global.removeEventListener("focus", refresh);
        global.removeEventListener("qmes:data-updated", refresh);
        global.removeEventListener("qmes:lot-validation", refresh);
        document.removeEventListener("qmes:data-updated", refresh);
      };
    }, []);

    const h = ReactRef.createElement;
    const alert = short.length > 0 && rows.some((row) => row.stock > 0)
      ? h("div", { className:"flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3" },
          typeof AlertTriangle !== "undefined" ? h(AlertTriangle, { size:16, className:"text-amber-400 shrink-0" }) : null,
          h("p", { className:"text-sm text-amber-200" }, `가용재고 안전재고 미달 ${short.length}건 — ${short.map((row) => row.name).join(", ")}.`)
        )
      : null;

    const table = h("div", { className:"overflow-x-auto -mx-4 px-4" },
      h("table", { className:"w-full text-sm min-w-[920px]" },
        h("thead", null,
          h("tr", { className:"text-xs text-slate-400 border-b border-slate-800" },
            ["자재코드","품명","현재고","가용재고","안전재고","LOT","재고 수준","보관위치","보관조건","상태"].map((label, index) =>
              h("th", { key:label, className:`py-2 pr-3 font-medium ${[2,3,4,5].includes(index) ? "text-right" : "text-left"}` }, label)
            )
          )
        ),
        h("tbody", null,
          rows.map((row) => {
            const low = row.availableStock < Number(row.safety || 0);
            const ratio = Number(row.safety || 0) > 0 ? Math.min((row.availableStock / (row.safety * 2)) * 100, 100) : 100;
            return h("tr", { key:row.code, className:"border-b border-slate-800/60 hover:bg-slate-800/30" },
              h("td", { className:"py-2.5 pr-3 font-mono text-xs text-sky-300" }, row.code),
              h("td", { className:"py-2.5 pr-3 text-slate-100" }, row.name),
              h("td", { className:"py-2.5 pr-3 text-right tabular-nums text-slate-100 font-medium" }, `${row.stock.toLocaleString()} ${row.unit}`),
              h("td", { className:"py-2.5 pr-3 text-right tabular-nums text-emerald-300 font-semibold", title:row.holdStock > 0 ? `홀드 ${row.holdStock.toLocaleString()} ${row.unit} 제외` : "홀드 제외 가용재고" }, `${row.availableStock.toLocaleString()} ${row.unit}`),
              h("td", { className:"py-2.5 pr-3 text-right tabular-nums text-slate-400" }, Number(row.safety || 0).toLocaleString()),
              h("td", { className:"py-2.5 pr-3 text-right tabular-nums text-slate-300" }, row.linked ? `${row.lotCount} LOT` : "-"),
              h("td", { className:"py-2.5 pr-3" },
                h("div", { className:"h-1.5 bg-slate-800 rounded overflow-hidden" },
                  h("div", { className:`h-full rounded ${low ? "bg-amber-400" : "bg-emerald-400"}`, style:{ width:`${ratio}%` } })
                )
              ),
              h("td", { className:"py-2.5 pr-3 text-xs text-slate-400" }, row.loc),
              h("td", { className:"py-2.5 pr-3 text-xs text-slate-400" }, row.cond),
              h("td", { className:"py-2.5" }, typeof Badge !== "undefined"
                ? h(Badge, { tone:low ? "amber" : "green" }, low ? "부족" : "정상")
                : h("span", null, low ? "부족" : "정상"))
            );
          })
        )
      )
    );

    return h("div", { className:"flex flex-col gap-4", "data-live-version":version },
      alert,
      h(Panel, { title:"원재료 · 부자재 재고 현황", right:h("span", { className:"text-xs text-slate-400" }, `실시간 연동 ${linkedCount}/${rows.length}품목`) },
        table,
        h("p", { className:"text-[11px] text-slate-500 mt-3" }, "현재고 = IQC 합격 입고량 - 작업지시 실투입량 · 가용재고 = 현재고 - 홀드 잔량 · LOT 단위 자동 집계")
      )
    );
  }

  global.InventoryTab = LiveInventoryTab;
  console.info("[QMES] 실시간 재고 연동 활성화");
})(window);
