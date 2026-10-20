import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StackHeader from "../user-native/StackHeader";
import Icon from "../user-native/Icon";
import { fetchWithAuth } from "../utils/fetchWithAuth";

const API_URL = import.meta.env.VITE_API_URL;

const getTimeAgo = (dateString) => {
  if (!dateString) return "Just now";

  const diffMins = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);
  const plural = (n, unit) => `${n} ${unit}${n === 1 ? "" : "s"} ago`;

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return plural(diffMins, "minute");
  if (diffHrs < 24) return plural(diffHrs, "hour");
  if (diffDays < 30) return plural(diffDays, "day");
  if (diffDays < 365) return plural(Math.floor(diffDays / 30), "month");
  return plural(Math.floor(diffDays / 365), "year");
};

// Throws on non-2xx so callers can tell success from failure
const patchRead = async (id) => {
  const res = await fetchWithAuth(`${API_URL}/api/notifications/${id}/read`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error(`Failed to mark notification ${id} as read (${res.status})`);
};

function NotificationItem({ notification, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(notification)}
      className="w-full flex items-center text-left bg-white rounded-xl p-4 mb-3 active:opacity-80"
      style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
    >
      <span className="mr-4 flex items-center justify-center">
        <Icon family="mci" name="magnify" size={28} color="#900014" />
      </span>

      <span className="flex-1 min-w-0">
        <span className="flex items-center justify-between mb-1 gap-2">
          <span className="text-[16px] font-bold text-black truncate">{notification.title || "Match Found!"}</span>
          <span className="flex items-center gap-2 shrink-0">
            <span className="text-[12px] text-[#666666]">{getTimeAgo(notification.created_at)}</span>
            {!notification.is_read && <span className="w-2.5 h-2.5 rounded-full bg-[#FACC15]" />}
          </span>
        </span>
        <span className="block text-[14px] text-[#666666] truncate">
          A potential match for your {notification.lost_item_name || "item"}...
        </span>
      </span>
    </button>
  );
}

export default function Notification() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");

  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Derived, so it can never drift out of sync with the list
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetchWithAuth(`${API_URL}/api/notifications/user/${userId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
      }

      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markLocallyRead = (ids) => {
    const idSet = new Set(ids);
    setNotifications((prev) => prev.map((n) => (idSet.has(n.notification_id) ? { ...n, is_read: true } : n)));
  };

  const openNotification = (notification) => {
    const id = notification.notification_id;

    if (!notification.is_read) {
      markLocallyRead([id]);
      patchRead(id).catch((err) => console.error(err));
    }

    // Like the native app, a notification opens the comparison of its match
    if (notification.match_id) {
      navigate(`/profile/match-details/${notification.match_id}`);
    } else {
      navigate(`/notifications/${notification?.lost_report_id}/verify`);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    if (unread.length === 0) return;

    setMarkingAll(true);
    setActionError(null);

    const results = await Promise.allSettled(unread.map((n) => patchRead(n.notification_id)));

    // Only flip the ones the server actually confirmed
    const succeededIds = unread.filter((_, i) => results[i].status === "fulfilled").map((n) => n.notification_id);
    markLocallyRead(succeededIds);

    if (succeededIds.length < unread.length) {
      setActionError("Some notifications couldn't be marked as read. Please try again.");
    }

    setMarkingAll(false);
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center mt-10">
          <div className="w-9 h-9 border-[3px] border-[#900014] border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center gap-3 py-10">
          <p className="text-sm text-red-500 text-center">{error}</p>
          <button
            type="button"
            onClick={fetchNotifications}
            className="border border-primary rounded-lg h-10 px-6 text-primary bg-white text-xs"
          >
            Try again
          </button>
        </div>
      );
    }

    if (notifications.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center pt-10 px-5 min-h-[50vh]">
          <p className="text-[18px] font-bold text-[#555555] mt-4">No notifications yet</p>
          <p className="text-[14px] text-[#888888] text-center mt-2 leading-5">
            When you get new alerts or matches, they'll show up here.
          </p>
        </div>
      );
    }

    return (
      <div className="pb-5">
        {notifications.map((notification) => (
          <NotificationItem key={notification.notification_id} notification={notification} onClick={openNotification} />
        ))}
      </div>
    );
  };

  return (
    <div className="narrow-body bg-[#FAF0DE] min-h-screen flex flex-col">
      <StackHeader title="Notifications" height={56} onBack={() => navigate(-1)} />

      <div className="flex-1 px-5 pt-5 lg:pt-8">
        <div className="flex items-center justify-between mb-4 min-h-[22px]">
          <p className="text-[18px] font-semibold text-black">Latest</p>

          {unreadCount > 0 && (
            <button type="button" onClick={markAllAsRead} disabled={markingAll} className="active:opacity-70">
              {markingAll ? (
                <span className="inline-block w-4 h-4 border-2 border-[#900014] border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-[14px] font-semibold text-[#900014]">Mark All as Read</span>
              )}
            </button>
          )}
        </div>

        {actionError && <p className="text-xs text-red-500 mb-3">{actionError}</p>}

        {renderBody()}
      </div>
    </div>
  );
}
