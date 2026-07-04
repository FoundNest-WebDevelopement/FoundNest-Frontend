
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {  Routes, Route } from "react-router-dom";
import SuperAdminLayout from "./layout/SuperAdminLayout";
import SuperAdminDashboard from "./super-admin-pages/SuperAdminDashboard";
import SuperAdminUserMangement from "./super-admin-pages/SuperAdminUserManagement";
import SuperAdminGlobalConfiguration from "./super-admin-pages/SuperAdminGlobalConfiguration";
import SuperAdminSystemReports from "./super-admin-pages/SuperAdminSystemReports";
import SuperAdminActionLogs from "./super-admin-pages/SuperAdminActionLogs";
import SuperAdminProfile from "./super-admin-pages/SuperAdminProfile";

function SuperAdmin() {

    return (
        <>
            <ToastContainer
                position="top-right"
                autoClose={3000}
                toastStyle={{
                    width: "100%",
                }}
            />

            <Routes>

                <Route path="/" element={<SuperAdminLayout />}>
                    <Route index element={<SuperAdminDashboard />} />
                    <Route path="user_management" element={<SuperAdminUserMangement />} />
                    <Route path="global_configuration" element={<SuperAdminGlobalConfiguration />} />
                    <Route path="system_reports" element={<SuperAdminSystemReports />} />
                    <Route path="action_logs" element={<SuperAdminActionLogs />} />
                    <Route path="super_admin_profile" element={<SuperAdminProfile />} />
                </Route>
            </Routes>
        </>
    )

}

export default SuperAdmin; 