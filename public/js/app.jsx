/* QMES authenticated application entry point. */

function QMESApp() {
  const [user, setUser] = useState(null);

  if (!user) {
    return (
      <LoginScreen
        onLogin={(nextUser) => {
          window.__QMES_USER__ = `${nextUser.dept} ${nextUser.name} (${nextUser.uid || "U-0000"})`;
          setUser(nextUser);
        }}
      />
    );
  }

  return (
    <QMESChemical
      user={user}
      onLogout={() => {
        window.__QMES_USER__ = null;
        setUser(null);
      }}
    />
  );
}

qmesStart();
