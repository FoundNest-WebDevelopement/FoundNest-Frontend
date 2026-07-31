import { Navigate, Outlet } from "react-router-dom";

export default function AdminRoute() {
  const role = localStorage.getItem("role");

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (role !== "admin" && role !== "super_admin") {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}