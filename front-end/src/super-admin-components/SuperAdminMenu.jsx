
import { LayoutDashboard, Users, Settings, FileText, Scroll, UserRoundCog } from "lucide-react"
import { NavLink, useNavigate } from "react-router-dom"
import { LogOut } from "lucide-react"
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { useState } from "react";
import AdminConfirmDialog from "../admin-components/AdminConfirmDialog";

export default function SuperAdminMenu({onChange}){

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const [openConfirmLogout, setOpenConfirmLogout] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);



 const handleLogout = async () => {
  try {
    setIsLoggingOut(true)
    const refreshToken =
      localStorage.getItem("refreshToken");

    await fetchWithAuth(
      `${API_URL}/api/auth/logout`,
      {
        method: "POST",
        body: JSON.stringify({
          refreshToken,
        }),
      }
    );
  } catch (err) {
    console.error(err);
 } finally {
    const rememberedEmail = localStorage.getItem("remembered_email");
    localStorage.clear();
    if (rememberedEmail) {
        localStorage.setItem("remembered_email", rememberedEmail);
    }
    navigate("/login");
    setIsLoggingOut(false)
}
};

  const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/super_admin" },
  { label: "User Management", icon: Users, path: "/super_admin/user_management" },
  { label: "Global Configuration", icon: Settings, path: "/super_admin/global_configuration" },
  { label: "System Reports", icon: FileText, path: "/super_admin/system_reports" },
  { label: "Action Logs", icon: Scroll, path: "/super_admin/action_logs" },
  { label: "Super Admin Profile", icon: UserRoundCog, path: "/super_admin/super_admin_profile" }
];
    return(
        <>
<nav className="flex flex-col w-60 h-full">
  <div className="flex flex-col gap-0.5">
    {navItems.map(({ label, icon: Icon, path }) => (
      <NavLink
        key={path}
        to={path}
        end={path === "/super_admin"}
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
  onClick={()=>setOpenConfirmLogout(true)}
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
 {openConfirmLogout &&
       <AdminConfirmDialog
         title="Logout"
         description={"Are you sure you want to log out?"}
         cancelText="Cancel"
         disabled = {isLoggingOut}
         confirmText={isLoggingOut? "Logging out..." : "Logout"}
         onClose={()=>setOpenConfirmLogout(false)}
         onConfirm={handleLogout}
       />
       }

        </>

      
    )
}