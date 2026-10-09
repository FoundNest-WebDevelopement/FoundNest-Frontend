import { useEffect, useState } from "react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AdminConfirmDialog from "../admin-components/AdminConfirmDialog";

export default function SwitchBackButton() {
    const API_URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [openConfirm, setOpenConfirm] = useState(false);
    const [officeInactive, setOfficeInactive] = useState(false);

    const actingAsAdmin = localStorage.getItem("acting_as_admin") === "true";
    const officeId = localStorage.getItem("office_location");
    const officeName = localStorage.getItem("office_name") || "Your center";

    // The office may have been deactivated while this admin was browsing as
    // an End User — check its live status so "Switch to Admin" reflects that
    // instead of letting them hit the error only after confirming.
    useEffect(() => {
        if (!actingAsAdmin || !officeId) return;
        fetchWithAuth(`${API_URL}/api/offices`)
            .then((res) => res.json())
            .then((data) => {
                const office = Array.isArray(data)
                    ? data.find((o) => String(o.office_id) === String(officeId))
                    : null;
                setOfficeInactive(Boolean(office && office.status === false));
            })
            .catch(() => {});
    }, []);

    // The acting_as_super_admin case (Super Admin who switched down to Admin
    // or User) is handled by ActingSuperAdminSwitcher instead, since it needs
    // a dropdown with lateral-switch options, not just a single "back" button.
    if (!actingAsAdmin) return null;

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
            const originalRefreshToken = localStorage.getItem("original_refreshToken");
            if (originalRefreshToken) {
                localStorage.setItem("refreshToken", originalRefreshToken);
                localStorage.removeItem("original_refreshToken");
            }

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

    const label = "Switch to Admin";
    const disabledMessage = `Admin access disabled: ${officeName} is currently inactive.`;

    return (
        <>
            <button
                onClick={() => setOpenConfirm(true)}
                disabled={isLoading || officeInactive}
                title={officeInactive ? disabledMessage : undefined}
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