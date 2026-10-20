import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import logo from "../assets/native/app-logo.png";
import Icon from "./Icon";
import Toast from "./Toast";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import SwitchBackButton from "../global-components/SwitchBackButton";
import ActingSuperAdminSwitcher from "../global-components/ActingSuperAdminSwitcher";
import { useUnsavedChangesGuard } from "../context/UnsavedChangesContext";

const API_URL = import.meta.env.VITE_API_URL;

// The white top bar the native app shows on the Home / Map / Report / Find / Profile
// tabs (CustomHeader): logo, screen title, spacer, notification bell with unread dot.
// On desktop (lg+) pages that would otherwise stack a red title bar under this header pass a
// `desktopTitle` (and optionally `onBack`) so the two are merged into this single white bar.
// `redDesktop` turns the bar red (white text / icons) from lg up.
export default function AppHeader({ title, desktopTitle, onBack, redDesktop = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { requestNavigation } = useUnsavedChangesGuard();
  const userId = localStorage.getItem("user_id");

  const [unreadCount, setUnreadCount] = useState(0);
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchUnreadCount = async () => {
      try {
        const res = await fetchWithAuth(`${API_URL}/api/notifications/unread-count/${userId}`);
        const data = await res.json();
        setUnreadCount(data.unreadCount ?? 0);
      } catch (err) {
        console.error(err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 2000);
    return () => clearInterval(interval);
  }, [userId]);

  const openNotifications = () => {
    if (location.pathname === "/notifications") return;
    const result = requestNavigation(() => navigate("/notifications"));
    if (result === "blocked") {
      toast.custom(() => <Toast message="Please wait until scanning finishes." solid />, { duration: 2000 });
    }
  };

  return (
    <div className={`sticky top-0 z-[4000] bg-white border-b border-black/5 ${redDesktop ? "lg:bg-primary lg:border-primary" : ""}`}>
      <div className="h-14 flex items-center px-[5px] lg:px-6">
        <div className="w-[65px] h-14 shrink-0 flex items-center justify-center overflow-hidden lg:hidden">
          <img src={logo} alt="FoundNest" className="w-[75px] h-[75px] max-w-none -mx-5 shrink-0 object-contain" />
        </div>

        {onBack && (
          <button type="button" onClick={onBack} aria-label="Back" className="hidden lg:flex items-center justify-center p-1 mr-2">
            <Icon name="arrow-back" size={24} color={redDesktop ? "#FFFFFF" : "#8B0000"} />
          </button>
        )}

        <p className={`text-[18px] font-bold leading-6 text-primary lg:text-[22px] lg:leading-[normal] ${redDesktop ? "lg:text-white" : ""}`}>
          <span className="lg:hidden">{title}</span>
          <span className="hidden lg:inline">{desktopTitle ?? title}</span>
        </p>

        <div className="flex-1" />

        {/* These render only for admins acting as an end user */}
        <ActingSuperAdminSwitcher />
        <SwitchBackButton />

        <button
          type="button"
          onClick={openNotifications}
          aria-label="Notifications"
          className="p-1.5 flex items-center justify-center"
        >
          <span className="relative">
            {redDesktop ? (
              <>
                <span className="lg:hidden flex">
                  <Icon name="notifications-outline" size={24} color="#8B0000" />
                </span>
                <span className="hidden lg:flex">
                  <Icon name="notifications-outline" size={24} color="#FFFFFF" />
                </span>
              </>
            ) : (
              <Icon name="notifications-outline" size={24} color="#8B0000" />
            )}
            {unreadCount > 0 && (
              <span className="absolute right-0.5 top-0.5 w-2 h-2 rounded-full bg-[#EF4444] border border-white lg:z-[1]" />
            )}
          </span>
        </button>
      </div>

      {!online && (
        <div className="flex items-center justify-center gap-1.5 py-[5px] bg-[#EF4444]">
          <Icon name="cloud-offline-outline" size={14} color="#FFFFFF" />
          <span className="text-white text-xs font-semibold">You're offline</span>
        </div>
      )}
    </div>
  );
}
