const API_URL = import.meta.env.VITE_API_URL;

export async function fetchWithAuth(url, options = {}) {
  let accessToken = localStorage.getItem("token");

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${accessToken}`,
  };

  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  let response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
      localStorage.clear();
      window.location.href = "/login";
      return response;
    }

    const refreshResponse = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshResponse.ok) {
      localStorage.clear();
      window.location.href = "/login";
      return response;
    }

    const { accessToken: newAccessToken } = await refreshResponse.json();
    localStorage.setItem("token", newAccessToken);

    const retryHeaders = {
      ...options.headers,
      Authorization: `Bearer ${newAccessToken}`,
    };

    if (!(options.body instanceof FormData)) {
      retryHeaders["Content-Type"] = "application/json";
    }

    response = await fetch(url, {
      ...options,
      headers: retryHeaders,
    });
  }

  return response;
}