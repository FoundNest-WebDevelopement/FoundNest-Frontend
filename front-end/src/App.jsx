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

// hide the dock and notif from landingpage, log, reg page
function Layout() {
  const location = useLocation();
  const hideNav = ["/", "/login", "/register", "/forgot-password"].includes(
    location.pathname,
  );
  return (
    <>
      {!hideNav && <NotificationBar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/map" element={<Map />} />
        <Route path="/report" element={<Report />} />
        <Route path="/find" element={<Find />} />
        <Route path="/find/:id" element={<FoundItemDetails/>} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notification />} />
        <Route path="/notifications/:id" element={<NotificationDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
      {!hideNav && <Dock />}
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
