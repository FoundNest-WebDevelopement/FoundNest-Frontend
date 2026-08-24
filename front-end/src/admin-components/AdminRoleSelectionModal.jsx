import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const AdminIcon = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#990000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
        <path d="M17 3l1 1-1 1" />
    </svg>
);

const UserIcon = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#990000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

export default function AdminRoleSelectionModal({ onClose }) {
    const API_URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleContinueAsAdmin = () => {
        onClose();
    };

    const handleLoginAsGuest = async () => {
        try {
            setIsLoading(true);
            setError("");

            const response = await fetchWithAuth(`${API_URL}/api/auth/select-role`, {
                method: "POST",
                body: JSON.stringify({ mode: "user" }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to switch role.");
            }

            localStorage.setItem("token", data.accessToken);
            localStorage.setItem("role", "user");
            localStorage.setItem("acting_as_admin", "true");

            navigate("/home");
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to switch role.");
            toast.error(err.message || "Failed to switch role.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-1040">
            <div className="relative bg-white rounded-lg w-100 max-w-[90vw]">
                <div className="w-full h-10 rounded-t-lg bg-primary text-white flex items-center justify-between px-5">
                    <p className="font-semibold">Continue As</p>
                </div>

                <div className="p-5 flex flex-col gap-3">
                    <p className="text-sm text-[#6B5C42] text-center mb-2">
                        You're logged in as Admin. How would you like to continue?
                    </p>

                    <button
                        type="button"
                        onClick={handleContinueAsAdmin}
                        className="flex items-center gap-4 border border-[#DDD9CF] rounded-lg px-4 py-3 hover:border-primary transition-colors"
                    >
                        <AdminIcon />
                        <div className="text-left">
                            <p className="text-sm font-semibold text-[#1A1208]">Continue as Admin</p>
                            <p className="text-xs text-[#9A8F7C]">Manage your center</p>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={handleLoginAsGuest}
                        disabled={isLoading}
                        className="flex items-center gap-4 border border-[#DDD9CF] rounded-lg px-4 py-3 hover:border-primary transition-colors disabled:opacity-50"
                    >
                        <UserIcon />
                        <div className="text-left">
                            <p className="text-sm font-semibold text-[#1A1208]">Login as Guest</p>
                            <p className="text-xs text-[#9A8F7C]">Browse and report items</p>
                        </div>
                    </button>

                    {error && <p className="text-xs text-[#C0392B] text-center">{error}</p>}
                </div>
            </div>
        </div>
    );
}