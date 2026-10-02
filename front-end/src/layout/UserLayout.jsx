import { Outlet } from "react-router-dom";
import Dock from "../components/Dock";
import NotificationBar from "../components/NotificatioBar";
import { UnsavedChangesProvider } from "../context/UnsavedChangesContext";


function UserLayout() {
    return (
        <UnsavedChangesProvider>
            <div>
                <NotificationBar />

                <div className="max-w-3xl mx-auto w-full">
                    <Outlet />
                </div>

                <Dock />
            </div>
        </UnsavedChangesProvider>
    );
}

export default UserLayout;