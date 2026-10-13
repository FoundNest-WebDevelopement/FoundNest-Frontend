import { Navigate, Outlet } from "react-router-dom";

export default function UserRoute() {
  const role = localStorage.getItem("role");

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  switch (role) {
    case "user":
      return <Outlet />;

    case "admin":
      return <Navigate to="/admin" replace />;

    case "super_admin":
      return <Navigate to="/super_admin" replace />;

    default:
      return <Navigate to="/login" replace />;
  }
}