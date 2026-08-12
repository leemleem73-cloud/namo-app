/* QMES live inventory integration - 2026-08-12
 * Source of truth: IQC passed receipts -> inbound stock, work-order actual input -> consumption.
 * SBS+PVdF internal mix is displayed under SBS and identified in the remark column.
 */
(function installLiveInventory(global){
  "use strict";

  const PASS_VALUES = new Set(["합격", "PASS", "OK", "적합"]);
  const text = (value) => String(value ?? "").