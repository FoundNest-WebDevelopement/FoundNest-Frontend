
import { LayoutDashboard, Package, FileChartColumnIncreasing, Building2, MessageSquare, Repeat, UserRoundCog } from "lucide-react"
import { NavLink, useNavigate } from "react-router-dom"
import { LogOut } from "lucide-react"
import { fetchWithAuth } from "../utils/fetchWithAuth";

export default function Menu({onChange}){

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;



 const handleLogout = async () => {
  try {
    const refreshToken =
      localStorage.getItem("refreshToken");

    await fetchWithAuth(
      `${API_URL}/api/auth/logout`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken,
        }),
      }
    );
  } catch (err) {
    console.error(err);
  } finally {
    localStorage.clear();
    navigate("/login");
  }
};

  const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Item Management", icon: Package, path: "/admin/item_management" },
  { label: "Report Management", icon: FileChartColumnIncreasing, path: "/admin/report_management" },
  { label: "Center Profile", icon: Building2, path: "/admin/center_profile" },
  { label: "Feedbacks", icon: MessageSquare, path: "/admin/feedbacks" },
  { label: "Transactions", icon: Repeat, path: "/admin/transactions" },
  { label: "Admin Profile", icon: UserRoundCog, path: "/admin/admin_profile" }
];
    return(
        <>
<nav className="flex flex-col w-60 h-full">
  <div className="flex flex-col gap-0.5">
    {navItems.map(({ label, icon: Icon, path }) => (
      <NavLink
        key={path}
        to={path}
        end={path === "/admin"}
        onClick={() => onChange(label)}
        className={({ isActive }) =>
          `relative flex gap-3 py-2 text-xs w-full h-12 items-center
           overflow-hidden transition-colors duration-100 font-medium
           ${
             isActive
               ? "bg-[#8D1919] text-(--color-quaternary)"
               : "text-white hover:bg-white/5 hover:text-slate-200"
           }`
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span className="absolute left-0 top-0 bottom-0 w-1 bg-(--color-quaternary) rounded-r" />
            )}
            <Icon size="20" className="shrink-0 ml-5" />
            {label}
          </>
        )}
      </NavLink>
    ))}
  </div>

  <button
  onClick={handleLogout}
  className="
    mt-auto h-12 text-white bg-[#5C0000]
    flex gap-5 items-center
    transition-transform duration-100
    active:bg-[#5C0000]/50
  "
>
  <LogOut size={20} className="ml-5" />
  <span className="text-sm">Logout</span>
</button>
</nav>

        </>
    )
}