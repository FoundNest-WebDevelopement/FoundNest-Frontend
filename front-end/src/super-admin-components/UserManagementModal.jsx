import { useEffect, useState } from "react";
import formatDate from "../utils/formatDate";
import Button from "../global-components/Button";
import ConfirmDialog from "../global-components/ConfirmDialog";
import { TriangleAlert, Lock, LockKeyholeOpen, Download } from "lucide-react"
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";
import TextArea from "../global-components/TextArea";
import formatDateTime from "../utils/formatDataTimeNew"
import { formatActionType } from "../utils/formatActionType";
import ResetPasswordModal from "./resetPasswordModal";

export default function UserManagementModal(
    {
        selectedUser = [],
        setSelectedUser,
        onUpdated,

    }
) {
    const API_URL = import.meta.env.VITE_API_URL;
    const [isRevoking, setIsRevoking] = useState(false);
    const [isLocking, setIsLocking] = useState(false);
    const [isActivating, setIsActivating] = useState(false);

    //Reset password states 
    const [openResetPassword, setOpenResetPassword] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);


    //user full name
    const fullName = selectedUser.first_name ? selectedUser.first_name + " " + selectedUser.last_name : "N/A";
    const TABS = [
        { label: "Profile", value: "PROFILE" },
        { label: "Account Settings", value: "ACCOUNT_SETTINGS" },
        { label: "Activity", value: "ACTIVITY" },
    ];

    const [activeTab, setActiveTab] = useState(TABS[0].value);
    //Dialogs
    const [openRevokePrivillege, setOpenRevokePrivillege] = useState(false);
    const [openLockAccount, setOpenLockAccount] = useState(false);
    const [openActivateAccount, setOpenActivateAccount] = useState(false);
    const [openExportActivity, setOpenExportActivity] = useState(false);

    //Account Setting states
    const [lockingReason, setLockingReason] = useState("");

    //Export state
    const [isExporting, setIsExporting] = useState(false);

    const formatUsrId = (id) => {
        return `USR-${String(id).padStart(5, "0")}`;
    };

    const handleRevokeAdmin = async () => {
        try {
            setIsRevoking(true);
            setOpenRevokePrivillege(false);
            const response = await fetchWithAuth(
                `${API_URL}/api/users/${selectedUser.user_id}/role`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        role: "user",
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to update role");
            }



            const userResponse = await fetchWithAuth(
                `${API_URL}/api/users`
            );

            const usersData = await userResponse.json();
            if (Array.isArray(usersData)) {
                onUpdated?.(usersData);
            }
            const updatedUser = usersData.find(
                user => user.user_id === selectedUser.user_id
            );

            setSelectedUser(updatedUser);
            toast.success(`Successfully revoked privileges for user ${formatUsrId(updatedUser.user_id)}.`);
            setIsRevoking(false);

        } catch (error) {
            console.error(error);
            toast.error(error.message)
            setIsRevoking(false);
        }
    };

    const handleUpdateAccountStatus = async (active, reason = null) => {
        try {
            setIsLocking(true);
            setIsActivating(true);
            const response = await fetchWithAuth(
                `${API_URL}/api/users/${selectedUser.user_id}/status`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        active,
                        reason,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to update account status");
            }

            const userResponse = await fetchWithAuth(
                `${API_URL}/api/users`
            );

            const usersData = await userResponse.json();
            if (Array.isArray(usersData)) {
                onUpdated?.(usersData);
            }
            const updatedUser = usersData.find(
                user => user.user_id === selectedUser.user_id
            );

            setSelectedUser(updatedUser);
            setOpenLockAccount(false);
            setActiveTab(TABS[1].value)
            setIsLocking(false);
            setOpenActivateAccount(false);
            setIsActivating(false);
            if (active) {
                toast.success(`Account unlocked for user ${formatUsrId(updatedUser.user_id)}.`);
            } else {
                toast.success(`Account locked for user ${formatUsrId(updatedUser.user_id)}.`);
            }


        } catch (error) {
            console.error(error);
            toast.error(error.message)
            setIsLocking(false);
            setIsActivating(false);
        }
    };

    const [actionLogs, setActionLogs] = useState([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);

    const fetchUserActionLogs = async (userId) => {
        try {
            setIsLoadingLogs(true);
            const response = await fetchWithAuth(`${API_URL}/api/action-logs/user/${userId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch activity logs");
            }

            const userLogs = data.filter((log) => log.user_id === userId);
            setActionLogs(userLogs);
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setIsLoadingLogs(false);
        }
    };

    const handleExportActivity = async () => {
        try {
            setIsExporting(true);
            setOpenExportActivity(false);

            const response = await fetchWithAuth(
                `${API_URL}/api/export/action-logs/csv?userId=${selectedUser.user_id}`
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to export activity logs.");
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `activity_${formatUsrId(selectedUser.user_id)}_${new Date().toISOString().slice(0, 10)}.csv`;
            link.click();
            URL.revokeObjectURL(url);

            toast.success(`Activity log for ${formatUsrId(selectedUser.user_id)} exported successfully.`);
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setIsExporting(false);
        }
    };

    useEffect(() => {
        if (selectedUser?.user_id) {
            fetchUserActionLogs(selectedUser.user_id);
        }
    }, [selectedUser?.user_id]);

    return (
        <>
            <div className="fixed  inset-0 z-100 w-screen h-screen bg-black/20 flex items-center justify-center">
                <div className="absolute top-0 right-0 h-full w-3/10 bg-white flex flex-col">
                    <div className="w-full h-fit sticky top-0 z-50">
                        <div className="w-full h-15 bg-primary items-center flex pl-2 gap-4 shrink-0">
                            <p className="text-white font-semibold text-md xl:text-lg pl-2">User Account Details</p>
                            <div className="ml-auto pr-6">
                                <button onClick={() => setSelectedUser(null)}><i className="fa-solid fa-x text-xs xl:text-sm text-white"></i></button>
                            </div>
                        </div>
                        <div className="h-10 w-full bg-[#F5F5F5] flex shrink-0 z-50">
                            {TABS.map((tab) =>
                                <button
                                    key={tab.label}
                                    onClick={() => setActiveTab(tab.value)}
                                    className={`text-[#6B5C42]  text-[10px] xl:text-sm  cursor-pointer flex-1
                                        ${activeTab === tab.value && "bg-primary text-white font-semibold border-b-2 border-b-(--color-quaternary) "} 
                                        `}
                                >
                                    {tab.label}
                                </button>
                            )
                            }
                        </div>
                    </div>
                    <div className="h-full w-full p-5 overflow-auto">
                        {activeTab === 'PROFILE' &&
                            (
                                <>
                                    <div className="flex gap-3 xl:gap-6">
                                        <div className="h-20 w-20 rounded-full p-1 border border-(--color-quaternary) shrink-0">
                                            <img src={selectedUser.prfile_image_url || "https://t3.ftcdn.net/jpg/18/48/72/28/360_F_1848722869_Mld2cRALJUqHaN2mdDt1JIqufXkAf1DI.jpg"}
                                                alt={fullName}
                                                className="w-full h-full rounded-full object-contain"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div>
                                                <p className="font-semibold">{fullName}</p>
                                            </div>
                                            <div className={`flex flex-col px-2 py-1 rounded-full text-xs w-fit
                                                ${selectedUser.user_role === 'user' && "bg-[#E6F1FB] text-[#2980B9]"}
                                        ${selectedUser.user_role == 'faculty' && "bg-gray-200 text-gray-700"}
                                        ${selectedUser.user_role == 'admin' && "bg-[#FFF3CD] text-[#856404]"}
                                        ${selectedUser.user_role == 'super_admin' && "bg-[#EDE7F6] text-[#6A1B9A]"}
                                          `}>
                                                <p>
                                                    {selectedUser.user_role === 'user' && "Student"}
                                                    {selectedUser.user_role === 'faculty' && "Faculty"}
                                                    {selectedUser.user_role === 'admin' && "Admin"}
                                                    {selectedUser.user_role === 'super_admin' && "Super Admin"}
                                                </p>
                                            </div>
                                        </div>

                                    </div>
                                    <div className="flex flex-col gap-4 py-5">
                                        <div className="flex  gap-2">
                                            <div className="flex flex-col flex-1">
                                                <p className="text-xs text-[#6B5C42]">USER ID</p>
                                                <p className="text-xs">{formatUsrId(selectedUser.user_id)}</p>
                                            </div>
                                            <div className="flex flex-col flex-1">
                                                <p className="text-xs text-[#6B5C42]">STUDENT NUMBER</p>
                                                <p className="text-xs">{selectedUser.student_number}</p>
                                            </div>
                                        </div>
                                        <div className="flex  gap-2">
                                            <div className="flex flex-col flex-1">
                                                <p className="text-xs text-[#6B5C42]">COLLEGE</p>
                                                <p className="text-xs">{selectedUser.office_name || "N/A"}</p>
                                            </div>
                                            <div className="flex flex-col flex-1">
                                                <p className="text-xs text-[#6B5C42]">COURSE & SECTION</p>
                                                <p className="text-xs">{selectedUser.course_section || "N/A"}</p>
                                            </div>
                                        </div>
                                        <div className="flex  gap-2">
                                            <div className="flex flex-col flex-1">
                                                <p className="text-xs text-[#6B5C42]">BULSU EMAIL</p>
                                                <p className="text-xs">{selectedUser.email || "N/A"}</p>
                                            </div>
                                        </div>
                                        <div className="flex  gap-2">
                                            <div className="flex flex-col flex-1">
                                                <p className="text-xs text-[#6B5C42]">DATE REGISTERED</p>
                                                <p className="text-xs">{formatDate(selectedUser.created_at) || "N/A"}</p>
                                            </div>
                                        </div>
                                        <div className="flex  gap-2">

                                            <div className="flex flex-col flex-1">
                                                <p className="text-xs text-[#6B5C42]">STATUS</p>
                                                <div
                                                    className={`px-3 py-1 rounded-full text-xs font-medium w-fit
                                        ${selectedUser.status === true && "bg-green-100 text-green-700"}
                                        ${selectedUser.status == false && "bg-gray-200 text-gray-700"}
                                        `}
                                                >
                                                    <p>
                                                        {selectedUser.status === true && "Active"}
                                                        {selectedUser.status === false && "Locked"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {selectedUser.user_role === 'admin' &&
                                        (
                                            <div className="w-full h-fit bg-[#F9ECEC] rounded-lg flex flex-col p-4 gap-4 shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)]">
                                                <p className="text-primary font-semibold text-sm">Admin Assignment</p>
                                                <div className="flex  gap-2">
                                                    <div className="flex flex-col flex-1">
                                                        <p className="text-xs text-[#6B5C42]">ASSIGNED CENTER</p>
                                                        <p className="text-xs">{selectedUser.admin_office_name || "N/A"}</p>
                                                    </div>
                                                    <div className="flex flex-col flex-1">
                                                        <p className="text-xs text-[#6B5C42]">DATE ASSIGNED</p>
                                                        <p className="text-xs">{formatDate(selectedUser.admin_created_at || "N?A")}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    isSolid={true}
                                                    disabled={isRevoking}
                                                    label={isRevoking ? "Revoking..." : "Revoke Admin Privileges"}
                                                    onClick={() => setOpenRevokePrivillege(true)}
                                                />
                                            </div>
                                        )

                                    }
                                </>
                            )
                        }
                        {activeTab === 'ACCOUNT_SETTINGS' &&
                            (
                                <>
                                    {selectedUser.status === true &&
                                        (
                                            <>
                                                <div className="w-full h-fit  rounded-lg flex flex-col p-4 gap-4 border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)]">

                                                    <div className="flex  gap-2">
                                                        <div className="flex flex-col flex-1">
                                                            <p className="font-semibold text-xs xl:text-sm ">Account Status</p>
                                                            <div className="flex  flex-1 items-center gap-2 text-[10px] xl:text-xs">
                                                                <p className=" text-[#6B5C42]">Current: </p>
                                                                <div
                                                                    className={`px-3 py-1 rounded-full  font-medium w-fit
                                                    ${selectedUser.status === true && "bg-green-100 text-green-700"}
                                                    ${selectedUser.status == false && "bg-gray-200 text-gray-700"}
                                                    `}
                                                                >
                                                                    <p>
                                                                        {selectedUser.status === true && "Active"}
                                                                        {selectedUser.status === false && "Locked"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-1 gap-2 text-[10px] xl:text-xs ">
                                                            <button
                                                                className="rounded-md bg-[#2E7D32] px-3  transition-transform duration-100 justify-center 
                                                text-white font-medium flex-1 disabled:opacity-40 disabled:cursor-not-allowed
                                                ">Active</button>
                                                            <button
                                                                className="rounded-md px-3 border border-primary transition-transform duration-100 justify-center 
                                                    text-primary font-medium flex-1 disabled:opacity-40 disabled:cursor-not-allowed enabled:active:scale-95"
                                                                onClick={() => setOpenLockAccount(true)}
                                                                disabled={isLocking || selectedUser.status === false}
                                                            >
                                                                {isLocking ? "Locking..." : "Lock"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <p className="text-[10px] xl:text-xs text-[#C0392B]">Locking prevents user from logging in.</p>
                                                </div>
                                                <div className="flex flex-col h-fit gap-2 w-full my-4">
                                                    <Button

                                                        isSolid={true}
                                                        label={"Reset Password"}
                                                        onClick={()=>setOpenResetPassword(true)}

                                                    />
                                                </div>

                                            </>
                                        )
                                    }
                                    {selectedUser.status === false &&
                                        (
                                            <>
                                                <div className="w-full h-fit bg-[#FFF3E0] rounded-lg flex flex-col p-4 gap-4 border border-(--color-quaternary) ">
                                                    <div className="text-[#E65100] font-semibold flex gap-2">
                                                        <Lock size={15} />
                                                        <p className="text-xs xl:text-sm">Account Locked</p>
                                                    </div>
                                                    <div className="text-xs xl:text-sm text-[#E65100] flex flex-col gap-2">
                                                        <p>This account was locked by the administrator.</p>
                                                        <p>Lock on {formatDateTime((selectedUser.date_locked))}</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col h-fit gap-2 w-full my-4">
                                                    <Button
                                                        isSolid={true}
                                                        disabled={isActivating}
                                                        label={isActivating ? "Unlocking..." : "Unlock Account"}
                                                        onClick={() => setOpenActivateAccount(true)}
                                                    />
                                                    <Button
                                                        isBorder={true}
                                                        isSolid={false}
                                                        label={"Reset Password"}
                                                   

                                                    />
                                                </div>


                                            </>
                                        )
                                    }
                                </>
                            )
                        }
                        {activeTab === 'ACTIVITY' &&
                            (
                                <div className="flex flex-col gap-3">
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            disabled={isExporting || actionLogs.length === 0}
                                            onClick={() => setOpenExportActivity(true)}
                                            className="flex items-center gap-2 border border-primary text-primary px-3 py-1.5 rounded-md text-xs font-medium
                                                transition-transform duration-100 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <Download size={14} />
                                            {isExporting ? "Exporting..." : "Export Activity"}
                                        </button>
                                    </div>

                                    {isLoadingLogs && (
                                        <p className="text-xs text-[#6B5C42]">Loading activity...</p>
                                    )}

                                    {!isLoadingLogs && actionLogs.length === 0 && (
                                        <p className="text-xs text-[#6B5C42]">No activity found.</p>
                                    )}

                                    {!isLoadingLogs && actionLogs.map((log) => (
                                        <div
                                            key={log.action_log_id}
                                            className="w-full p-4 rounded-r-lg bg-[#FAFAFA] border-l-4 border-l-(--color-quaternary) flex flex-col gap-2
                                            shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)]"
                                        >
                                            <p className="font-semibold text-sm xl:text-lg">
                                                {formatActionType(log.action_type)}
                                            </p>
                                            {log.description && (
                                                <p className="text-xs text-[#6B5C42]">{log.description}</p>
                                            )}
                                            <p className="text-xs text-[#6B5C42]">
                                                {formatDateTime(log.created_at)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )
                        }
                    </div>
                </div>
            </div>
            {openRevokePrivillege &&
                <ConfirmDialog
                    Icon={TriangleAlert}
                    iconColor="text-(--color-quaternary)"
                    onClose={() => setOpenRevokePrivillege(false)}
                    onConfirm={handleRevokeAdmin}
                    title="Confirm Action"
                    description={
                        <>
                            Revoke admin privileges for <span className="font-bold">{fullName}</span>
                        </>
                    }
                    cancelText="Cancel"
                    confirmText="Confirm Revoke"
                    message={"This action will be permanently logged in the action log."}

                />
            }

            {openRevokePrivillege &&
                <ConfirmDialog
                    Icon={TriangleAlert}
                    iconColor="text-(--color-quaternary)"
                    onClose={() => setOpenRevokePrivillege(false)}
                    onConfirm={handleRevokeAdmin}
                    title="Lock Account"
                    description={
                        <>
                            Revoke admin privileges for <span className="font-bold">{fullName}</span>
                        </>
                    }
                    cancelText="Cancel"
                    confirmText="Confirm Revoke"
                    message={"This action will be permanently logged in the action log."}

                />
            }
            {openLockAccount &&
                (

                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-1040">
                        <div className="relative bg-white rounded-lg w-100 max-w-[90vw]">

                            <div className="w-full h-10 rounded-t-lg bg-primary text-white flex items-center justify-between px-5">
                                <p className="font-semibold">Lock Account</p>

                                <button onClick={() => setOpenLockAccount(false)}>
                                    <i className="fa-solid fa-x text-sm text-white" />
                                </button>
                            </div>


                            <div className="p-4">
                                <div className="flex justify-center mb-4">
                                    {/* Renders the passed Icon dynamically */}
                                    <Lock size={40} className="text-primary" />
                                </div>

                                <div className="flex flex-col gap-6">
                                    <p className={`text-sm text-center font-medium "text-center"`}>
                                        Are you sure you want to lock the account of {fullName}?
                                    </p>

                                    <p className="text-sm text-justify  ">Locking this account will immediately terminate their active
                                        sessions and prevent the user from logging back into the system.</p>

                                </div>
                                <hr className="border-(--color-tertiary) my-4 opacity-30" />

                                <p className="text-sm ">Reason for locking the account (Optional):</p>
                                <TextArea
                                    placeholder={"e.g., Spam/fake reports, Fraudulent claims, etc."}
                                    value={lockingReason}
                                    onChange={setLockingReason}
                                />

                                <hr className="border-(--color-tertiary) my-4 opacity-30" />

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        className="flex-1 h-10 bg-white border border-primary rounded-lg text-primary text-sm font-medium transition-transform duration-100 active:scale-95"
                                        onClick={() => setOpenLockAccount(false)}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        className="flex-1 h-10 bg-primary rounded-lg text-white text-sm font-medium transition-transform duration-100 enabled:active:scale-95
                                        disabled:opacity-40 disabled:cursor-not-allowed"
                                        disabled={isLocking}
                                        onClick={() => handleUpdateAccountStatus(false, lockingReason)}
                                    >
                                        {isLocking ? "Locking..." : "Lock Acount"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                )

            }
            {openActivateAccount &&
                <ConfirmDialog
                    title="Unlock Account"
                    Icon={LockKeyholeOpen}
                    iconColor="text-primary"
                    description={
                        <>
                            Are you sure you want to unlock the account for <strong className="font-semibold">{fullName}</strong>?
                        </>
                    }
                    confirmText={isActivating ? "Unlocking..." : "Unlock Account"}
                    cancelText="Cancel"
                    onClose={() => setOpenActivateAccount(false)}
                    onConfirm={() => handleUpdateAccountStatus(true)}
                    disabled={isActivating}
                />

            }
            {openExportActivity &&
                <ConfirmDialog
                    title="Export Activity Log"
                    Icon={Download}
                    iconColor="text-primary"
                    description={
                        <>
                            Export the activity log for <span className="font-bold">{fullName}</span> ({formatUsrId(selectedUser.user_id)}) as a CSV file?
                        </>
                    }
                    confirmText={isExporting ? "Exporting..." : "Export"}
                    cancelText="Cancel"
                    onClose={() => setOpenExportActivity(false)}
                    onConfirm={handleExportActivity}
                    disabled={isExporting}
                />
            }
            {openResetPassword &&
            <ResetPasswordModal
                user={selectedUser}
                onClose={()=>setOpenResetPassword(false)}
            />

            }
        </>
    )
}