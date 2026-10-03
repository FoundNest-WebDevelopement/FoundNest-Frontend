import { Outlet } from "react-router-dom";
import Dock from "../components/Dock";
import NotificationBar from "../components/NotificatioBar";
import { UnsavedChangesProvider } from "../context/UnsavedChangesContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function UserLayout() {
    return (
        <UnsavedChangesProvider>
            <ToastContainer
                position="top-right"
                autoClose={3000}
                toastStyle={{
                    width: "100%",
                }}
            />

                <NotificationBar />

                <div className="max-w-3xl mx-auto w-full">
                    <Outlet />
                </div>

                <Dock />

        </UnsavedChangesProvider>
    );
}

export default UserLayout;