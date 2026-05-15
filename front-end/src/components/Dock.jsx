import { Home, Map, Search, User, StickyNotePlus } from "lucide-react";
import { NavLink } from "react-router-dom";

export default function Dock() {
  return (
    <>
      <div className="dock dock-lg bg-white rounded-t-xl">

        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive
              ? "dock-active text-(--color-primary)"
              : "text-(--color-primary) opacity-60"
          }
        >

          <Home className="size-6" />
          <span className="dock-label">Home</span>

        </NavLink>

        <NavLink
          to="/map"
          className={({ isActive }) =>
            isActive
              ? "dock-active text-(--color-primary)"
              : "text-(--color-primary) opacity-60"
          }
        >
          <Map className="size-6" />
          <span className="dock-label">Map</span>
        </NavLink>

        {/* <NavLink
        to="/report"
        className={({ isActive }) =>
          isActive
            ? "dock-active text-[#990000]"
            : "text-[#990000]"
        }
      >
        <File className="size-6" />
        <span className="dock-label">Report</span>
      </NavLink> */}
        <div></div>

        <NavLink
          to="/find"
          className={({ isActive }) =>
            isActive
              ? "dock-active text-(--color-primary)"
              : "text-(--color-primary) opacity-60"
          }
        >
          <Search className="size-6" />
          <span className="dock-label">Find</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            isActive
              ? "dock-active text-(--color-primary)"
              : "text-(--color-primary) opacity-60"
          }
        >
          <User className="size-6" />
          <span className="dock-label">Profile</span>
        </NavLink>

        {/* Floating Report Button */}
        <NavLink
          to="/report"
          className={({ isActive }) => `
    absolute
    left-1/2
    -translate-x-1/2
    -top-6

    flex
    flex-col
    items-center
    justify-center

    w-20
    h-20

    rounded-full
    bg-white
    text-(--color-primary)

    shadow-xl
    border-4
    border-white

    transition-all duration-300
  `}
        >
          {({ isActive }) => (
            <>
              <StickyNotePlus
                className={`size-8 ${isActive ? "fill-current" : "opacity-60"}`}
              />
              <span className="text-xs mt-1">Report</span>
            </>
          )}
        </NavLink>

      </div>
    </>
  )
}