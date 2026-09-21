import { Navigate, Outlet } from "react-router-dom";

export default function AdminRoute() {
  const role = localStorage.getItem("role");

  if (!role) {
    return <Navigate to="/login" replace />;
  }


  if (role !== "admin") {
    return role === "super_admin"
      ? <Navigate to="/super_admin" replace />
      : <Navigate to="/home" replace />;
  }

  const officeId = localStorage.getItem("office_location");
  const hasValidOffice = officeId && officeId !== "null" && officeId !== "undefined";

  if (!hasValidOffice) {
   
    const rememberedEmail = localStorage.getItem("remembered_email");
    localStorage.clear();
    if (rememberedEmail) localStorage.setItem("remembered_email", rememberedEmail);
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}