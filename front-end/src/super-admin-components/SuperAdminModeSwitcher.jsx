import { useState, useEffect, useRef } from "react";
import { ChevronDown, Building2, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";

export default function SuperAdminModeSwitcher() {
    const API_URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();
    const containerRef = useRef(null);

    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState("menu"); // menu | pickOffice
    const [offices, setOffices] = useState([]);
    const [selectedOfficeId, setSelectedOfficeId] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
                setView("menu");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const openAdminPicker = async () => {
        setView("pickOffice");
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
            localStorage.setItem("acting_as_super_admin", "true");

            navigate("/home");
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Failed to switch mode.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSwitchToAdmin = async () => {
        if (!selectedOfficeId) return;

        try {
            setIsLoading(true);
            const response = await fetchWithAuth(`${API_URL}/api/auth/select-role`, {
                method: "POST",
                body: JSON.stringify({ mode: "admin", office_id: selectedOfficeId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to switch mode.");
            }

            localStorage.setItem("token", data.accessToken);
            localStorage.setItem("role", "admin");
            localStorage.setItem("office_location", data.office_id);
            localStorage.setItem("office_name", data.office_name);
            localStorage.setItem("acting_as_super_admin", "true");

            navigate("/admin");
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Failed to switch mode.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => {
                    setIsOpen((o) => !o);
                    setView("menu");
                }}
                className="flex items-center gap-2 bg-[#FBEFE9] text-primary text-xs font-medium px-3 py-1.5 rounded-full
                    transition-transform duration-100 active:scale-95 cursor-pointer"
            >
                Switch Mode
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-[#DDD9CF] rounded-lg shadow-lg z-50 overflow-hidden">
                    {view === "menu" && (
                        <div className="flex flex-col py-1">
                            <p className="px-4 py-2 text-xs text-[#9A8F7C] border-b border-[#F0EDE6]">
                                Currently: Super Admin
                            </p>
                            <button
                                type="button"
                                onClick={openAdminPicker}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-[#F5F5F3] text-left cursor-pointer"
                            >
                                <Building2 size={16} className="text-[#6B5C42]" />
                                <div>
                                    <p className="text-sm font-medium text-[#1A1208]">Admin</p>
                                    <p className="text-xs text-[#9A8F7C]">Manage a specific center</p>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={handleSwitchToUser}
                                disabled={isLoading}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-[#F5F5F3] text-left cursor-pointer disabled:opacity-50"
                            >
                                <UserRound size={16} className="text-[#6B5C42]" />
                                <div>
                                    <p className="text-sm font-medium text-[#1A1208]">End User</p>
                                    <p className="text-xs text-[#9A8F7C]">Browse and report items</p>
                                </div>
                            </button>
                        </div>
                    )}

                    {view === "pickOffice" && (
                        <div className="p-4 flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={() => setView("menu")}
                                className="text-xs text-[#6B5C42] self-start cursor-pointer"
                            >
                                ← Back
                            </button>
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
                            <button
                                type="button"
                                onClick={handleSwitchToAdmin}
                                disabled={isLoading || !selectedOfficeId}
                                className="w-full h-9 bg-primary rounded-md text-white text-sm font-medium cursor-pointer
                                    disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Switching..." : "Continue"}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
