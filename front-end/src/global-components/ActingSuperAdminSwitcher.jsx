import { useState, useEffect, useRef } from "react";
import { ChevronDown, Building2, UserRound, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";
import AdminConfirmDialog from "../admin-components/AdminConfirmDialog";

// Shown instead of SwitchBackButton whenever a Super Admin has switched down
// to Admin or User (acting_as_super_admin). Unlike SwitchBackButton's single
// "Back to X" action, this offers a dropdown so they can also switch laterally
// between Admin and User without first going back up to Super Admin.
export default function ActingSuperAdminSwitcher() {
    const API_URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();
    const containerRef = useRef(null);

    const actingAsSuperAdmin = localStorage.getItem("acting_as_super_admin") === "true";
    const currentRole = localStorage.getItem("role"); // "admin" | "user"

    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState("menu"); // menu | pickOffice
    const [offices, setOffices] = useState([]);
    const [selectedOfficeId, setSelectedOfficeId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // null | "back" | "user" | "admin"

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

    if (!actingAsSuperAdmin) return null;

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

    const handleBackToSuperAdmin = async () => {
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
            localStorage.removeItem("office_location");
            localStorage.removeItem("office_name");
            localStorage.removeItem("acting_as_super_admin");
            localStorage.removeItem("acting_as_admin");

            navigate("/super_admin");
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Failed to switch back.");
        } finally {
            setIsLoading(false);
            setPendingAction(null);
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
            localStorage.removeItem("office_location");
            localStorage.removeItem("office_name");
            localStorage.setItem("acting_as_super_admin", "true");

            navigate("/home");
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Failed to switch mode.");
        } finally {
            setIsLoading(false);
            setPendingAction(null);
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
            setPendingAction(null);
        }
    };

    const selectedOfficeName = offices.find(
        (o) => String(o.office_id) === String(selectedOfficeId)
    )?.office_name;

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => {
                    setIsOpen((o) => !o);
                    setView("menu");
                }}
                disabled={isLoading}
                className="flex items-center gap-2 bg-[#FBEFE9] text-primary text-xs font-medium px-3 py-1.5 rounded-full
                    transition-transform duration-100 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? "Switching..." : "Switch Mode"}
                <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-[#DDD9CF] rounded-lg shadow-lg z-50 overflow-hidden">
                    {view === "menu" && (
                        <div className="flex flex-col py-1">
                            <p className="px-4 py-2 text-xs text-[#9A8F7C] border-b border-[#F0EDE6]">
                                Currently: {currentRole === "admin" ? "Admin" : "End User"}
                            </p>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsOpen(false);
                                    setPendingAction("back");
                                }}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-[#F5F5F3] text-left cursor-pointer"
                            >
                                <ShieldCheck size={16} className="text-[#6B5C42]" />
                                <div>
                                    <p className="text-sm font-medium text-[#1A1208]">Super Admin</p>
                                    <p className="text-xs text-[#9A8F7C]">Return to full system access</p>
                                </div>
                            </button>

                            {currentRole === "admin" && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsOpen(false);
                                        setPendingAction("user");
                                    }}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#F5F5F3] text-left cursor-pointer"
                                >
                                    <UserRound size={16} className="text-[#6B5C42]" />
                                    <div>
                                        <p className="text-sm font-medium text-[#1A1208]">End User</p>
                                        <p className="text-xs text-[#9A8F7C]">Browse and report items</p>
                                    </div>
                                </button>
                            )}

                            {currentRole === "user" && (
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
                            )}
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
                                onClick={() => {
                                    setIsOpen(false);
                                    setPendingAction("admin");
                                }}
                                disabled={!selectedOfficeId}
                                className="w-full h-9 bg-primary rounded-md text-white text-sm font-medium cursor-pointer
                                    disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Continue
                            </button>
                        </div>
                    )}
                </div>
            )}

            {pendingAction === "back" && (
                <AdminConfirmDialog
                    title="Switch Mode"
                    description="Back to Super Admin?"
                    message="You'll return to full system access."
                    confirmText={isLoading ? "Switching..." : "Switch"}
                    cancelText="Cancel"
                    disabled={isLoading}
                    onClose={() => setPendingAction(null)}
                    onConfirm={handleBackToSuperAdmin}
                />
            )}

            {pendingAction === "user" && (
                <AdminConfirmDialog
                    title="Switch Mode"
                    description="Switch to the End User view?"
                    message="You'll leave the Admin dashboard and see the app as a regular user."
                    confirmText={isLoading ? "Switching..." : "Switch"}
                    cancelText="Cancel"
                    disabled={isLoading}
                    onClose={() => setPendingAction(null)}
                    onConfirm={handleSwitchToUser}
                />
            )}

            {pendingAction === "admin" && (
                <AdminConfirmDialog
                    title="Switch Mode"
                    description={`Switch to Admin view for ${selectedOfficeName || "the selected center"}?`}
                    message="You'll manage that center's items and reports until you switch back."
                    confirmText={isLoading ? "Switching..." : "Switch"}
                    cancelText="Cancel"
                    disabled={isLoading}
                    onClose={() => setPendingAction(null)}
                    onConfirm={handleSwitchToAdmin}
                />
            )}
        </div>
    );
}
