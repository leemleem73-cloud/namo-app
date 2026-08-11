/* QMES direct field-inspection entry bridge.
 * Loaded after ipad-pop.jsx and before router.jsx.
 * Consumes the requested IQC/PQC/OQC mode only after FieldInputTab is mounted,
 * so navigation and inspection selection happen in one user action without timing races.
 */
(function installDirectFieldEntryBridge(global){
  'use strict';
  if (global.__QMES_DIRECT_FIELD_ENTRY_BRIDGE__) return;
  global.__QMES_DIRECT_FIELD_ENTRY_BRIDGE__ = true;

  const TARGET_KEY = 'qmes_field_shortcut_mode';
  if (typeof FieldInputTab !== 'function') return;

  const OriginalFieldInputTab = FieldInputTab;

  FieldInputTab = function QmesDirectFieldInputTab(){
    React.useEffect(() => {
      let mode = '';
      try { mode = String(sessionStorage.getItem(TARGET_KEY) || '').toUpperCase(); } catch (error) {}
      if (!['IQC','PQC','OQC'].includes(mode)) return;

      const card = document.querySelector(`.qmes-ipad-home-card.is-${mode.toLowerCase()}`);
      if (!card) return;

      try { sessionStorage.removeItem(TARGET_KEY); } catch (error) {}
      card.click();
    }, []);

    return <OriginalFieldInputTab />;
  };
})(window);
