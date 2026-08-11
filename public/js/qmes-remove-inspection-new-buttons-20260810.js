/* QMES inspection UI shortcut — field input shortcut + latest pending PQC auto-fill. */
(function installInspectionFieldShortcut(global){
  "use strict";
  const TARGET_KEY='qmes_field_shortcut_mode';
  const TARGET_LOT_KEY='qmes_field_shortcut_lot';
  const TARGET_DATE_KEY='qmes_field_shortcut_date';

  function text(node){return String(node?.textContent||'').replace