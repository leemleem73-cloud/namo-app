/* QMES login entry point - restored for attendance testing */
const QMES_LOGIN_SESSION_KEY = "qmes-current-user-v1";

function loadLoginUsers() {
  try {
    const users = typeof loadUsers === "function" ? loadUsers() : [];
    return Array.isArray(users) ? users.filter((user) => user && user.name) : [];
  } catch (error) {
    console.warn("[QMES] 사용자 목록