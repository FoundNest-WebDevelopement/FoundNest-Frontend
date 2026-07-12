import { useState, useEffect } from "react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";
import ConfirmDialog from "../global-components/ConfirmDialog";
import CampusMapPicker from "./CampusMapPicker";

export default function EditCenterModal({ center, onClose, onUpdated }) {
    const API_URL = import.meta.env.VITE_API_URL;

    const formatCtrId = (id) => `CTR-${String(id).padStart(3, "0")}`;

    const [officeName, setOfficeName] = useState(center?.office_name || "");
    const [floor, setFloor] = useState(center?.floor || "");
    const [operatingHours, setOperatingHours] = useState(center?.operating_hours || "");
    const [notes, setNotes] = useState(center?.description || "");
    const [locationName, setLocationName] = useState(center?.location_name || "");
    const [status, setStatus] = useState(center?.status);
    const [latitude, setLatitude] = useState(center?.latitude ? Number(center.latitude) : null);
    const [longitude, setLongitude] = useState(center?.longitude ? Number(center.longitude) : null);

    const [locationOptions, setLocationOptions] = useState([]);
    const [existingCenters, setExistingCenters] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [openCancelConfirmDialog, setOpenCancelConfirmDialog] = useState(false);

    useEffect(() => {
        const loadLocationOptions = async () => {
            try {
                const response = await fetchWithAuth(`${API_URL}/api/locations/active-names`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to fetch locations.");
                }

                const options =
                    center?.location_name && !data.includes(center.location_name)
                        ? [center.location_name, ...data]
                        : data;

                setLocationOptions(options);
            } catch (err) {
                console.error(err);
                toast.error(err.message || "Failed to load locations.");
            }
        };

        const loadExistingCenters = async () => {
            try {
                const response = await fetchWithAuth(`${API_URL}/api/offices-private/list`);
                const data = await response.json();

                if (response.ok && Array.isArray(data)) {
                    setExistingCenters(
                        data.filter((c) => c.latitude && c.longitude && c.office_id !== center.office_id)
                    );
                }
            } catch (err) {
                console.error(err);
            }
        };

        loadLocationOptions();
        loadExistingCenters();
    }, []);

    const hasChanges =
        officeName !== (center?.office_name || "") ||
        floor !== (center?.floor || "") ||
        operatingHours !== (center?.operating_hours || "") ||
        notes !== (center?.description || "") ||
        locationName !== (center?.location_name || "") ||
        status !== center?.status ||
        latitude !== (center?.latitude ? Number(center.latitude) : null) ||
        longitude !== (center?.longitude ? Number(center.longitude) : null);

    const handleSubmit = async () => {
        setOpenConfirmDialog(false);

        if (!officeName.trim()) {
            setError("Center name is required.");
            return;
        }

        if (!operatingHours.trim()) {
            setError("Operating hours is required.");
            return;
        }

        try {
            setIsSaving(true);
            setError("");

            const response = await fetchWithAuth(
                `${API_URL}/api/offices-private/${center.office_id}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        office_name: officeName.trim(),
                        description: notes.trim(),
                        location_name: locationName,
                        floor: floor.trim(),
                        operating_hours: operatingHours.trim(),
                        image_url: center?.image_url || "",
                        status,
                        latitude,
                        longitude,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || "Failed to update center.");
            }

            const listResponse = await fetchWithAuth(`${API_URL}/api/offices-private/list`);
            const listData = await listResponse.json();

            if (Array.isArray(listData)) {
                onUpdated?.(listData);
            }

            toast.success(`Successfully updated "${officeName.trim()}".`);
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to update center.");
            toast.error(err.message || "Failed to update center.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-1040">
                <div className="relative bg-white rounded-lg w-[900px] max-w-[92vw]">
                    <div className="w-full h-12 rounded-t-lg bg-primary text-white flex items-center justify-between px-5">
                        <p className="font-semibold text-base">
                            Edit Center: {center?.office_name}
                        </p>
                        <button
                            onClick={() => (hasChanges ? setOpenCancelConfirmDialog(true) : onClose())}
                        >
                            <i className="fa-solid fa-x text-sm text-white" />
                        </button>
                    </div>

                    <div className="p-6 max-h-[80vh] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* LEFT COLUMN — FORM */}
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-[#1A1208]">
                                        Center ID
                                    </label>
                                    <input
                                        type="text"
                                        disabled
                                        value={formatCtrId(center.office_id)}
                                        className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm bg-[#F5F5F5] text-[#6B5C42]"
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-[#1A1208]">
                                        Center Name
                                    </label>
                                    <input
                                        type="text"
                                        value={officeName}
                                        onChange={(e) => setOfficeName(e.target.value)}
                                        className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-[#1A1208]">
                                        Location Description
                                    </label>
                                    <input
                                        type="text"
                                        value={floor}
                                        onChange={(e) => setFloor(e.target.value)}
                                        className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-[#1A1208]">
                                        Operating Hours <span className="text-[#C0392B]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={operatingHours}
                                        onChange={(e) => setOperatingHours(e.target.value)}
                                        className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-[#C0392B]">
                                        Notes
                                    </label>
                                    <input
                                        type="text"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                                    />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-[#1A1208]">
                                        Center Building <span className="text-[#C0392B]">*</span>
                                    </label>
                                    <select
                                        value={locationName}
                                        onChange={(e) => setLocationName(e.target.value)}
                                        className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                                    >
                                        <option value="">Select building</option>
                                        {locationOptions.map((loc) => (
                                            <option key={loc} value={loc}>
                                                {loc}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {error && (
                                    <p className="text-xs text-[#C0392B]">{error}</p>
                                )}
                            </div>

                            {/* RIGHT COLUMN — MAP + STATUS */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-[#1A1208]">
                                    Center Location on Map
                                </label>
                                <CampusMapPicker
                                    latitude={latitude}
                                    longitude={longitude}
                                    onChange={(lat, lng) => {
                                        setLatitude(lat);
                                        setLongitude(lng);
                                    }}
                                    referenceCenters={existingCenters}
                                    markerLabel={officeName}
                                />
                                <div className="grid grid-cols-2 gap-2">
    <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-[#6B5C42]">Latitude</label>
        <input
            type="number"
            step="0.00000001"
            value={latitude ?? ""}
            onChange={(e) => setLatitude(e.target.value === "" ? null : parseFloat(e.target.value))}
            className="border border-[#DDD9CF] rounded-md px-3 py-1.5 text-xs outline-none focus:border-primary"
        />
    </div>
    <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-[#6B5C42]">Longitude</label>
        <input
            type="number"
            step="0.00000001"
            value={longitude ?? ""}
            onChange={(e) => setLongitude(e.target.value === "" ? null : parseFloat(e.target.value))}
            className="border border-[#DDD9CF] rounded-md px-3 py-1.5 text-xs outline-none focus:border-primary"
        />
    </div>
</div>
<p className="text-xs text-[#9A8F7C]">
    Click the map to move the pin, drag to adjust, or type coordinates directly above.
</p>

                                <div className="flex items-center justify-between mt-4 border border-[#DDD9CF] rounded-lg px-4 py-3">
                                    <span className="text-sm font-medium text-[#1A1208]">
                                        Center Status
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-medium ${status ? "text-green-700" : "text-gray-500"}`}>
                                            {status ? "Active" : "Inactive"}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setStatus((prev) => !prev)}
                                            className={`relative w-11 h-6 rounded-full transition-colors duration-200
                                                ${status ? "bg-green-600" : "bg-gray-300"}`}
                                        >
                                            <span
                                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200
                                                    ${status ? "translate-x-5" : "translate-x-0"}`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 px-6 pb-6">
                        <button
                            type="button"
                            className="flex-1 h-10 bg-white border border-primary rounded-lg text-primary text-sm font-medium
                                transition-transform duration-100 active:scale-95"
                            onClick={() => (hasChanges ? setOpenCancelConfirmDialog(true) : onClose())}
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

            {openConfirmDialog && (
                <ConfirmDialog
                    title="Save Changes?"
                    cancelText="Cancel"
                    confirmText="Save"
                    description={"Do you want to save changes for this center?"}
                    onClose={() => setOpenConfirmDialog(false)}
                    onConfirm={handleSubmit}
                />
            )}
            {openCancelConfirmDialog && (
                <ConfirmDialog
                    description={"Do you want to discard progress in this edit center form?"}
                    onClose={() => setOpenCancelConfirmDialog(false)}
                    onConfirm={onClose}
                />
            )}
        </>
    );
}