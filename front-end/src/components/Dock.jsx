import { MapPin, Search } from "lucide-react";
import { NavLink } from "react-router-dom";
import reportIconInactive from "../assets/report_icon_inactive.png";
import reportIconActive from "../assets/report_icon_active.png";

export default function Dock() {
  return (
    <>
      <div className="dock dock-sm bg-white rounded-t-xl shadow-[0_8px_10px_10px_rgba(0,0,0,0.25)] border-4 border-white z-[999]">
        <NavLink
          to="/home"
          className={({ isActive }) =>
            isActive ? "text-(--color-primary)" : "text-(--color-primary) opacity-60"
          }
        >
          {({ isActive }) => (
            <>
              {isActive ? (
                <i className="fa-solid fa-house text-(--color-primary) text-2xl"></i>
              ) : (
                <i className="fa-regular fa-house text-(--color-primary) text-2xl"></i>
              )}
              <span className="dock-label">Home</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/map"
          className={({ isActive }) =>
            isActive ? "text-(--color-primary)" : "text-(--color-primary) opacity-60"
          }
        >
          {({ isActive }) => (
            <>
              {isActive ? (
                <i className="fa-solid fa-location-dot text-2xl"></i>
              ) : (
                <MapPin className="size-10" />
              )}
              <span className="dock-label">Map</span>
            </>
          )}
        </NavLink>

        <div></div>

        <NavLink
          to="/find"
          className={({ isActive }) =>
            isActive ? "text-(--color-primary)" : "text-(--color-primary) opacity-60"
          }
        >
          {({ isActive }) => (
            <>
              {isActive ? (
                <Search className="size-6 stroke-3" />
              ) : (
                <Search className="size-6" />
              )}
              <span className="dock-label">Find</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            isActive ? "text-(--color-primary)" : "text-(--color-primary) opacity-60"
          }
        >
          {({ isActive }) => (
            <>
              {isActive ? (
                <i className="fa-solid fa-circle-user text-(--color-primary) text-2xl"></i>
              ) : (
                <i className="fa-regular fa-circle-user text-(--color-primary) text-2xl"></i>
              )}
              <span className="dock-label">Profile</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/report"
          className={() => `
            absolute left-1/2 -translate-x-1/2 -top-9
            flex flex-col items-center justify-center
            w-20 h-20 rounded-full bg-white text-(--color-primary)
            shadow-[0_12px_12px_rgba(0,0,0,0.15),0_-12px_12px_rgba(0,0,0,0.1)]
            border-4 border-white transition-all duration-300
          `}
        >
          {({ isActive }) => (
            <>
              {isActive ? (
                <img src={reportIconActive} alt="ReportIcon" className="h-9.5 ml-1" />
              ) : (
                <img src={reportIconInactive} alt="ReportIcon" className="h-9" />
              )}
              <span className={`text-xs mt-1 ${isActive ? "opacity-100" : "opacity-60"}`}>
                Report
              </span>
            </>
          )}
        </NavLink>
      </div>
    </>
  );
}