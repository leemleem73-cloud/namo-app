/* IQC sync guard — preserve registered IQC and recover missing trace-linked rows without fabricating pass results. */
(function(){
  'use strict';
  if(window.__QMES_IQC_SYNC_GUARD_20260813_V3__) return;
  window.__QMES_IQC_SYNC_GUARD_20260813_V3__ = true;

  const clean = (v) => String(v == null ? '' : v).trim();
  const validInNo = (v) => /^IQC-\d{6}-\d{4}$/.test(clean(v));
  const inspector = (row) => clean(row?.inspector