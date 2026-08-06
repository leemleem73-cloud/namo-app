/* MES TEST: IQC -> inventory -> work order usage integration (2026-08-06)
   Loaded after api.jsx and before router.jsx. Original modules are not overwritten. */
(function installMesTestInventoryIntegration(){
  if (window.__QMES_MES_TEST_INVENTORY_20260806__) return;
  window.__QMES_MES_TEST_INVENTORY_20260806__ = true;

  const numberOf = (value) => {
    if (typeof value === "number") return