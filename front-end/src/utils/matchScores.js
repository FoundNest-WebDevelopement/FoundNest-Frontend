import { fetchWithAuth } from "./fetchWithAuth";

const API_URL = import.meta.env.VITE_API_URL;

// Like the native app, the match score and type come from the notification rows
// (/api/notifications/user/:id), so fill them into each match record that lacks them.
export async function fetchUserNotifications(userId) {
  if (!userId) return [];
  try {
    const res = await fetchWithAuth(`${API_URL}/api/notifications/user/${userId}`);
    const data = res.ok ? await res.json() : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function attachMatchScores(matches, notifications) {
  if (!matches.length || !notifications.length) return matches;

  const byMatch = new Map();
  const byFound = new Map();
  notifications.forEach((n) => {
    if (n.match_score_percentage == null && !n.match_type) return;
    if (n.match_id != null) byMatch.set(String(n.match_id), n);
    if (n.found_report_id != null) byFound.set(`${n.lost_report_id}:${n.found_report_id}`, n);
  });

  return matches.map((m) => {
    if (m.match_score_percentage != null && m.match_type) return m;
    const n = byMatch.get(String(m.match_id)) ?? byFound.get(`${m.lost_report_id}:${m.found_report_id}`);
    if (!n) return m;
    return {
      ...m,
      match_score_percentage: m.match_score_percentage ?? n.match_score_percentage,
      match_type: m.match_type ?? n.match_type,
      lost_item_image: m.lost_item_image ?? n.lost_item_image,
    };
  });
}
