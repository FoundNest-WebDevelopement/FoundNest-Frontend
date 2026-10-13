// The Standard User interface now has a proper desktop layout, so the old
// "Optimized for mobile and tablet" notice is no longer shown. The function is kept
// (as a no-op) because the login and role-selection flows still call it right before
// navigating to /home.
export function showMobileOnlyToast() {}
