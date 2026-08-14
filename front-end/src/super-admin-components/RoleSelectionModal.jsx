import { useState, useEffect } from "react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const SuperAdminIcon = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#990000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.4 4.8L20 8l-4 4 1 5.5L12 15l-5 2.5 1-5.5-4-4 5.6-1.2L12 2z" />
    </svg>
);

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

export default function RoleSelectionModal({ onClose }) {
    const API_URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();

    const [step, setStep] = useState("choose"); // choose | pickOffice
    const [offices, setOffices] = useState([]);
    const [selectedOfficeId, setSelectedOfficeId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (step === "pickOffice") {
            const loadOffices = async () => {
                try {
                    const response = await fetchWithAuth(`${API_URL}/api/offices`);
                    const data = await response.json();
                    if (response.ok) {
                        setOffices(data.filter((o) => o.status !== false));
                    }
                } catch (err) {
                    console.error(err);
                }
            };
            loadOffices();
        }
    }, [step]);

    const handleSuperAdmin = () => {
        onClose();
    };

    const handleUser = async () => {
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
            localStorage.setItem("acting_as_super_admin", "true");

            navigate("/home");
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to switch role.");
            toast.error(err.message || "Failed to switch role.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmAdmin = async () => {
        if (!selectedOfficeId) {
            setError("Please select an office.");
            return;
        }

        try {
            setIsLoading(true);
            setError("");

            const response = await fetchWithAuth(`${API_URL}/api/auth/select-role`, {
                method: "POST",
                body: JSON.stringify({ mode: "admin", office_id: selectedOfficeId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to switch role.");
            }

            localStorage.setItem("token", data.accessToken);
            localStorage.setItem("role", "admin");
            localStorage.setItem("office_location", data.office_id);
            localStorage.setItem("office_name", data.office_name);
            localStorage.setItem("acting_as_super_admin", "true");

            navigate("/admin");
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
                    <p className="font-semibold">
                        {step === "choose" ? "Continue As" : "Select Office"}
                    </p>
                    {step === "pickOffice" && (
                        <button onClick={() => setStep("choose")}>
                            <i className="fa-solid fa-arrow-left text-sm text-white" />
                        </button>
                    )}
                </div>

                {step === "choose" && (
                    <div className="p-5 flex flex-col gap-3">
                        <p className="text-sm text-[#6B5C42] text-center mb-2">
                            You're logged in as Super Admin. How would you like to continue?
                        </p>

                        <button
                            type="button"
                            onClick={handleSuperAdmin}
                            className="flex items-center gap-4 border border-[#DDD9CF] rounded-lg px-4 py-3 hover:border-primary transition-colors"
                        >
                            <SuperAdminIcon />
                            <div className="text-left">
                                <p className="text-sm font-semibold text-[#1A1208]">Continue as Super Admin</p>
                                <p className="text-xs text-[#9A8F7C]">Full system access</p>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep("pickOffice")}
                            className="flex items-center gap-4 border border-[#DDD9CF] rounded-lg px-4 py-3 hover:border-primary transition-colors"
                        >
                            <AdminIcon />
                            <div className="text-left">
                                <p className="text-sm font-semibold text-[#1A1208]">Login as Admin</p>
                                <p className="text-xs text-[#9A8F7C]">Manage a specific center</p>
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={handleUser}
                            disabled={isLoading}
                            className="flex items-center gap-4 border border-[#DDD9CF] rounded-lg px-4 py-3 hover:border-primary transition-colors disabled:opacity-50"
                        >
                            <UserIcon />
                            <div className="text-left">
                                <p className="text-sm font-semibold text-[#1A1208]">Login as End User</p>
                                <p className="text-xs text-[#9A8F7C]">Browse and report items</p>
                            </div>
                        </button>

                        {error && <p className="text-xs text-[#C0392B] text-center">{error}</p>}
                    </div>
                )}

                {step === "pickOffice" && (
                    <div className="p-5 flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-[#1A1208]">Center</label>
                            <select
                                value={selectedOfficeId}
                                onChange={(e) => setSelectedOfficeId(e.target.value)}
                                className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                            >
                                <option value="">Select a center</option>
                                {offices.map((o) => (
                                    <option key={o.office_id} value={o.office_id}>
                                        {o.office_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {error && <p className="text-xs text-[#C0392B]">{error}</p>}

                        <button
                            type="button"
                            onClick={handleConfirmAdmin}
                            disabled={isLoading || !selectedOfficeId}
                            className="w-full h-10 bg-primary rounded-lg text-white text-sm font-medium
                                transition-transform duration-100 enabled:active:scale-95
                                disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Switching..." : "Continue as Admin"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}