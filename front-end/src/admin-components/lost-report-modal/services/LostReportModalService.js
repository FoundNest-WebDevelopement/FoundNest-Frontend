import { fetchWithAuth } from "../../../utils/fetchWithAuth";


const API_URL = import.meta.env.VITE_API_URL;

export async function updateLostReport(id, formData) {
    const response = await fetchWithAuth(
        `${API_URL}/api/lost-reports/${id}`,
        {
            method: "PUT",
            body: formData,
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to update lost report.");
    }

    return data;
}

export async function resolveLostReport(id, adminFullName) {
    const response = await fetchWithAuth(
                `${API_URL}/api/lost-reports/${id}/resolve`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        admin_full_name: adminFullName,
                    }),
                }
            );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to resolve lost report.");
    }

    return data;
}


export async function getLostReports() {
    const response = await fetchWithAuth(
        `${API_URL}/api/lost-reports`
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to fetch lost reports.");
    }

    return data;
}