import { useState } from "react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function SwitchToUserButton() {
    const API_URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    // Only a true (non-acting) Admin can switch here. If this admin session
    // is itself a Super Admin acting-as-Admin, switching further down would
    // overwrite original_role server-side and strand them unable to get
    // back to Super Admin without a full re-login — so hide it in that case.
    const actingAsSuperAdmin = localStorage.getItem("acting_as_super_admin") === "true";
    const actingAsAdmin = localStorage.getItem("acting_as_admin") === "true";
    if (actingAsSuperAdmin || actingAsAdmin) return null;

    const handleSwitchToUser = async () => {
        try {
            setIsLoading(true);
            const response = await fetchWithAuth(`${API_URL}/api/auth/select-role`, {
                method: "POST",
                body: JSON.stringify({ mode: "user" }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to switch mode.");
            }

            localStorage.setItem("token", data.accessToken);
            localStorage.setItem("role", "user");
            localStorage.setItem("acting_as_admin", "true");

            navigate("/home");
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Failed to switch mode.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleSwitchToUser}
            disabled={isLoading}
            className="flex items-center gap-2 bg-[#FBEFE9] text-primary text-xs font-medium px-3 py-1.5 rounded-full
                transition-transform duration-100 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isLoading ? "Switching..." : "Switch to User"}
        </button>
    );
}
