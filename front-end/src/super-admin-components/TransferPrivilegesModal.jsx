import { useState, useEffect } from "react";
import { Search, ShieldAlert } from "lucide-react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function TransferPrivilegesModal({ onClose }) {
    const API_URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();

    const [step, setStep] = useState(1); // 1: pick user, 2: type-to-confirm, 3: otp
    const [allUsers, setAllUsers] = useState([]);
    const [userSearch, setUserSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [confirmText, setConfirmText] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSentTo, setOtpSentTo] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const response = await fetchWithAuth(`${API_URL}/api/users`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Failed to fetch users.");
                }

                const myUserId = Number(localStorage.getItem("user_id"));
                setAllUsers(
                    Array.isArray(data)
                        ? data.filter((u) => u.user_id !== myUserId && u.user_role !== "super_admin")
                        : []
                );
            } catch (err) {
                console.error(err);
                toast.error(err.message || "Failed to load users.");
            }
        };

        loadUsers();
    }, []);

    const eligibleUsers = allUsers.filter((u) => {
        const query = userSearch.toLowerCase();
        const fullName = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
        return (
            fullName.includes(query) ||
            u.email?.toLowerCase().includes(query) ||
            u.student_number?.toLowerCase().includes(query)
        );
    });

    const targetFullName = selectedUser
        ? `${selectedUser.first_name || ""} ${selectedUser.last_name || ""}`.trim()
        : "";

    const handleProceedToConfirm = () => {
        if (!selectedUser) return;
        setError("");
        setStep(2);
    };

    const handleSendOtp = async () => {
        if (confirmText.trim() !== targetFullName) {
            setError("The name you typed doesn't match. Please type it exactly as shown.");
            return;
        }

        try {
            setIsLoading(true);
            setError("");

            const response = await fetchWithAuth(
                `${API_URL}/api/users/transfer-privileges/send-otp`,
                { method: "POST" }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to send OTP.");
            }

            setOtpSentTo(data.message);
            toast.success("OTP sent to your email.");
            setStep(3);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to send OTP.");
            toast.error(err.message || "Failed to send OTP.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmTransfer = async () => {
        if (!otp.trim()) {
            setError("Please enter the OTP sent to your email.");
            return;
        }

        try {
            setIsLoading(true);
            setError("");

            const response = await fetchWithAuth(
                `${API_URL}/api/users/transfer-privileges/confirm`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        targetUserId: selectedUser.user_id,
                        otp: otp.trim(),
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to transfer privileges.");
            }

            toast.success(data.message || "Privileges transferred successfully. Logging out...");

            setTimeout(() => {
                localStorage.clear();
                navigate("/login");
            }, 1500);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to transfer privileges.");
            toast.error(err.message || "Failed to transfer privileges.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-1040">
            <div className="relative bg-white rounded-lg w-100 max-w-[90vw] flex flex-col max-h-[85vh]">
                <div className="w-full h-10 rounded-t-lg bg-primary text-white flex items-center justify-between px-5 shrink-0">
                    <p className="font-semibold">Transfer Super Admin Privileges</p>
                    <button onClick={onClose}>
                        <i className="fa-solid fa-x text-sm text-white" />
                    </button>
                </div>

                {/* STEP 1 — PICK USER */}
                {step === 1 && (
                    <div className="p-4 flex flex-col gap-3 overflow-hidden flex-1">
                        <div className="flex items-center gap-2 bg-white border border-[#DDD9CF] rounded-lg px-3 py-2">
                            <Search size={16} className="text-[#9A8F7C]" />
                            <input
                                type="text"
                                placeholder="Search by name, email, or student no..."
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                className="w-full text-sm outline-none placeholder:text-[#9A8F7C]"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto flex flex-col gap-1 min-h-40">
                            {eligibleUsers.length === 0 && (
                                <p className="text-sm text-[#6B5C42] text-center py-8">
                                    No matching users found.
                                </p>
                            )}

                            {eligibleUsers.map((u) => (
                                <button
                                    key={u.user_id}
                                    type="button"
                                    onClick={() => setSelectedUser(u)}
                                    className={`flex items-center justify-between text-left px-3 py-2 rounded-md border
                                        ${selectedUser?.user_id === u.user_id
                                            ? "border-primary bg-[#FBEFE9]"
                                            : "border-transparent hover:bg-[#F5F5F5]"}`}
                                >
                                    <div>
                                        <p className="text-sm font-medium text-[#1A1208]">
                                            {u.first_name} {u.last_name}
                                        </p>
                                        <p className="text-xs text-[#9A8F7C]">{u.email}</p>
                                    </div>
                                    {selectedUser?.user_id === u.user_id && (
                                        <span className="text-xs text-primary font-medium">Selected</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                className="flex-1 h-10 bg-white border border-primary rounded-lg text-primary text-sm font-medium
                                    transition-transform duration-100 active:scale-95"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="flex-1 h-10 bg-primary rounded-lg text-white text-sm font-medium
                                    transition-transform duration-100 enabled:active:scale-95
                                    disabled:opacity-40 disabled:cursor-not-allowed"
                                disabled={!selectedUser}
                                onClick={handleProceedToConfirm}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2 — TYPE NAME TO CONFIRM */}
                {step === 2 && (
                    <div className="p-4 flex flex-col gap-4">
                        <div className="flex justify-center">
                            <ShieldAlert size={40} className="text-[#C0392B]" />
                        </div>

                        <p className="text-sm text-[#1A1208] text-center">
                            Are you sure you want to transfer Super Admin privileges to{" "}
                            <span className="font-semibold">{targetFullName}</span>?
                            <br />
                            <span className="text-xs text-[#C0392B]">
                                You will be demoted to a regular user account after this action.
                            </span>
                        </p>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-[#1A1208]">
                                Type <span className="font-semibold">{targetFullName}</span> to confirm
                            </label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder={targetFullName}
                                className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                            />
                        </div>

                        {error && <p className="text-xs text-[#C0392B]">{error}</p>}

                        <div className="flex gap-2">
                            <button
                                type="button"
                                className="flex-1 h-10 bg-white border border-primary rounded-lg text-primary text-sm font-medium
                                    transition-transform duration-100 active:scale-95"
                                onClick={() => setStep(1)}
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                className="flex-1 h-10 bg-[#C0392B] rounded-lg text-white text-sm font-medium
                                    transition-transform duration-100 enabled:active:scale-95
                                    disabled:opacity-40 disabled:cursor-not-allowed"
                                disabled={isLoading || confirmText.trim() === ""}
                                onClick={handleSendOtp}
                            >
                                {isLoading ? "Sending OTP..." : "Send OTP to My Email"}
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3 — ENTER OTP */}
                {step === 3 && (
                    <div className="p-4 flex flex-col gap-4">
                        <div className="flex justify-center">
                            <ShieldAlert size={40} className="text-primary" />
                        </div>

                        <p className="text-sm text-[#1A1208] text-center">
                            {otpSentTo || "An OTP has been sent to your email."}
                            <br />
                            Enter it below to finalize the transfer.
                        </p>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-[#1A1208]">OTP Code</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="6-digit code"
                                maxLength={6}
                                className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none focus:border-primary text-center tracking-widest"
                            />
                        </div>

                        {error && <p className="text-xs text-[#C0392B]">{error}</p>}

                        <div className="flex gap-2">
                            <button
                                type="button"
                                className="flex-1 h-10 bg-white border border-primary rounded-lg text-primary text-sm font-medium
                                    transition-transform duration-100 active:scale-95"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="flex-1 h-10 bg-[#C0392B] rounded-lg text-white text-sm font-medium
                                    transition-transform duration-100 enabled:active:scale-95
                                    disabled:opacity-40 disabled:cursor-not-allowed"
                                disabled={isLoading || otp.trim() === ""}
                                onClick={handleConfirmTransfer}
                            >
                                {isLoading ? "Transferring..." : "Confirm Transfer"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}