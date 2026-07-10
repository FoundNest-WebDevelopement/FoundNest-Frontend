import { useState } from "react";
import { MapPin } from "lucide-react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";
import ConfirmDialog from "../global-components/ConfirmDialog";

const TYPE_LABELS = {
    COLLEGE: "College Building",
    SHARED_SPACE: "Shared Student Spaces",
    GATE: "Gates",
};

export default function LocationManagementModal({ selectedLocation, setSelectedLocation, onUpdated }) {
    const API_URL = import.meta.env.VITE_API_URL;

    const [name, setName] = useState(selectedLocation.location_name || "");
    const [description, setDescription] = useState(selectedLocation.description || "");
    const [status, setStatus] = useState(selectedLocation.status);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [openCancelConfirmDialog, setOpenCancelConfirmDialog] = useState(false);

    const hasChanges =
        name !== (selectedLocation.location_name || "") ||
        description !== (selectedLocation.description || "") ||
        status !== selectedLocation.status;

    const handleClose = () => setSelectedLocation(null);

    const handleSubmit = async () => {
        setOpenConfirmDialog(false);

        if (!name.trim()) {
            setError("Location name is required.");
            return;
        }

        try {
            setIsSaving(true);
            setError("");

            const response = await fetchWithAuth(
                `${API_URL}/api/locations/${selectedLocation.location_id}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        type: selectedLocation.location_type,
                        name: name.trim(),
                        description: description.trim(),
                        status,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update location.");
            }

            const listResponse = await fetchWithAuth(`${API_URL}/api/locations/private`);
            const listData = await listResponse.json();

            if (Array.isArray(listData)) {
                onUpdated?.(listData);
            }

            toast.success(`Successfully updated "${name.trim()}".`);
            handleClose();
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to update location.");
            toast.error(err.message || "Failed to update location.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-1040">
                <div className="relative bg-white rounded-lg w-100 max-w-[90vw]">
                    <div className="w-full h-10 rounded-t-lg bg-primary text-white flex items-center justify-between px-5">
                        <p className="font-semibold">Edit Location</p>
                        <button
                            onClick={() => {
                                if (hasChanges) {
                                    setOpenCancelConfirmDialog(true);
                                } else {
                                    handleClose();
                                }
                            }}
                        >
                            <i className="fa-solid fa-x text-sm text-white" />
                        </button>
                    </div>

                    <div className="p-4">
                        <div className="flex justify-center mb-4">
                            <MapPin size={40} className="text-primary" />
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-[#1A1208]">
                                    Type
                                </label>
                                <input
                                    type="text"
                                    disabled
                                    value={TYPE_LABELS[selectedLocation.location_type] || selectedLocation.location_type}
                                    className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm bg-[#F5F5F5] text-[#6B5C42]"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-[#1A1208]">
                                    Location Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none
                                        focus:border-primary"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-[#1A1208]">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={2}
                                    className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none resize-none
                                        focus:border-primary"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-[#1A1208]">
                                    Status
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setStatus((prev) => !prev)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-transform active:scale-95
                                        ${status ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}
                                >
                                    {status ? "Active" : "Inactive"}
                                </button>
                            </div>

                            {error && (
                                <p className="text-xs text-[#C0392B]">{error}</p>
                            )}
                        </div>

                        <hr className="border-(--color-tertiary) my-4 opacity-30" />

                        <div className="flex gap-2">
                            <button
                                type="button"
                                className="flex-1 h-10 bg-white border border-primary rounded-lg text-primary text-sm font-medium
                                    transition-transform duration-100 active:scale-95"
                                onClick={() => {
                                    if (hasChanges) {
                                        setOpenCancelConfirmDialog(true);
                                    } else {
                                        handleClose();
                                    }
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="flex-1 h-10 bg-primary rounded-lg text-white text-sm font-medium
                                    transition-transform duration-100 enabled:active:scale-95
                                    disabled:opacity-40 disabled:cursor-not-allowed"
                                disabled={isSaving || !hasChanges}
                                onClick={() => setOpenConfirmDialog(true)}
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {openConfirmDialog && (
                <ConfirmDialog
                    title="Save Changes?"
                    cancelText="Cancel"
                    confirmText="Save"
                    description={"Do you want to save changes for this location?"}
                    onClose={() => setOpenConfirmDialog(false)}
                    onConfirm={handleSubmit}
                />
            )}

            {openCancelConfirmDialog && (
                <ConfirmDialog
                    description={"Do you want to discard progress in this edit location form?"}
                    onClose={() => setOpenCancelConfirmDialog(false)}
                    onConfirm={handleClose}
                />
            )}
        </>
    );
}