import { useState } from "react";
import { MapPin } from "lucide-react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";
import ConfirmDialog from "../global-components/ConfirmDialog";

const TYPE_OPTIONS = [
    { value: "COLLEGE", label: "College Building" },
    { value: "SHARED_SPACE", label: "Shared Student Spaces" },
    { value: "GATE", label: "Gates" },
];

export default function AddLocationModal({ onClose, onUpdated }) {
    const API_URL = import.meta.env.VITE_API_URL;

    const [type, setType] = useState(TYPE_OPTIONS[0].value);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    const checkProgress =
        name !== "" ||
        description !== "";

    const [openConfirmAdd, setOpenConfirmAdd] = useState(false);
    const [openCancelAdd, setOpenCancelAdd] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError("Location name is required.");
            return;
        }

        try {
            setOpenConfirmAdd(false);
            setIsSaving(true);
            setError("");

            const response = await fetchWithAuth(
                `${API_URL}/api/locations`, {
                    method: "POST",
                    body: JSON.stringify({
                        type,
                        name: name.trim(),
                        description: description.trim(),
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to add location.");
            }

            const listResponse = await fetchWithAuth(`${API_URL}/api/locations/private`);
            const listData = await listResponse.json();

            if (Array.isArray(listData)) {
                onUpdated?.(listData);
            }

            toast.success(`Location "${name.trim()}" added successfully`);
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to create location.");
            toast.error(err.message || "Failed to create location.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-1040">
                <div className="relative bg-white rounded-lg w-100 max-w-[90vw]">
                    <div className="w-full h-10 rounded-t-lg bg-primary text-white flex items-center justify-between px-5">
                        <p className="font-semibold">Add Location</p>
                        <button onClick={onClose}>
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
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none"
                                >
                                    {TYPE_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-[#1A1208]">
                                    Location Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Pimentel Hall"
                                    className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none"
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-[#1A1208]">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Brief description of this location"
                                    rows={3}
                                    className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none resize-none"
                                />
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
                                    if (checkProgress) {
                                        setOpenCancelAdd(true);
                                    } else {
                                        onClose();
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
                                disabled={isSaving || name === ""}
                                onClick={() => setOpenConfirmAdd(true)}
                            >
                                {isSaving ? "Creating..." : "Add Location"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {openConfirmAdd && (
                <ConfirmDialog
                    title="Confirm Add Location"
                    cancelText="Cancel"
                    description={
                        <>
                            Confirm adding location: <span className="font-semibold">{name}</span>?
                        </>
                    }
                    confirmText="Confirm"
                    onClose={() => setOpenConfirmAdd(false)}
                    onConfirm={handleSubmit}
                />
            )}
            {openCancelAdd && (
                <ConfirmDialog
                    description={"Are you sure you want to discard progress?"}
                    onClose={() => setOpenCancelAdd(false)}
                    onConfirm={onClose}
                />
            )}
        </>
    );
}