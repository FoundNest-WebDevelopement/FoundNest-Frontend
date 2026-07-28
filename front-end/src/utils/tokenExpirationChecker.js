import { jwtDecode } from "jwt-decode";

export function shouldRefreshToken(token) {
  if (!token) return true;

  try {
    const { exp } = jwtDecode(token);

    const expiresAt = exp * 1000;
    const now = Date.now();

    // Refresh if less than 60 seconds remain
    return expiresAt - now < 60_000;
  } catch {
    return true;
  }
}