import { fetchWithAuth } from "../utils/fetchWithAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function SwitchBackButton() {
    const API_URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();

    const isActingAsSuperAdmin = localStorage.getItem("acting_as_super_admin") === "true";

    if (!isActingAsSuperAdmin) return null;

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
            localStorage.setItem("role", "super_admin");
            localStorage.removeItem("acting_as_super_admin");
            localStorage.removeItem("office_location");
            localStorage.removeItem("office_name");

            navigate("/super_admin");
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Failed to switch back.");
        }
    };

    return (
        <button
            onClick={handleSwitchBack}
            className="flex items-center gap-2 bg-[#FBEFE9] text-primary text-xs font-medium px-3 py-1.5 rounded-full
                transition-transform duration-100 active:scale-95"
        >
            ← Back to Super Admin
        </button>
    );
}