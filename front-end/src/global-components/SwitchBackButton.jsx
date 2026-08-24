import { fetchWithAuth } from "../utils/fetchWithAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function SwitchBackButton() {
    const API_URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();

    const actingAsSuperAdmin = localStorage.getItem("acting_as_super_admin") === "true";
    const actingAsAdmin = localStorage.getItem("acting_as_admin") === "true";

    if (!actingAsSuperAdmin && !actingAsAdmin) return null;

    const handleSwitchBack = async () => {
        try {
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
        }
    };

    const label = actingAsSuperAdmin ? "← Back to Super Admin" : "← Back to Admin";

    return (
        <button
    onClick={handleSwitchBack}
    className="flex items-center gap-2 bg-[#FBEFE9] text-primary text-xs font-medium px-3 py-1.5 rounded-full
        transition-transform duration-100 active:scale-95 cursor-pointer"
>
    {label}
</button>
    );
}