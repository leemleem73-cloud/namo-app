/* QMES OQC iPad LOT auto-select fix - 2026-08-19
 * OQC candidates = existing finished lots + PQC completed/pass lots.
 * Also pulls shared PQC/OQC records so iPad sees inspections created on other PCs.
 */
(function installOqcIpadLotAutofill(global){
  "use strict";
  if(global.__QMES_OQC_IPAD_LOT_AUTOFILL_20260819__) return;
  global.__QMES_OQC_IPAD_LOT_AUTOFILL_20260819__=true;

  const text=(v)=>String(v??"