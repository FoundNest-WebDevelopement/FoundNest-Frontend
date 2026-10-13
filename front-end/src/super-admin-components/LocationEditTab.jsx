import { useEffect, useState } from "react";
import Button from "../global-components/Button";
import ConfirmDialog from "../global-components/ConfirmDialog";
import TextArea from "../global-components/TextArea";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";

const normalize = (value) => String(value ?? "").trim();

const TYPE_OPTIONS = [
    { value: "COLLEGE", label: "College Building" },
    { value: "SHARED_SPACE", label: "Shared Student Spaces" },
    { value: "GATE", label: "Gates" },
];

export default function LocationEditTab({
    selectedLocation,
    setSelectedLocation,
    refreshLocations,
    locations = [],
    disabled = false,
    onDirtyChange,
    onSaved,
    onCancel,
}) {
    const API_URL = import.meta.env.VITE_API_URL;

    const [isSaving, setIsSaving] = useState(false);
    const [locationName, setLocationName] = useState(selectedLocation.location_name || "");
    const [description, setDescription] = useState(selectedLocation.description || "");
    const [type, setType] = useState(selectedLocation.location_type);

    const [openSaveChange, setOpenSaveChange] = useState(false);
    const [openDiscardEdits, setOpenDiscardEdits] = useState(false);

    const trimmedName = locationName.trim();
    const trimmedDescription = description.trim();

    const isNameEmpty = trimmedName === "";

    const isDuplicate = trimmedName
        ? locations.some(
              (loc) =>
                  loc.location_name?.trim().toLowerCase() === trimmedName.toLowerCase() &&
                  !(loc.location_id === selectedLocation.location_id && loc.location_type === selectedLocation.location_type)
          )
        : false;

    const isChanged =
        trimmedName !== normalize(selectedLocation.location_name) ||
        trimmedDescription !== normalize(selectedLocation.description) ||
        type !== selectedLocation.location_type;

    const canSave = isChanged && !isNameEmpty && !isDuplicate;

    useEffect(() => {
        onDirtyChange?.(isChanged);
    }, [isChanged, onDirtyChange]);

    const revertFields = () => {
        setLocationName(selectedLocation.location_name || "");
        setDescription(selectedLocation.description || "");
        setType(selectedLocation.location_type);
    };

    const handleCancel = () => {
        if (isChanged) {
            setOpenDiscardEdits(true);
        } else {
            onCancel?.();
        }
    };

    const handleSaveDetails = async () => {
        setOpenSaveChange(false);

        if (isNameEmpty) {
            toast.error("Location name is required.");
            return;
        }

        if (isDuplicate) {
            toast.error(`A location named "${trimmedName}" already exists.`);
            return;
        }

        if (!isChanged) {
            toast.info("No changes to save.");
            return;
        }

        try {
            setIsSaving(true);

            const response = await fetchWithAuth(
                `${API_URL}/api/locations/${selectedLocation.location_id}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        type,
                        originalType: selectedLocation.location_type,
                        name: trimmedName,
                        description: trimmedDescription,
                        status: selectedLocation.status,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update location");
            }

            // `data` is already the normalized, up-to-date record — used directly
            // instead of re-searching the refreshed list by the OLD id/type, which
            // would no longer match if the type (and therefore the id) just changed.
            await refreshLocations();
            setSelectedLocation(data);

            setLocationName(data.location_name || "");
            setDescription(data.description || "");
            setType(data.location_type);

            const updatedLabel = `${data.location_type}-${String(data.location_id).padStart(5, "0")}`;
            toast.success(`Successfully updated ${updatedLabel}.`);
            onSaved?.();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const locked = disabled || isSaving;

    return (
        <>
            <div className="flex flex-col gap-4 h-full">
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-[#6B5C42]">TYPE</label>
                    <select
                        value={type}
                        disabled={locked}
                        onChange={(e) => setType(e.target.value)}
                        className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none
                            disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-[#6B5C42]">LOCATION NAME</label>
                    <input
                        type="text"
                        value={locationName}
                        disabled={locked}
                        onChange={(e) => setLocationName(e.target.value)}
                        className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none
                            disabled:cursor-not-allowed disabled:opacity-40"
                    />
                    {isDuplicate && (
                        <p className="text-xs text-[#C0392B]">
                            A location named "{trimmedName}" already exists.
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-[#6B5C42]">DESCRIPTION</label>
                    <TextArea
                        placeholder="What is this location used for?"
                        disabled={locked}
                        value={description}
                        onChange={setDescription}
                    />
                </div>

                <div className="flex flex-col gap-4 mt-auto">
                    <hr className="border-(--color-tertiary) opacity-30" />
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <div className="flex flex-col">
                                <Button
                                    isBorder={true}
                                    isSolid={false}
                                    disabled={isSaving}
                                    label="Cancel"
                                    onClick={handleCancel}
                                />
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex flex-col">
                                <Button
                                    isSolid={true}
                                    disabled={!canSave || locked}
                                    label={isSaving ? "Saving..." : "Save Changes"}
                                    onClick={() => setOpenSaveChange(true)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {openSaveChange && (
                <ConfirmDialog
                    title="Save Changes"
                    description={
                        <>
                            Are you sure you want to save{" "}
                            <span className="font-bold">{selectedLocation.location_name}</span>?
                        </>
                    }
                    message={
                        type !== selectedLocation.location_type
                            ? "Changing the type assigns this location a new ID. This action will be seen by FoundNest users."
                            : "This action will be seen to public by FoundNest users."
                    }
                    cancelText="Cancel"
                    confirmText={"Save"}
                    onClose={() => setOpenSaveChange(false)}
                    onConfirm={handleSaveDetails}
                    disabled={isSaving}
                />
            )}

            {openDiscardEdits && (
                <ConfirmDialog
                    description={
                        <>
                            Are you sure you want to discard your edits to{" "}
                            <span className="font-semibold">{selectedLocation.location_name}</span>?
                        </>
                    }
                    onClose={() => setOpenDiscardEdits(false)}
                    onConfirm={() => {
                        setOpenDiscardEdits(false);
                        revertFields();
                        onCancel?.();
                    }}
                    disabled={isSaving}
                />
            )}
        </>
    );
}
