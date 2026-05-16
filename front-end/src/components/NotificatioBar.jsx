import logo from "../assets/logo.png";
import { NavLink } from "react-router-dom";
import { Bell } from "lucide-react";

export default function NotificationBar() {
  return (
    <div className="flex w-full shadow-sm fixed top-0 left-0 bg-white z-100 py-2">

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

      <div className="navbar-end mx-2">
        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            isActive
              ? "text-(--color-primary)"
              : "text-(--color-primary)"
          }
        >

          {({ isActive }) =>
            isActive ? (
              <Bell className="size-6 fill-current" />
            ) :
              <Bell className="size-6" />
          }
        </NavLink>
      </div>

    </div>
  );
}