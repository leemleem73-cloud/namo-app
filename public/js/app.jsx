/* QMES temporary test-mode entry point.
 * Login is intentionally bypassed while the system is being tested.
 */

const QMES_TEST_USER = {
  id: "admin",
  uid: "U-0001",
  name: "관리자",
  dept: "관리부",
  role: "admin",
};

function QMESApp() {
  window.__QMES_USER__ = `${QMES_TEST_USER.dept} ${QMES_TEST_USER.name} (${QMES_TEST_USER.uid})`;

  return (
    <QMESChemical
      user={QMES_TEST_USER}
      onLogout={() => window.location.reload()}
    />
  );
}

qmesStart();
