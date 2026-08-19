/* QMES work-order cross-PC live sync - 2026-08-20
 * Keeps work-order issue/list/detail/production views aligned with PostgreSQL shared records.
 */
(function () {
  'use strict';
  if (window.__QMES_WORKORDER_CROSS_PC_LIVE_SYNC__) return;
  window.__QMES_WORKORDER_CROSS_PC_LIVE_SYNC__ = true;

  const useLiveWorkOrderSync = () => {
    const [version, setVersion] = React.useState(0);

    React.useEffect(() => {
      let active = true;
      let running = false;

      const pull = async () => {
        if (!active || running || typeof window.qmesSyncPullWorkOrders !== 'function') return;
        running = true;
        try {
          await window.qmesSyncPullWorkOrders();
          if (active) setVersion((value) => value + 1);
        } catch (error) {
          console.warn('작업지시서 PC 공용 자동 동기화 실패:', error.message);
        } finally {
          running = false;
        }
      };

      const onFocus = () => pull();
      const onVisible = () => { if (!document.hidden) pull(); };
      const onSharedChange = () => pull();

      pull();
      const timer = window.setInterval(pull, 5000);
      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onVisible);
      document.addEventListener('qmes:data-updated', onSharedChange);
      document.addEventListener('qmes:data-changed', onSharedChange);

      return () => {
        active = false;
        window.clearInterval(timer);
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onVisible);
        document.removeEventListener('qmes:data-updated', onSharedChange);
        document.removeEventListener('qmes:data-changed', onSharedChange);
      };
    }, []);

    return version;
  };

  if (typeof ProductionTab === 'function') {
    const OriginalProductionTab = ProductionTab;
    ProductionTab = function ProductionTabWithSharedSync() {
      const version = useLiveWorkOrderSync();
      return <OriginalProductionTab key={`production-${version}`} />;
    };
  }

  if (typeof IssueWoTab === 'function') {
    const OriginalIssueWoTab = IssueWoTab;
    IssueWoTab = function IssueWoTabWithSharedSync() {
      const version = useLiveWorkOrderSync();
      return <OriginalIssueWoTab key={`issue-${version}`} />;
    };
  }

  if (typeof WoDocTab === 'function') {
    const OriginalWoDocTab = WoDocTab;
    WoDocTab = function WoDocTabWithSharedSync() {
      const version = useLiveWorkOrderSync();
      return <OriginalWoDocTab key={`doc-${version}`} />;
    };
  }
})();
