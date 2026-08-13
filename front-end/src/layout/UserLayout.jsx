import { Outlet } from "react-router-dom";
import Dock from "../components/Dock";
import NotificationBar from "../components/NotificatioBar";


function UserLayout() {
    return (
        <div>
            <NotificationBar />

            <Outlet />

            <Dock />
        </div>
    );
}

export default UserLayout;