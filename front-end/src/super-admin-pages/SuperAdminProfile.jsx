import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";
import formatDate from "../utils/formatDate";
import EditProfilePictureModal from "../super-admin-components/EditProfilePictureModal";
import TransferPrivilegesModal from "../super-admin-components/TransferPrivilegesModal";
import WebLoading from "../global-components/WebLoading";

function formatUserId(id) {
    return `USR-${String(id).padStart(5, "0")}`;
}

export default function SuperAdminProfile() {
    const API_URL = import.meta.env.VITE_API_URL;
    const userId = localStorage.getItem("user_id");

    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const [openEditPicture, setOpenEditPicture] = useState(false);
    const [openTransferPrivileges, setOpenTransferPrivileges] = useState(false);

    const fetchProfile = async () => {
        try {
            setIsLoading(true);
            const response = await fetchWithAuth(`${API_URL}/api/profile/${userId}/super-admin`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch profile.");
            }

            setProfile(data);
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Failed to load profile.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

if (isLoading || !profile) {
    return <WebLoading />;
}

    const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();

    return (
        <div className="w-full min-h-screen bg-[#FAFAF8] p-6 flex flex-col gap-6">
            <h1 className="text-2xl font-bold text-[#1A1208]">Super Admin Profile</h1>

            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
                {/* LEFT CARD */}
                <div className="bg-white rounded-xl border border-[#E5E1D8] shadow-[0_2px_6px_0px_rgba(0,0,0,0.06)] p-6 flex flex-col items-center gap-4">
                    <div className="relative">
                        {profile.profile_image_url ? (
                            <img
                                src={profile.profile_image_url}
                                alt={fullName}
                                className="w-24 h-24 rounded-full object-cover border border-[#E5E1D8]"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-[#F5F5F5] border border-[#E5E1D8] flex items-center justify-center">
                                <i className="fa-regular fa-circle-user text-5xl text-[#1A1208]" />
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => setOpenEditPicture(true)}
                            className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-white"
                        >
                            <Pencil size={14} className="text-white" />
                        </button>
                    </div>

                    <div className="text-center">
                        <p className="font-semibold text-lg text-[#1A1208]">{fullName || "N/A"}</p>
                        <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            Super Administrator
                        </span>
                    </div>

                    <div className="w-full flex flex-col gap-2 mt-2">
                        <button
                            type="button"
                            onClick={() => setOpenEditPicture(true)}
                            className="w-full h-10 bg-primary rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2
                                transition-transform duration-100 active:scale-95"
                        >
                            <Pencil size={14} />
                            Edit Profile
                        </button>
                        <button
                            type="button"
                            onClick={() => setOpenTransferPrivileges(true)}
                            className="w-full h-10 bg-white border border-primary rounded-lg text-primary text-sm font-medium
                                transition-transform duration-100 active:scale-95"
                        >
                            Transfer Privileges
                        </button>
                    </div>

                </div>

                {/* RIGHT CARD */}
                <div className="bg-white rounded-xl border border-[#E5E1D8] shadow-[0_2px_6px_0px_rgba(0,0,0,0.06)] p-6">
                    <p className="font-semibold text-lg text-[#1A1208] mb-5">Account Information</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                        <div>
                            <p className="text-xs font-medium text-[#9A8F7C] uppercase tracking-wide">User ID</p>
                            <p className="text-sm text-[#1A1208] mt-1 pb-2 border-b border-[#E5E1D8]">
                                {formatUserId(profile.user_id)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-[#9A8F7C] uppercase tracking-wide">Faculty ID</p>
                            <p className="text-sm text-[#1A1208] mt-1 pb-2 border-b border-[#E5E1D8]">
                                {profile.faculty_id || "N/A"}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium text-[#9A8F7C] uppercase tracking-wide">Full Name</p>
                            <p className="text-sm text-[#1A1208] mt-1 pb-2 border-b border-[#E5E1D8]">
                                {fullName || "N/A"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-[#9A8F7C] uppercase tracking-wide">BulSU Email</p>
                            <p className="text-sm text-[#1A1208] mt-1 pb-2 border-b border-[#E5E1D8]">
                                {profile.email || "N/A"}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-medium text-[#9A8F7C] uppercase tracking-wide">Department</p>
                            <p className="text-sm text-[#1A1208] mt-1 pb-2 border-b border-[#E5E1D8]">
                                {profile.college_name || "N/A"}
                            </p>
                        </div>
                        <div></div>

                        <div>
                            <p className="text-xs font-medium text-[#9A8F7C] uppercase tracking-wide">Date Assigned</p>
                            <p className="text-sm text-[#1A1208] mt-1 pb-2 border-b border-[#E5E1D8]">
                                {profile.date_assigned ? formatDate(profile.date_assigned) : "N/A"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-[#9A8F7C] uppercase tracking-wide">Last Login</p>
                            <p className="text-sm text-[#1A1208] mt-1 pb-2 border-b border-[#E5E1D8]">
                                {profile.last_login ? formatDate(profile.last_login) : "N/A"}
                            </p>
                        </div>
                    </div>

                    <hr className="border-(--color-tertiary) opacity-30 my-5" />

                    <p className="font-semibold text-base text-[#C0392B] mb-4">System Access Summary</p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-[#FBEFE9] rounded-lg p-5 text-center">
                            <p className="text-3xl font-bold text-[#1A1208]">
                                {profile.access_summary.admins_managed}
                            </p>
                            <p className="text-xs text-[#6B5C42] mt-1">Admins Managed</p>
                        </div>
                        <div className="bg-[#FBEFE9] rounded-lg p-5 text-center">
                            <p className="text-3xl font-bold text-[#1A1208]">
                                {profile.access_summary.policies_updated}
                            </p>
                            <p className="text-xs text-[#6B5C42] mt-1">Policies Updated</p>
                        </div>
                        <div className="bg-[#FBEFE9] rounded-lg p-5 text-center">
                            <p className="text-3xl font-bold text-[#1A1208]">
                                {profile.access_summary.reports_generated}
                            </p>
                            <p className="text-xs text-[#6B5C42] mt-1">Reports Generated</p>
                        </div>
                    </div>
                </div>
            </div>

            {openEditPicture && (
                <EditProfilePictureModal
                    profile={profile}
                    userId={userId}
                    onClose={() => setOpenEditPicture(false)}
                    onUpdated={fetchProfile}
                />
            )}

            {openTransferPrivileges && (
                <TransferPrivilegesModal
                    onClose={() => setOpenTransferPrivileges(false)}
                />
            )}
        </div>
    );
}