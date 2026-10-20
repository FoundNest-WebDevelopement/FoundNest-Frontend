import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Icon from "./Icon";
import Toast from "./Toast";
import { useUnsavedChangesGuard } from "../context/UnsavedChangesContext";

const ACTIVE = "#8B0000"; // AppColors.activeIcon
const INACTIVE = "#A55D5D"; // AppColors.inactiveIcon / label

function SideTab({ label, icon, selected, onClick, to }) {
  return (
    <a
      href={to}
      onClick={onClick}
      aria-current={selected ? "page" : undefined}
      className="flex-1 min-w-0 flex flex-col items-center justify-end py-1"
    >
      <Icon name={icon} size={24} color={selected ? ACTIVE : INACTIVE} />
      <span className="mt-px text-[11px] font-medium leading-[15px]" style={{ color: INACTIVE }}>
        {label}
      </span>
    </a>
  );
}

// Custom bottom tab bar of the native app: white bar with 22px top corners, four side
// tabs and a 72px floating "Report" button sitting above the bar.
export default function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { requestNavigation } = useUnsavedChangesGuard();
  const path = location.pathname;

  const guardedClick = (to) => (e) => {
    e.preventDefault();
    if (to === path) return;
    const result = requestNavigation(() => navigate(to));
    if (result === "blocked") {
      toast.custom(() => <Toast message="Please wait until scanning finishes." solid />, { duration: 2000 });
    }
  };

  const isHome = path === "/home";
  const isMap = path === "/map";
  const isFind = path === "/find";
  const isProfile = path === "/profile";
  const isReport = path === "/report";

  return (
    <div className="fixed inset-x-0 bottom-0 z-[4000] max-w-3xl mx-auto pb-[max(1px,env(safe-area-inset-bottom))]">
      <div
        className="relative bg-white rounded-t-[22px] pt-[11px] pb-2"
        style={{ boxShadow: "0 -2px 6px rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-end justify-between px-1.5">
          <SideTab label="Home" to="/home" icon={isHome ? "home" : "home-outline"} selected={isHome} onClick={guardedClick("/home")} />
          <SideTab label="Map" to="/map" icon="map-outline" selected={isMap} onClick={guardedClick("/map")} />
          <div className="w-[72px] shrink-0" />
          <SideTab label="Find" to="/find" icon="search-outline" selected={isFind} onClick={guardedClick("/find")} />
          <SideTab label="Profile" to="/profile" icon="person-circle-outline" selected={isProfile} onClick={guardedClick("/profile")} />
        </div>

        <div className="absolute inset-x-0 -top-6 flex justify-center pointer-events-none">
          <a
            href="/report"
            onClick={guardedClick("/report")}
            aria-current={isReport ? "page" : undefined}
            aria-label="Report"
            className="pointer-events-auto w-[72px] h-[72px] rounded-full bg-white flex flex-col items-center justify-center active:opacity-90"
            style={{ boxShadow: "0 4px 8px rgba(0,0,0,0.12)" }}
          >
            <span className="relative w-9 h-8 flex items-center justify-center">
              <Icon name="document-text-outline" size={28} color={isReport ? ACTIVE : INACTIVE} />
              <span className="absolute -right-1 -bottom-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                <Icon name="add" size={12} color={isReport ? ACTIVE : INACTIVE} />
              </span>
            </span>
            <span className="mt-0.5 text-[11px] font-medium leading-[15px]" style={{ color: INACTIVE }}>
              Report
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
