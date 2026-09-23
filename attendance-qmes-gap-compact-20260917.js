'use strict';
// Build-safe compatibility preload. The real implementation lives in attendance-qmes-gap-compact-20260923-v2.js.
// During a clean npm install, dependencies do not exist yet, so skip without failing the build.
try {
  require.resolve('express');
  require('./attendance-qmes-gap-compact-20260923-v2.js');
} catch (error) {
  const missing = error && error.code === 'MODULE_NOT_FOUND';
  if (missing) {
    console.log('[Attendance gap compact] skipped until dependencies are installed');
  } else {
    throw error;
  }
}
