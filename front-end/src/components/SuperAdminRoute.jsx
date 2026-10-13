import { Navigate, Outlet } from "react-router-dom";

export default function SuperAdminRoute() {
  const role = localStorage.getItem("role");

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "super_admin") {
    return role === "admin"
      ? <Navigate to="/admin" replace />
      : <Navigate to="/home" replace />;
  }

  return <Outlet />;
}