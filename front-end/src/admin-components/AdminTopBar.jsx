import icon from "../assets/lfms_icon.png";
import { NavLink } from "react-router-dom";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import AdminNotificationDropdown from "./AdminNotificationDropdown";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import SwitchBackButton from "../global-components/SwitchBackButton";

export default function AdminTopBar({ tabName }) {
  const API_URL = import.meta.env.VITE_API_URL;
  const fullName =
    localStorage.getItem("first_name") +
    " " +
    localStorage.getItem("last_name");
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const userId = localStorage.getItem("user_id");
  const role = localStorage.getItem("role");
  const officeLocation = localStorage.getItem("office_name") || "Office Admin";

  useEffect(() => {
    if (!userId) return;

    const loadNotifications = async () => {
      await fetchNotifications();
    };

    loadNotifications();

    const interval = setInterval(loadNotifications, 10000);

    return () => clearInterval(interval);
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      const params = new URLSearchParams();

      if (userId) params.append("userId", userId);

      const [response, count] = await Promise.all([
        fetchWithAuth(
          `${API_URL}/api/notifications/admin?${params.toString()}`,
        ),
        getAdminUnreadNotificationCount(),
      ]);

      const data = await response.json();

      setNotifications(data);
      setUnreadCount(count);
    } catch (err) {
      console.error(err);
    }
  };

  const getAdminUnreadNotificationCount = async () => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}/api/notifications/admin/unread/${userId}`,
      );

      const data = await response.json();

      return data.unreadCount;
    } catch (err) {
      console.error(err);
      return 0;
    }
  };

  const markAdminNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}/api/notifications/admin/${notificationId}/read/${userId}`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      await fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAdminNotificationsAsRead = async () => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}/api/notifications/admin/read-all/${userId}`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }

      await fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="h-full w-full bg-white flex">
        <div className="h-full w-60 bg-primary ">
          <div className="h-full w-full flex items-center justify-start px-4 gap-2 ">
            <div className="bg-(--color-quaternary) w-fit h-fit p-1 rounded-md ">
              <img src={icon} alt="LFMS Icon" className="h-8" />
            </div>
            <div className="flex flex-col">
              <p className="text-md font-bold text-(--color-quaternary)">
                FoundNest
              </p>
              <p className="text-xs text-white ">{officeLocation}</p>
            </div>
          </div>
          <hr className="border border-white/12 opacity-30" />
        </div>
        <div className="h-full flex-1 shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] flex items-center justify-between p-4">
          <div className="font-semibold text-xl">
            <p>{tabName}</p>
          </div>
          <div className="flex items-center gap-2 ">
            <div className="relative group flex items-center justify-center">
              <button
                className={`text-primary outline-none relative cursor-pointer
            `}
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                }}
              >
                {isNotifOpen ? (
                  <Bell className="size-6 fill-current" strokeWidth={2.5} />
                ) : (
                  <Bell className="size-6" strokeWidth={2} />
                )}

                {unreadCount > 0 && (
                  <div className="absolute -top-2 left-3 p-0.5 px-1 bg-(--color-quaternary) rounded-full">
                    <p className="text-black text-[9px] font-semibold">
                      {unreadCount}
                    </p>
                  </div>
                )}
              </button>
              {isNotifOpen && (
                <AdminNotificationDropdown
                  notifications={notifications}
                  setIsNotifOpen={setIsNotifOpen}
                  markAllAsRead={markAllAdminNotificationsAsRead}
                  markAdminNotificationAsRead={markAdminNotificationAsRead}
                  notifCount={unreadCount}
                />
              )}
            </div>
            <SwitchBackButton /> {/* ← added here */}
            <div className="flex items-center justify-center p-2 rounded-xl gap-2 border-3 border-[#F9ECEC] bg-[#F9ECEC]/30">
              <i className="fa-regular fa-circle-user text-[#1A1208] text-2xl"></i>
              <p className="text-sm text-[#1A1208]">{fullName}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
