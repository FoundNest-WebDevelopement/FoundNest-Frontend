import logo from "../assets/logo.png";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import SwitchBackButton from "../global-components/SwitchBackButton";
import ActingSuperAdminSwitcher from "../global-components/ActingSuperAdminSwitcher";
import Toast from "./Toast";
import { useUnsavedChangesGuard } from "../context/UnsavedChangesContext";



export default function NotificationBar() {

  const navigate = useNavigate();
  const location = useLocation();
  const { requestNavigation } = useUnsavedChangesGuard();

  const API_URL = import.meta.env.VITE_API_URL;
  const [unreadCount, setUnreadCount] = useState(0);
  const userId = localStorage.getItem("user_id")

  const guardedClick = (to) => (e) => {
    if (to === location.pathname) return;
    e.preventDefault();
    const result = requestNavigation(() => navigate(to));
    if (result === "blocked") {
      toast.custom(() => <Toast message="Please wait until scanning finishes." solid />);
    }
  };

 useEffect(() => {
  if (!userId) return;

  const fetchUnreadCount = async () => {
    try {
      const res = await fetchWithAuth(
        `${API_URL}/api/notifications/unread-count/${userId}`
      );
      const data = await res.json();
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error(err);
    }
  };

  
  fetchUnreadCount();

  
  const interval = setInterval(fetchUnreadCount, 2000);

  return () => clearInterval(interval);
}, [userId]);

  return (
    <div className="flex w-full max-w-3xl shadow-sm fixed top-0 inset-x-0 mx-auto bg-white z-4000 py-2">

      <div className="navbar-start">
        <img
          src={logo}
          alt="FoundNest Logo"
          className="h-9 w-10 object-contain mx-2"
        />

        <button className="text-md text-(--color-primary) font-semibold w-fit">
          FoundNest
        </button>
      </div>

      <div className="navbar-end mx-2 flex items-center gap-2">
        <ActingSuperAdminSwitcher />
        <SwitchBackButton />

        <NavLink
          to="/notifications"
          onClick={guardedClick("/notifications")}
          className={({ isActive }) =>
            isActive
              ? "text-(--color-primary)"
              : "text-(--color-primary)"
          }
        >

          {({ isActive }) =>
            isActive ? (
              <Bell className="size-6 fill-current transition-transform duration-100 ease-out enabled:active:scale-90" />
            ) :
              <div className="relative ">
                <Bell className="size-6 " />

                {unreadCount > 0 && (
                  <i className="fa-solid fa-circle text-(--color-quaternary) text-[10px] ml-2 absolute top-0 right-0"></i>
                )}
              </div>

          }
        </NavLink>
      </div>

    </div>
  );
}