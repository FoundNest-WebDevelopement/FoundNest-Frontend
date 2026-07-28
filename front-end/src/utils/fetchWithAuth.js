const API_URL = import.meta.env.VITE_API_URL;
import { shouldRefreshToken } from "./tokenExpirationChecker";


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