/* Deprecated QMES inspection button-removal module.
   Kept only for compatibility with stale cached loaders.
   Native 신규등록 / 수정 / 출력 / 삭제 controls must remain intact. */
(function disableLegacyInspectionButtonRemoval(global){
  'use strict';
  global.__QMES_INSPECTION_NEW_BUTTONS_REMOVED__ = false;
  global.__QMES_INSPECTION_REMOVE_BUTTONS_DISABLED__ = true;
})(window);
