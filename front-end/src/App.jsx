import Dock from "./components/Dock"
import Home from "./pages/Home";
import Map from "./pages/Map";
import Report from "./pages/Report";
import Find from "./pages/Find";
import Profile from "./pages/Profile";
import Notification from "./pages/Notification";
import LandingPage from "./pages/LandingPage";

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import NotificationBar from "./components/NotificatioBar";

// hide the dock and notif from landingpage, log, reg page
function Layout() {
  const location = useLocation();
  const hideNav = ['/', '/login', '/register'].includes(location.pathname);

  return (
    <>
      {!hideNav && <NotificationBar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/map" element={<Map />} />
        <Route path="/report" element={<Report />} />
        <Route path="/find" element={<Find />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notification />} />
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