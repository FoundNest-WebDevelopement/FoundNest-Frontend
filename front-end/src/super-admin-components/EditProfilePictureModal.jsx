import { useState } from "react";
import { UserCircle2, Upload, Trash2 } from "lucide-react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";
import ConfirmDialog from "../global-components/ConfirmDialog";

export default function EditProfilePictureModal({ profile, userId, onClose, onUpdated }) {
    const API_URL = import.meta.env.VITE_API_URL;

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(profile.profile_image_url || "");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [openConfirmRemove, setOpenConfirmRemove] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setError("");
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        try {
            setIsSaving(true);
            setError("");

            const formData = new FormData();
            formData.append("profile_image", selectedFile);

            const response = await fetchWithAuth(
                `${API_URL}/api/profile/${userId}/picture`,
                {
                    method: "PUT",
                    body: formData,
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update profile picture.");
            }

            toast.success("Profile picture updated successfully.");
            onUpdated?.();
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to update profile picture.");
            toast.error(err.message || "Failed to update profile picture.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemove = async () => {
        try {
            setIsSaving(true);
            setError("");

            const response = await fetchWithAuth(
                `${API_URL}/api/profile/${userId}/picture`,
                { method: "DELETE" }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to remove profile picture.");
            }

            toast.success("Profile picture removed.");
            onUpdated?.();
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to remove profile picture.");
            toast.error(err.message || "Failed to remove profile picture.");
        } finally {
            setIsSaving(false);
            setOpenConfirmRemove(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-1040">
                <div className="relative bg-white rounded-lg w-100 max-w-[90vw]">
                    <div className="w-full h-10 rounded-t-lg bg-primary text-white flex items-center justify-between px-5">
                        <p className="font-semibold">Edit Profile Picture</p>
                        <button onClick={onClose}>
                            <i className="fa-solid fa-x text-sm text-white" />
                        </button>
                    </div>

                    <div className="p-4 flex flex-col items-center gap-4">
                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-28 h-28 rounded-full object-cover border border-[#E5E1D8]"
                            />
                        ) : (
                            <div className="w-28 h-28 rounded-full bg-[#F5F5F5] border border-[#E5E1D8] flex items-center justify-center">
                                <UserCircle2 size={60} className="text-[#9A8F7C]" strokeWidth={1.5} />
                            </div>
                        )}

                        <label className="flex items-center gap-2 px-4 py-2 rounded-md border border-primary text-primary text-sm font-medium cursor-pointer transition-transform active:scale-95">
                            <Upload size={14} />
                            Choose New Photo
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>

                        {error && <p className="text-xs text-[#C0392B]">{error}</p>}

                        <hr className="w-full border-(--color-tertiary) opacity-30 my-1" />

                        <div className="w-full flex gap-2">
                            <button
                                type="button"
                                className="flex-1 h-10 bg-white border border-[#C0392B] rounded-lg text-[#C0392B] text-sm font-medium
                                    transition-transform duration-100 enabled:active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
                                    flex items-center justify-center gap-2"
                                disabled={isSaving || !profile.profile_image_url}
                                onClick={() => setOpenConfirmRemove(true)}
                            >
                                <Trash2 size={14} />
                                Remove Photo
                            </button>
                            <button
                                type="button"
                                className="flex-1 h-10 bg-primary rounded-lg text-white text-sm font-medium
                                    transition-transform duration-100 enabled:active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                                disabled={isSaving || !selectedFile}
                                onClick={handleUpload}
                            >
                                {isSaving ? "Saving..." : "Save Photo"}
                            </button>
                        </div>

                        <button
                            type="button"
                            className="w-full h-9 text-[#6B5C42] text-sm"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>

            {openConfirmRemove && (
                <ConfirmDialog
                    title="Remove Profile Picture?"
                    cancelText="Cancel"
                    confirmText="Remove"
                    description="Are you sure you want to remove your profile picture?"
                    onClose={() => setOpenConfirmRemove(false)}
                    onConfirm={handleRemove}
                />
            )}
        </>
    );
}