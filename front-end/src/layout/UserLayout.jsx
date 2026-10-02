import { Outlet } from "react-router-dom";
import Dock from "../components/Dock";
import NotificationBar from "../components/NotificatioBar";


function UserLayout() {
    return (
        <div>
            <NotificationBar />

            <div className="max-w-3xl mx-auto w-full">
                <Outlet />
            </div>

            <Dock />
        </div>
    );
}

export default UserLayout;