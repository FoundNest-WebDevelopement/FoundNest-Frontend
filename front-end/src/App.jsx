import Dock from "./components/Dock";
import Home from "./pages/Home";
import Map from "./pages/Map";
import Report from "./pages/Report";
import Find from "./pages/Find";
import Profile from "./pages/Profile";
import Notification from "./pages/Notification";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import NotificationBar from "./components/NotificatioBar";
import FoundItemDetails from "./pages/FoundItemDetails";
import NotificationDetails from "./pages/NotificationDetails";
import Admin from "./Admin";
import AdminRoute from "./components/AdminRoute";
import UserRoute from "./components/UserRoute";
import SuperAdmin from "./SuperAdmin";
import SuperAdminRoute from "./components/SuperAdminRoute";
import ReportHistory from "./pages/ReportHistory";
import MatchDetails from "./pages/MacthDetails";
import VerifyMatch from "./pages/VerifyMatch";
import NotFoundPage from "./pages/NotFoundPage";
import UserLayout from "./layout/UserLayout";


// hide the dock and notif from landingpage, log, reg page
function Layout() {
  const location = useLocation();
  const hideNav =
    ["/", "/login", "/register", "/forgot-password"].includes(
      location.pathname
    ) ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/super_admin");
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route element={<UserRoute />}>
          <Route element={<UserLayout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/map" element={<Map />} />
            <Route path="/report" element={<Report />} />
            <Route path="/report/:id" element={<Report />} />
            <Route path="/report/:id/:reportId" element={<Report />} />
            <Route path="/report/:id/mode/:mode" element={<Report />} />
            <Route
              path="/report/:id/mode/:mode/:reportId"
              element={<Report />}
            />

            <Route path="/find" element={<Find />} />
            <Route path="/find/:id" element={<FoundItemDetails />} />

            <Route path="/profile" element={<Profile />} />
            <Route
              path="/profile/report-history/:id"
              element={<ReportHistory />}
            />
            <Route
              path="/profile/match-details/:id"
              element={<MatchDetails />}
            />
            <Route
              path="/profile/match-details/:id/:reportId"
              element={<MatchDetails />}
            />

            <Route path="/notifications" element={<Notification />} />
            <Route
              path="/notifications/:id"
              element={<NotificationDetails />}
            />
            <Route
              path="/notifications/:id/verify"
              element={<VerifyMatch />}
            />
          </Route>
        </Route>

        {/* Admin Route */}
        <Route element={<AdminRoute />}>
          <Route path="/admin/*" element={<Admin />} />
        </Route>

        {/* Super Admin Route */}
        <Route element={<SuperAdminRoute />}>
          <Route path="/super_admin/*" element={<SuperAdmin />} />
        </Route>

        <Route path="/*" element={<NotFoundPage />}></Route>
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;
