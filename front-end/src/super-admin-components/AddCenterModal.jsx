import { useState, useEffect } from "react";
import { Building2 } from "lucide-react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";
import ConfirmDialog from "../global-components/ConfirmDialog";

export default function AddCenterModal({ onClose, onUpdated }) {
    const API_URL = import.meta.env.VITE_API_URL;

    const [officeName, setOfficeName] = useState("");
    const [floor, setFloor] = useState("");
    const [operatingHours, setOperatingHours] = useState("");
    const [notes, setNotes] = useState("");
    const [locationName, setLocationName] = useState("");

    const [locationOptions, setLocationOptions] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    const [openConfirmAdd, setOpenConfirmAdd] = useState(false);
    const [openCancelAdd, setOpenCancelAdd] = useState(false);

    const checkProgress =
        officeName !== "" ||
        floor !== "" ||
        operatingHours !== "" ||
        notes !== "";

    useEffect(() => {
        const loadLocationOptions = async () => {
            try {
                const response = await fetchWithAuth(`${API_URL}/api/locations/active-names`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to fetch locations.");
                }

                setLocationOptions(data);
            } catch (err) {
                console.error(err);
                toast.error(err.message || "Failed to load locations.");
            }
        };

        loadLocationOptions();
    }, []);

    const handleSubmit = async () => {
        if (!officeName.trim()) {
            setError("Center name is required.");
            return;
        }

        if (!operatingHours.trim()) {
            setError("Operating hours is required.");
            return;
        }

        if (!locationName) {
            setError("Center building is required.");
            return;
        }

        try {
            setOpenConfirmAdd(false);
            setIsSaving(true);
            setError("");

            const response = await fetchWithAuth(
                `${API_URL}/api/offices-private`, {
                    method: "POST",
                    body: JSON.stringify({
                        office_name: officeName.trim(),
                        description: notes.trim(),
                        location_name: locationName,
                        floor: floor.trim(),
                        operating_hours: operatingHours.trim(),
                        image_url: "",
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || "Failed to add center.");
            }

            const listResponse = await fetchWithAuth(`${API_URL}/api/offices-private/list`);
            const listData = await listResponse.json();

            if (Array.isArray(listData)) {
                onUpdated?.(listData);
            }

            toast.success(`Center "${officeName.trim()}" added successfully`);
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to create center.");
            toast.error(err.message || "Failed to create center.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-1040">
                <div className="relative bg-white rounded-lg w-[900px] max-w-[92vw]">
                    <div className="w-full h-12 rounded-t-lg bg-primary text-white flex items-center justify-between px-5">
                        <p className="font-semibold text-base">Add New Center</p>
                        <button onClick={() => (checkProgress ? setOpenCancelAdd(true) : onClose())}>
                            <i className="fa-solid fa-x text-sm text-white" />
                        </button>
                    </div>

                    <div className="p-6 max-h-[80vh] overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* LEFT COLUMN — FORM */}
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium text-[#1A1208]">
                                        Center Name <span className="text-[#C0392B]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={officeName}
                                        onChange={(e) => setOfficeName(e.target.value)}
                                        placeholder="e.g. Pimentel Hall FoundNest Office"
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
                                        placeholder="e.g. 3rd Floor, Room B"
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
                                        placeholder="e.g. Mon–Fri, 8AM–5PM"
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
                                        <option value="">e.g. Pimentel Hall</option>
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

                            {/* RIGHT COLUMN — MAP PLACEHOLDER */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-[#1A1208]">
                                    Center Location on Map
                                </label>
                                <div className="w-full h-64 md:h-full min-h-64 rounded-lg border border-[#DDD9CF] bg-[#F5F5F5] flex items-center justify-center">
                                    <p className="text-sm text-[#9A8F7C]">Map coming soon</p>
                                </div>
                                <button
                                    type="button"
                                    disabled
                                    className="w-full h-10 bg-[#E5E1D8] rounded-md text-[#9A8F7C] text-sm font-medium cursor-not-allowed"
                                >
                                    Plot Building on Map
                                </button>
                                <p className="text-xs text-[#9A8F7C]">
                                    The building name above will be used as the map marker.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 px-6 pb-6">
                        <button
                            type="button"
                            className="flex-1 h-10 bg-white border border-primary rounded-lg text-primary text-sm font-medium
                                transition-transform duration-100 active:scale-95"
                            onClick={() => (checkProgress ? setOpenCancelAdd(true) : onClose())}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="flex-1 h-10 bg-primary rounded-lg text-white text-sm font-medium
                                transition-transform duration-100 enabled:active:scale-95
                                disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={isSaving || officeName === "" || operatingHours === "" || locationName === ""}
                            onClick={() => setOpenConfirmAdd(true)}
                        >
                            {isSaving ? "Saving..." : "Save Center"}
                        </button>
                    </div>
                </div>
            </div>

            {openConfirmAdd && (
                <ConfirmDialog
                    title="Confirm Add Center"
                    cancelText="Cancel"
                    description={
                        <>
                            Confirm adding center: <span className="font-semibold">{officeName}</span>?
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