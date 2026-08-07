import { fetchWithAuth } from "../../../utils/fetchWithAuth";


const API_URL = import.meta.env.VITE_API_URL;

export async function getFoundReports() {
  const response = await fetchWithAuth(`${API_URL}/api/found-reports`);
  return response.json();
}

//done
export async function updateFoundReport(foundReportId, formData) {
  const response = await fetchWithAuth(
    `${API_URL}/api/found-reports/${foundReportId}`,
    {
      method: "PUT",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to update found report.");
  }

  return data;
}

// done
export async function claimFoundItem(foundReportId, formData) {
  const response = await fetchWithAuth(
    `${API_URL}/api/found-reports/${foundReportId}/claim`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to claim item.");
  }

  return data;
}

//done
export async function archiveFoundReport(foundReportId, body) {
  const response = await fetchWithAuth(
    `${API_URL}/api/found-reports/${foundReportId}/archive`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to archive report.");
  }

  return data;
}

// done
export async function restoreFoundReport(foundReportId, body) {
  const response = await fetchWithAuth(
    `${API_URL}/api/found-reports/${foundReportId}/restore`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to restore report.");
  }

  return data;
}

//done
export async function disposeFoundItem(formData) {
  const response = await fetchWithAuth(
    `${API_URL}/api/disposed-item`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to dispose item.");
  }

  return data;
}

// done
export async function searchLostReports(search) {
  const normalizedSearch = search
    .replace(/^rpt-/i, "")
    .replace(/^0+/, "");

  const response = await fetchWithAuth(
    `${API_URL}/api/lost-reports/search/rptlink?search=${normalizedSearch}`
  );

  return response.json();
}

export async function getItemHistory(itemId) {
  const response = await fetchWithAuth(
    `${API_URL}/api/item-history/${itemId}`
  );

  return response.json();
}

export async function getClaimRecord(foundReportId) {
  const response = await fetchWithAuth(
    `${API_URL}/api/claim-records/found-report/${foundReportId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch claim record.");
  }

  return response.json();
}

//done
export async function getDisposedDetails(foundReportId) {
  const response = await fetchWithAuth(
    `${API_URL}/api/disposed-item/${foundReportId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch disposed item details.");
  }

  return response.json();
}

//done
export async function analyzeItemImage(formData) {
  const response = await fetchWithAuth(
    `${API_URL}/api/gemini-item-listing/describe-item`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "AI analysis failed.");
  }

  return data;
}