export function initAuthSync() {
  function handleStorageChange(e) {
    if (e.key === "role" || e.key === "token" || e.key === null) {
      window.location.reload();
    }
  }

  window.addEventListener("storage", handleStorageChange);
  return () => window.removeEventListener("storage", handleStorageChange);
}
