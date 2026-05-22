import Dock from "./components/Dock"
import Home from "./pages/Home";
import Map from "./pages/Map";
import Report from "./pages/Report";
import Find from "./pages/Find";
import Profile from "./pages/Profile";
import Notification from "./pages/Notification";



import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotificationBar from "./components/NotificatioBar";


function App() {


  return (
    <>
    
     <BrowserRouter>
      <NotificationBar/>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<Map />} />
        <Route path="/report" element={<Report />} />
        <Route path="/find" element={<Find />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notification />} />
      </Routes>
        <Dock/>
    </BrowserRouter>
    </>
  )
}

export default App
