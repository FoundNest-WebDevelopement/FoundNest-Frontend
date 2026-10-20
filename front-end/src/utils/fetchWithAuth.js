const API_URL = import.meta.env.VITE_API_URL;
import { shouldRefreshToken } from "./tokenExpirationChecker";


// Clears the session (keeping the "remember me" e-mail) and lands on /login
// with a ?notice= the login page turns into a toast.
function forceLogout(notice) {
  const rememberedEmail = localStorage.getItem("remembered_email");
  localStorage.clear();
  if (rememberedEmail) localStorage.setItem("remembered_email", rememberedEmail);
  window.location.href = `/login?notice=${notice}`;
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) return null;

  const response = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    // A locked Standard User account is told why instead of a silent logout
    const lockedUser =
      response.status === 403 &&
      localStorage.getItem("role") === "user" &&
      (await response.clone().json().catch(() => null))?.code === "ACCOUNT_LOCKED";

    if (lockedUser) {
      forceLogout("account_locked");
      return null;
    }

    if ((await response.clone().json().catch(() => null))?.code === "ROLE_CHANGED") {
      forceLogout("role_changed");
      return null;
    }

    localStorage.clear();
    window.location.href = "/login";
    return null;
  }

  const { accessToken } = await response.json();

  localStorage.setItem("token", accessToken);

  return accessToken;
}

export async function fetchWithAuth(url, options = {}) {
  let accessToken = localStorage.getItem("token");

  if (shouldRefreshToken(accessToken)) {
    accessToken = await refreshAccessToken();

    if (!accessToken) {
      throw new Error("Unable to refresh token");
    }
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${accessToken}`,
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  let response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 403) {
    const body = await response.clone().json().catch(() => null);
    // Standard Users only: Admin / Super Admin sessions keep their existing behaviour
    if (body?.code === "ACCOUNT_LOCKED" && localStorage.getItem("role") === "user") {
      forceLogout("account_locked");
      return response;
    }
    // Any role, e.g. a Super Admin whose privileges were transferred from another device
    if (body?.code === "ROLE_CHANGED") {
      forceLogout("role_changed");
      return response;
    }
    if (body?.code === "OFFICE_INACTIVE") {
      const rememberedEmail = localStorage.getItem("remembered_email");
      localStorage.clear();
      if (rememberedEmail) localStorage.setItem("remembered_email", rememberedEmail);
      window.location.href = "/login?notice=office_inactive";
      return response;
    }
  }

  if (response.status === 401) {
    accessToken = await refreshAccessToken();

    if (!accessToken) {
      return response;
    }

    response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  return response;
}