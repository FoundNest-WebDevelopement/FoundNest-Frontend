import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLabelWithReturn from "../components/PageLabelWithReturn.jsx";
import Loading from "../components/Loading.jsx";
import emptyImage from "../assets/empty_image.png";
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

/* -------------------------------------------------------------------------- */
/* UI pieces                                                                  */
/* -------------------------------------------------------------------------- */

function Spinner({ className = "h-4 w-4" }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-primary border-t-transparent ${className}`}
    />
  );
}

function NotificationItem({ notification, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(notification)}
      className="w-full flex items-center gap-4 text-left bg-white rounded-xl p-4 mb-3 shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
    >
      <i className="fa-solid fa-magnifying-glass text-[26px] text-primary w-7 text-center shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-base font-bold text-black truncate">
            {notification.title || "Match Found!"}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[#666]">{getTimeAgo(notification.created_at)}</span>
            {!notification.is_read && <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />}
          </div>
        </div>
        <p className="text-sm text-[#666] truncate">{notification.message}</p>
      </div>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center text-center pt-16 px-5">
      <img src={emptyImage} alt="nothing here yet" className="h-70" />
      <p className="text-lg font-bold text-[#555] mt-4">No notifications yet</p>
      <p className="text-sm text-[#888] leading-5 mt-2">
        When you get new alerts or matches, they'll show up here.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

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
    setNotifications((prev) =>
      prev.map((n) => (idSet.has(n.notification_id) ? { ...n, is_read: true } : n))
    );
  };

  const openNotification = (notification) => {
    const id = notification.notification_id;

    if (!notification.is_read) {
      markLocallyRead([id]);
      patchRead(id).catch((err) => console.error(err));
    }

    navigate(`/notifications/${notification?.lost_report_id}/verify`);
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    if (unread.length === 0) return;

    setMarkingAll(true);
    setActionError(null);

    const results = await Promise.allSettled(unread.map((n) => patchRead(n.notification_id)));

    // Only flip the ones the server actually confirmed
    const succeededIds = unread
      .filter((_, i) => results[i].status === "fulfilled")
      .map((n) => n.notification_id);
    markLocallyRead(succeededIds);

    if (succeededIds.length < unread.length) {
      setActionError("Some notifications couldn't be marked as read. Please try again.");
    }

    setMarkingAll(false);
  };


  const renderBody = () => {
    if (isLoading) return <Loading label="Please wait.." />;

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

    if (notifications.length === 0) return <EmptyState />;

    return notifications.map((notification) => (
      <NotificationItem
        key={notification.notification_id}
        notification={notification}
        onClick={openNotification}
      />
    ));
  };

  return (
    <>
      <PageLabelWithReturn label="Notifications" onClick={() => navigate(-1)} />

      <div className="bg-(--color-secondary) min-h-screen px-5 pt-5 pb-25">
        {/* Section row */}
        <div className="flex items-center justify-between mb-4 min-h-6">
          <p className="text-lg font-semibold text-black">Latest</p>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={markingAll}
              className="text-sm font-semibold text-primary disabled:opacity-70"
            >
              {markingAll ? <Spinner /> : "Mark All as Read"}
            </button>
          )}
        </div>

        {actionError && <p className="text-xs text-red-500 mb-3">{actionError}</p>}

        {renderBody()}
      </div>
    </>
  );
}