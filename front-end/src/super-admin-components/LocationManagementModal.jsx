import { useState } from "react";
import Button from "../global-components/Button";
import ConfirmDialog from "../global-components/ConfirmDialog";
import { TriangleAlert, Power } from "lucide-react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";
import LocationEditTab from "./LocationEditTab";

const TYPE_LABELS = {
    COLLEGE: "College Building",
    SHARED_SPACE: "Shared Student Spaces",
    GATE: "Gates",
};

export default function LocationManagementModal({
    selectedLocation,
    setSelectedLocation,
    onUpdated,
}) {
    const API_URL = import.meta.env.VITE_API_URL;

    const [isTogglingStatus, setIsTogglingStatus] = useState(false);

    // Edit mode: LocationEditTab owns the form, saving, and its own confirmations
    const [isEditing, setIsEditing] = useState(false);
    const [isEditDirty, setIsEditDirty] = useState(false);

    const [openDeactivate, setOpenDeactivate] = useState(false);
    const [openActivate, setOpenActivate] = useState(false);
    const [openCancelEdit, setOpenCancelEdit] = useState(false);

    const formatLocId = (type, id) => `${type}-${String(id).padStart(5, "0")}`;

    const refreshLocations = async () => {
        const response = await fetchWithAuth(`${API_URL}/api/locations/private`);
        const data = await response.json();

        if (Array.isArray(data)) {
            onUpdated?.(data);
        }

        return data.find(
            (loc) =>
                loc.location_id === selectedLocation.location_id &&
                loc.location_type === selectedLocation.location_type
        );
    };

    const closeEditMode = () => {
        setIsEditing(false);
        setIsEditDirty(false);
    };

    const handleClosePanel = () => {
        if (isEditing && isEditDirty) {
            setOpenCancelEdit(true);
        } else {
            setSelectedLocation(null);
        }
    };

    const handleToggleStatus = async (status) => {
        try {
            setIsTogglingStatus(true);
            setOpenDeactivate(false);
            setOpenActivate(false);

            const response = await fetchWithAuth(
                `${API_URL}/api/locations/${selectedLocation.location_id}/status`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        type: selectedLocation.location_type,
                        status,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update location status");
            }

            const updatedLocation = await refreshLocations();
            setSelectedLocation(updatedLocation);

            toast.success(
                status
                    ? `Location ${formatLocId(selectedLocation.location_type, selectedLocation.location_id)} activated.`
                    : `Location ${formatLocId(selectedLocation.location_type, selectedLocation.location_id)} deactivated.`
            );
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setIsTogglingStatus(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-100 w-screen h-screen bg-black/20 flex items-center justify-center">
                <div
                    className="absolute top-0 right-0 h-full w-3/10 bg-white flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-full h-15 bg-primary items-center flex pl-2 gap-4 shrink-0">
                        <p className="text-white font-semibold text-md xl:text-lg pl-2">
                            {isEditing ? "Edit Location" : "Location Details"}
                        </p>
                        <div className="ml-auto pr-6">
                            <button onClick={handleClosePanel}>
                                <i className="fa-solid fa-x text-xs xl:text-sm text-white"></i>
                            </button>
                        </div>
                    </div>

                    <div className="h-full w-full p-5 overflow-auto flex flex-col gap-6">
                        {isEditing ? (
                            <LocationEditTab
                                selectedLocation={selectedLocation}
                                setSelectedLocation={setSelectedLocation}
                                refreshLocations={refreshLocations}
                                locLabel={formatLocId(selectedLocation.location_type, selectedLocation.location_id)}
                                disabled={isTogglingStatus}
                                onDirtyChange={setIsEditDirty}
                                onSaved={closeEditMode}
                                onCancel={closeEditMode}
                            />
                        ) : (
                            <>
                                {/* Location Details (view only) */}
                                <div className="flex flex-col gap-4">
                                    <p className="font-semibold text-sm xl:text-base">Location Details</p>

                                    <div className="flex flex-col gap-1">
                                        <p className="text-xs text-[#6B5C42]">LOCATION ID</p>
                                        <p className="text-xs">
                                            {formatLocId(selectedLocation.location_type, selectedLocation.location_id)}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <p className="text-xs text-[#6B5C42]">LOCATION NAME</p>
                                        <p className="text-xs">{selectedLocation.location_name || "N/A"}</p>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <p className="text-xs text-[#6B5C42]">DESCRIPTION</p>
                                        <p className="text-xs whitespace-pre-wrap">
                                            {selectedLocation.description || "No description provided."}
                                        </p>
                                    </div>

                                    <div className="flex">
                                        <div className="flex flex-col gap-1 flex-1">
                                            <p className="text-xs text-[#6B5C42]">TYPE</p>
                                            <p className="text-xs">
                                                {TYPE_LABELS[selectedLocation.location_type] || selectedLocation.location_type}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-1 flex-1">
                                            <p className="text-xs text-[#6B5C42]">STATUS</p>
                                            <div
                                                className={`px-3 py-1 rounded-full text-xs font-medium w-fit
                                                    ${selectedLocation.status === true && "bg-green-100 text-green-700"}
                                                    ${selectedLocation.status === false && "bg-gray-200 text-gray-700"}
                                                `}
                                            >
                                                <p>
                                                    {selectedLocation.status === true && "Active"}
                                                    {selectedLocation.status === false && "Inactive"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-4 mt-auto">
                                    <hr className="border-(--color-tertiary) opacity-30" />

                                    {selectedLocation.status === true && (
                                        <div className="flex w-full gap-2 h-10">
                                            <div className="flex-1 h-full">
                                                <div className="flex flex-col h-full">
                                                    <Button
                                                        isSolid={true}
                                                        disabled={isTogglingStatus}
                                                        label="Edit Location"
                                                        onClick={() => setIsEditing(true)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-1 h-full">
                                                <div className="flex flex-col h-full">
                                                    <Button
                                                        isBorder={true}
                                                        isSolid={false}
                                                        disabled={isTogglingStatus}
                                                        label={isTogglingStatus ? "Deactivating..." : "Deactivate Location"}
                                                        onClick={() => setOpenDeactivate(true)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {selectedLocation.status === false && (
                                        <>
                                            <p className="text-xs text-[#6B5C42]">
                                                This location is currently inactive and hidden from item listings.
                                            </p>
                                            <div className="flex w-full gap-2">
                                                <div className="flex-1">
                                                    <div className="flex flex-col">
                                                        <Button
                                                            isBorder={true}
                                                            isSolid={false}
                                                            disabled={isTogglingStatus}
                                                            label="Edit Location"
                                                            onClick={() => setIsEditing(true)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex flex-col">
                                                        <Button
                                                            isSolid={true}
                                                            disabled={isTogglingStatus}
                                                            label={isTogglingStatus ? "Activating..." : "Activate Location"}
                                                            onClick={() => setOpenActivate(true)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {openDeactivate && (
                <ConfirmDialog
                    Icon={TriangleAlert}
                    iconColor="text-(--color-quaternary)"
                    title="Deactivate Location"
                    description={
                        <>
                            Are you sure you want to deactivate{" "}
                            <span className="font-bold">{selectedLocation.location_name}</span>?
                        </>
                    }
                    message={"This action will be permanently logged in the action log."}
                    cancelText="Cancel"
                    confirmText={isTogglingStatus ? "Deactivating..." : "Deactivate"}
                    onClose={() => setOpenDeactivate(false)}
                    onConfirm={() => handleToggleStatus(false)}
                    disabled={isTogglingStatus}
                />
            )}

            {openActivate && (
                <ConfirmDialog
                    Icon={Power}
                    iconColor="text-primary"
                    title="Activate Location"
                    description={
                        <>
                            Are you sure you want to activate{" "}
                            <span className="font-bold">{selectedLocation.location_name}</span>?
                        </>
                    }
                    message={"This action will be permanently logged in the action log."}
                    cancelText="Cancel"
                    confirmText={isTogglingStatus ? "Activating..." : "Activate"}
                    onClose={() => setOpenActivate(false)}
                    onConfirm={() => handleToggleStatus(true)}
                    disabled={isTogglingStatus}
                />
            )}

            {/* Closing the panel while there are unsaved edits */}
            {openCancelEdit && (
                <ConfirmDialog
                    description={
                        <>
                            Are you sure you want to discard your edits to{" "}
                            <span className="font-semibold">{selectedLocation.location_name}</span>?
                        </>
                    }
                    onClose={() => setOpenCancelEdit(false)}
                    onConfirm={() => setSelectedLocation(null)}
                    disabled={isTogglingStatus}
                />
            )}
        </>
    );
}
