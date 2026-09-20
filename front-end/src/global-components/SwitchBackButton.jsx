import { useState } from "react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AdminConfirmDialog from "../admin-components/AdminConfirmDialog";

export default function SwitchBackButton() {
    const API_URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [openConfirm, setOpenConfirm] = useState(false);

    const actingAsSuperAdmin = localStorage.getItem("acting_as_super_admin") === "true";
    const actingAsAdmin = localStorage.getItem("acting_as_admin") === "true";

    if (!actingAsSuperAdmin && !actingAsAdmin) return null;

    const handleSwitchBack = async () => {
        try {
            setIsLoading(true);
            const response = await fetchWithAuth(`${API_URL}/api/auth/switch-back`, {
                method: "POST",
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to switch back.");
            }

            localStorage.setItem("token", data.accessToken);
            localStorage.setItem("role", data.role);

            if (data.role === "admin") {
                localStorage.setItem("office_location", data.office_id);
                localStorage.setItem("office_name", data.office_name);
            } else {
                localStorage.removeItem("office_location");
                localStorage.removeItem("office_name");
            }

            localStorage.removeItem("acting_as_super_admin");
            localStorage.removeItem("acting_as_admin");

            navigate(data.role === "super_admin" ? "/super_admin" : "/admin");
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Failed to switch back.");
        } finally {
            setIsLoading(false);
            setOpenConfirm(false);
        }
    };

    const label = actingAsSuperAdmin ? "Back to Super Admin" : "Back to Admin";

    return (
        <>
            <button
                onClick={() => setOpenConfirm(true)}
                disabled={isLoading}
                className="flex items-center gap-2 bg-[#FBEFE9] text-primary text-xs font-medium px-3 py-1.5 rounded-full
                    transition-transform duration-100 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? "Switching..." : label}
            </button>

            {openConfirm && (
                <AdminConfirmDialog
                    title="Switch Mode"
                    description={`${label}?`}
                    message="You'll return to where you were before switching."
                    confirmText={isLoading ? "Switching..." : "Switch"}
                    cancelText="Cancel"
                    disabled={isLoading}
                    onClose={() => setOpenConfirm(false)}
                    onConfirm={handleSwitchBack}
                />
            )}
        </>
    );
}