/* QMES work-order cross-PC live sync - 2026-08-20
 * Keeps work-order issue/list/production views aligned with PostgreSQL shared records.
 * Active work-order editing is never interrupted by a remote refresh.
 */
(function () {
  'use strict';
  if (window.__QMES_WORKORDER_CROSS_PC_LIVE_SYNC__) return;
  window.__QMES_WORKORDER_CROSS_PC_LIVE_SYNC__ = true;

  const useLiveWorkOrderSync = (shouldRefresh) => {
    const [version, setVersion] = React.useState(0);

    React.useEffect(() => {
      let active = true;
      let running = false;

      const pull = async () => {
        if (!active || running || typeof window.qmesSyncPullWorkOrders !== 'function') return;
        running = true;
        try {
          await window.qmesSyncPullWorkOrders();
          const allowed = typeof shouldRefresh === 'function' ? shouldRefresh() : true;
          if (active && allowed) setVersion((value) => value + 1);
        } catch (error) {
          console.warn('작업지시서 PC 공용 자동 동기화 실패:', error.message);
        } finally {
          running = false;
        }
      };

      const onFocus = () => pull();
      const onVisible = () => { if (!document.hidden) pull(); };
      const onSharedComplete = () => {
        const allowed = typeof shouldRefresh === 'function' ? shouldRefresh() : true;
        if (active && allowed) setVersion((value) => value + 1);
      };

      pull();
      const timer = window.setInterval(pull, 7000);
      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onVisible);
      window.addEventListener('qmes:shared-sync-complete', onSharedComplete);

      return () => {
        active = false;
        window.clearInterval(timer);
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onVisible);
        window.removeEventListener('qmes:shared-sync-complete', onSharedComplete);
      };
    }, []);

    return version;
  };

  if (typeof ProductionTab === 'function') {
    const OriginalProductionTab = ProductionTab;
    ProductionTab = function ProductionTabWithSharedSync() {
      const version = useLiveWorkOrderSync(() => true);
      return <OriginalProductionTab key={`production-${version}`} />;
    };
  }

  if (typeof IssueWoTab === 'function') {
    const OriginalIssueWoTab = IssueWoTab;
    IssueWoTab = function IssueWoTabWithSharedSync() {
      const version = useLiveWorkOrderSync(() => !document.querySelector('.qmes-wo-issue-shell'));
      return <OriginalIssueWoTab key={`issue-${version}`} />;
    };
  }
})();
