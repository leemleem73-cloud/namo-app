/* QMES work-order cross-PC sync - flicker-safe 2026-09-30
 * Keeps shared work-order data available without forcing periodic React remounts.
 * IMPORTANT: never remount the work-order screens just to refresh shared data.
 */
(function () {
  'use strict';
  if (window.__QMES_WORKORDER_CROSS_PC_LIVE_SYNC__) return;
  window.__QMES_WORKORDER_CROSS_PC_LIVE_SYNC__ = true;

  const useWorkOrderSync = () => {
    React.useEffect(() => {
      let active = true;
      let running = false;

      const pullOnce = async () => {
        if (!active || running || typeof window.qmesSyncPullWorkOrders !== 'function') return;
        running = true;
        try {
          await window.qmesSyncPullWorkOrders();
        } catch (error) {
          console.warn('작업지시서 PC 공용 동기화 실패:', error.message);
        } finally {
          running = false;
        }
      };

      // Initial shared-data pull only.
      // No interval, focus listener, visibility listener, version bump, or key remount.
      pullOnce();

      return () => {
        active = false;
      };
    }, []);
  };

  if (typeof ProductionTab === 'function') {
    const OriginalProductionTab = ProductionTab;
    ProductionTab = function ProductionTabWithSharedSync() {
      useWorkOrderSync();
      return <OriginalProductionTab />;
    };
  }

  if (typeof IssueWoTab === 'function') {
    const OriginalIssueWoTab = IssueWoTab;
    IssueWoTab = function IssueWoTabWithSharedSync() {
      useWorkOrderSync();
      return <OriginalIssueWoTab />;
    };
  }
})();
