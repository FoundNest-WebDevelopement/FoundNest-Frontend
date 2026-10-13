import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import logo from "../assets/native/app-logo.png";
import Icon from "./Icon";
import Toast from "./Toast";
import AlertDialog from "../components/AlertDialog";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { useUnsavedChangesGuard } from "../context/UnsavedChangesContext";

const API_URL = import.meta.env.VITE_API_URL;

// Desktop-only replacement for the bottom TabBar (shown from the `lg` breakpoint up).
// Same destinations and unsaved-changes guard as the native tab bar, laid out like
// the Admin side menu: a fixed left column with the brand on top.
const ITEMS = [
  { label: "Home", to: "/home", icon: "home-outline", activeIcon: "home", match: /^\/home$/ },
  { label: "Map", to: "/map", icon: "map-outline", match: /^\/map$/ },
  { label: "Report", to: "/report", icon: "document-text-outline", match: /^\/report(\/|$)/ },
  { label: "Find", to: "/find", icon: "search-outline", match: /^\/find(\/|$)/ },
  { label: "Profile", to: "/profile", icon: "person-circle-outline", match: /^\/profile(\/|$)/ },
];

export default function SideNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { requestNavigation } = useUnsavedChangesGuard();
  const [showLogout, setShowLogout] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Same sign-out as the Profile screen has on mobile
  const handleLogout = async () => {
    setShowLogout(false);
    try {
      setIsLoggingOut(true);
      const refreshToken = localStorage.getItem("refreshToken");
      await fetchWithAuth(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoggingOut(false);
      const rememberedEmail = localStorage.getItem("remembered_email");
      localStorage.clear();
      if (rememberedEmail) localStorage.setItem("remembered_email", rememberedEmail);
      navigate("/");
    }
  };

  const go = (to) => (e) => {
    e.preventDefault();
    if (to === pathname) return;
    const result = requestNavigation(() => navigate(to));
    if (result === "blocked") {
      toast.custom(() => <Toast message="Please wait until scanning finishes." solid />, { duration: 1500 });
    }
  };

  return (
    <aside
      aria-label="Main navigation"
      className="hidden lg:flex fixed top-0 left-0 bottom-0 w-60 z-[4100] flex-col bg-white border-r border-black/[0.06]"
    >
      <div className="h-[57px] shrink-0 flex items-center gap-1 pl-3 pr-4 border-b border-black/5">
        <img src={logo} alt="" className="w-14 h-14 object-contain" />
        <span className="text-[20px] font-extrabold text-primary">FoundNest</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {ITEMS.map((item) => {
          const selected = item.match.test(pathname);
          return (
            <a
              key={item.to}
              href={item.to}
              onClick={go(item.to)}
              aria-current={selected ? "page" : undefined}
              className={`flex items-center gap-4 h-12 pl-6 pr-4 border-l-[3px] text-[15px] transition-colors ${
                selected
                  ? "border-primary bg-primary/[0.06] font-bold text-primary"
                  : "border-transparent font-medium text-[#6B5A52] hover:bg-black/[0.03]"
              }`}
            >
              <Icon
                name={selected && item.activeIcon ? item.activeIcon : item.icon}
                size={24}
                color={selected ? "#8B0000" : "#A55D5D"}
              />
              {item.label}
            </a>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => setShowLogout(true)}
        className="shrink-0 flex items-center gap-4 h-14 pl-6 pr-4 border-t border-black/[0.06] text-[15px] font-semibold text-[#C0392B] hover:bg-black/[0.03] text-left"
      >
        <Icon name="log-out-outline" size={24} color="#C0392B" />
        Log out
      </button>

      {showLogout && (
        <AlertDialog
          message="Are you sure you want to sign out of your account?"
          b1Label="Cancel"
          b2Label={isLoggingOut ? "Logging out..." : "Log out"}
          b1OnClick={() => setShowLogout(false)}
          b2OnClick={handleLogout}
        />
      )}
    </aside>
  );
}
