
import { LayoutDashboard, Package, FileChartColumnIncreasing, Building2, MessageSquare, Repeat, UserRoundCog } from "lucide-react"
import { NavLink } from "react-router-dom"

export default function Menu({onChange}){

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

                  <nav className="flex flex-col gap-0.5 w-60 ">
  {navItems.map(({ label, icon: Icon, path }) => (
    <NavLink
      key={path}
          to={path}
          end={path === "/admin"}
          onClick={() => onChange(label)}
      className={({ isActive }) =>
        `relative flex gap-3 py-2 text-xs w-full h-12 items-center
         overflow-hidden transition-colors duration-100 font-medium
         ${isActive
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
</nav>

        </>
    )
}