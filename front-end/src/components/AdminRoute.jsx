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

  return <Outlet />;
}