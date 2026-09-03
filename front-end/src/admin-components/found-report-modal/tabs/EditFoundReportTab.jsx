import { useEffect, useRef, useState } from "react";
import { Upload, CircleMinus, Image as ImageIcon } from "lucide-react";
import { toast } from "react-toastify";

// Utilities & Hooks
import { formatReportId } from "../../../utils/formatId.js";
import { analyzeItemImage } from "../services/foundReportModalServices.js"; 
import { useSaveEditReport } from "../hooks/useSaveEditReport.js";

// Custom Admin Components

import AdminTextArea from "../../AdminTextArea.jsx";
import AdminDateInput from "../../AdminDateInput.jsx";
import AdminHourInput from "../../AdminHourInput.jsx";
import AdminCategoriesDropdown from "../../AdminCategoriesDropdown.jsx";
import AdminConfirmDialog from "../../AdminConfirmDialog.jsx";
import ScaleImage from "../../ScaleImage.jsx";
import AdminTextField from "../../AdminTextField.jsx";

export default function EditFoundReportTab({
    selectedItem,
    setSelectedItem,
    categories = [],
    locations = [], // Used for current office location
    allLocations = [], // Used for location found
    onUpdated,
    setIsEditing, // Replaces setEditTab to close the edit view
    refreshReports
}) {
    const userId = localStorage.getItem("user_id");

    // Hooks
    const { saveEdit, isSavingEdit } = useSaveEditReport();

    // UI & Loading States
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [openDiscardDialog, setOpenDiscardDialog] = useState(false);
    const [openSaveDialog, setOpenSaveDialog] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Image States
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [image, setImage] = useState(null); // Preview URL
    const [selectedImage, setSelectedImage] = useState(null); // For ScaleImage Modal

    // Form Data States
    const [formData, setFormData] = useState({
        item_name: "",
        category_id: "",
        location_found: "",
        specific_location: "",
        found_date: "",
        found_time: "",
        description: "",
        contents: "",
        reported_by: "",
        additional_notes: "",
        office_id: "",
    });
    const [originalFormData, setOriginalFormData] = useState({});

    // === UTILITY FUNCTIONS ===
    function getTodayDateString() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function isValidPastOrToday(dateStr) {
        if (!dateStr) return false;
        const chosen = new Date(`${dateStr}T00:00:00`);
        if (isNaN(chosen.getTime())) return false;
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return chosen <= today;
    }

    function isTimeNotFuture(dateStr, timeStr) {
        if (!dateStr || !timeStr) return false;
        const chosenDate = dateStr;
        const todayDate = getTodayDateString();
        
        if (chosenDate < todayDate) return true;
        
        const [hours, minutes] = timeStr.split(":").map(Number);
        const chosenDateTime = new Date(`${dateStr}T00:00:00`);
        chosenDateTime.setHours(hours, minutes, 0, 0);
        return chosenDateTime <= new Date();
    }

    // === INITIALIZATION ===
    useEffect(() => {
        if (!selectedItem) return;

        setImage(selectedItem?.image_url);
        setSelectedFile(null);

        const foundDate = selectedItem.found_date ? new Date(selectedItem.found_date) : null;

        const initialData = {
            item_name: selectedItem.item_name || "",
            category_id: String(selectedItem.category_id || ""),
            location_found: selectedItem.location_found || "",
            specific_location: selectedItem.specific_location || "",
            found_date: foundDate ? foundDate.toISOString().split("T")[0] : "",
            found_time: foundDate ? foundDate.toTimeString().slice(0, 5) : "",
            description: selectedItem.description || "",
            contents: selectedItem.contents || "",
            reported_by: selectedItem.reported_by || "",
            additional_notes: selectedItem.additional_notes || "",
            office_id: String(selectedItem.office_id || ""),
        };

        setFormData(initialData);
        setOriginalFormData(initialData);
    }, [selectedItem]);

    // === CHANGE TRACKING & CLEANUP ===
    useEffect(() => {
        const imageChanged = selectedFile !== null;
        const formChanged = JSON.stringify(formData) !== JSON.stringify(originalFormData);
        setHasChanges(imageChanged || formChanged);
    }, [formData, originalFormData, selectedFile]);

    useEffect(() => {
        return () => {
            if (selectedFile && image?.startsWith("blob:")) {
                URL.revokeObjectURL(image);
            }
        };
    }, [image, selectedFile]);

    // === HANDLERS ===
    const handleChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value,
            // If date changes, reset time to ensure validation re-runs properly
            ...(name === "found_date" && { found_time: "" }) 
        }));
    };

    const handleRemovePicture = () => {
        setSelectedFile(null);
        setImage(null);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size exceeds 10MB limit");
            return;
        }

        const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
        if (!validTypes.includes(file.type)) {
            toast.error("Invalid file type");
            return;
        }

        if (image && image.startsWith("blob:")) {
            URL.revokeObjectURL(image);
        }

        const preview = URL.createObjectURL(file);
        setSelectedFile(file);
        setImage(preview);

        try {
            setIsAnalyzing(true);
            const formDataObj = new FormData();
            formDataObj.append("image", file);

            const data = await analyzeItemImage(formDataObj);

            const matchedCategory = categories.find(
                (cat) => cat.category_name.toLowerCase() === data.category?.toLowerCase()
            );

            setFormData(prev => ({
                ...prev,
                item_name: data.itemName || prev.item_name,
                description: data.detailedDescription || prev.description,
                contents: data.contents || prev.contents,
                category_id: matchedCategory ? String(matchedCategory.category_id) : prev.category_id,
            }));
        } catch (err) {
            console.error(err);
            toast.error("Failed to analyze image with AI.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleCancel = () => {
        if (hasChanges) {
            setOpenDiscardDialog(true);
            return;
        }
        setIsEditing(false);
    };

    const handleSubmit = async () => {
        setOpenSaveDialog(false);
        try {
            await saveEdit({
                reportId: selectedItem.found_report_id,
                editForm: formData,
                editImageFile: selectedFile,
                userId,
            });

            await refreshReports();
            
            // Assume the refresh updates the parent state, optionally you can pass specific updated data
            setOriginalFormData({ ...formData });
            setIsEditing(false);
            toast.success(`Successfully updated item details`);
            
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Failed to update report");
        }
    };

    // === VALIDATION ===
    const editDateValid = isValidPastOrToday(formData.found_date);
    const editTimeValid = editDateValid && isTimeNotFuture(formData.found_date, formData.found_time);
    
    const isFormValid =
        formData.item_name.trim() !== "" &&
        formData.category_id !== "" &&
        formData.location_found.trim() !== "" &&
        formData.found_date !== "" &&
        formData.found_time !== "" &&
        editDateValid &&
        editTimeValid;

    const formatItemId = (id) => `SI-${String(id).padStart(5, "0")}`;

    return (
        <>
            <div className="h-full w-full flex-1 ">
                <div className="flex flex-col gap-4 pb-10">
                    
                    {/* Header Section */}
                    <div className="flex flex-col gap-3">
                        <div className="flex w-full text-black font-semibold justify-between">
                            <p className="text-md xl:text-lg pl-2 mb-2">Edit Found Report Details</p>
                        </div>
                        <div className="flex w-full text-black font-semibold justify-between mb-2">
                            <p className="lg:text-[13px] xl:text-base pl-2 text-[#6B5C42]">
                                ITEM ID: {formatItemId(selectedItem.item_id)}
                            </p>
                        </div>

                        {/* Image Upload Area */}
                        <div 
                            className="w-full h-40 rounded-lg bg-[#F0EDE6] border border-[#DDD9CF] cursor-pointer relative justify-center flex items-center overflow-hidden"
                            onClick={() => image && setSelectedImage(image)}
                        >
                            {image ? (
                                <>
                                    <img src={image} alt="Preview" className="h-full w-full object-contain" />
                                    <div className="text-md rounded-full p-4 bg-black/70 absolute bottom-3 right-3 transition hover:scale-110">
                                        <i className="fa-solid fa-up-right-and-down-left-from-center text-white"></i>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-[#D3B8AE]">
                                    <ImageIcon size={70} strokeWidth={1.25} />
                                    <p className="font-medium">No Image Available</p>
                                </div>
                            )}
                        </div>
                        
                        <p className="text-xs text-[#6B5C42] opacity-70 font-medium mt-1 mb-2 text-center">
                            PNG, JPG or WEBP up to 10MB
                        </p>
                        
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isAnalyzing || isSavingEdit}
                            onChange={handleFileChange}
                        />

                        {/* Image Buttons */}
                        <div className="flex gap-2 h-10 justify-center text-[10px] xl:text-xs">
                           
                            <button
                                className="bg-primary text-white items-center rounded-md p-2 cursor-pointer disabled:opacity-40 w-fit flex gap-2"
                                disabled={isAnalyzing || isSavingEdit}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload size={15} /> <p>{image ? "Change Picture" : "Upload Picture"}</p>
                            </button>
                        </div>

                        {isAnalyzing && (
                            <p className="text-primary text-sm text-center">Analyzing image with AI...</p>
                        )}
                    </div>

                    {/* Form Fields Stack */}
                    <AdminTextField
                        title="Item Name"
                        reqField={true}
                        value={formData.item_name}
                        onChange={(value) => handleChange("item_name", value)}
                    />

                    <AdminCategoriesDropdown
                        title="Category"
                        reqField={true}
                        value={formData.category_id}
                        options={categories}
                        onChange={(value) => handleChange("category_id", value)}
                    />

                    {/* Using a native select styled to match Admin component rules since multi-select isn't applicable for Found location */}
                    <div className="flex flex-col text-xs mt-2">
                        <p className="text-[#6B5C42] font-semibold mb-1">
                            Location Found <span className="text-primary">*</span>
                        </p>
                        <select
                            className="select select-sm bg-white border border-[#DDD9CF] text-black w-full rounded-md font-normal"
                            value={formData.location_found}
                            disabled={isSavingEdit}
                            onChange={(e) => handleChange("location_found", e.target.value)}
                        >
                            <option hidden disabled value="">Select location</option>
                            {allLocations.map((loc, index) => (
                                <option key={index} value={loc.name}>{loc.name}</option>
                            ))}
                        </select>
                    </div>

                    <AdminTextField
                        title="Specific Location"
                        value={formData.specific_location}
                        onChange={(value) => handleChange("specific_location", value)}
                    />

                    <div className="flex gap-2">
                        <div className="flex-1">
                            <AdminDateInput
                                title="Date Found"
                                reqField={true}
                                value={formData.found_date}
                                onChange={(value) => handleChange("found_date", value)}
                            />
                            {!editDateValid && formData.found_date && (
                                <p className="text-xs text-primary mt-1">Date cannot be in the future.</p>
                            )}
                        </div>
                        <div className="flex-1">
                            <AdminHourInput
                                title="Time Found"
                                reqField={true}
                                value={formData.found_time}
                                disabled={!editDateValid}
                                onChange={(value) => handleChange("found_time", value)}
                            />
                            {!editTimeValid && formData.found_time && (
                                <p className="text-xs text-primary mt-1">Time cannot be in the future.</p>
                            )}
                        </div>
                    </div>

                    <AdminTextArea
                        title="Description"
                        value={formData.description}
                        onChange={(value) => handleChange("description", value)}
                    />

                    <AdminTextField
                        title="Contents (Optional)"
                        value={formData.contents}
                        onChange={(value) => handleChange("contents", value)}
                    />

                    <AdminTextField
                        title="Surrendered By"
                        value={formData.reported_by}
                        onChange={(value) => handleChange("reported_by", value)}
                    />

                    <AdminTextArea
                        title="Additional Notes"
                        value={formData.additional_notes}
                        onChange={(value) => handleChange("additional_notes", value)}
                    />

                    <div className="flex flex-col text-xs mt-2">
                        <p className="text-[#6B5C42] font-semibold mb-1">Current Office Location</p>
                        <select
                            className="select select-sm bg-white border border-[#DDD9CF] text-black w-full rounded-md font-normal"
                            value={formData.office_id}
                            disabled={isSavingEdit}
                            onChange={(e) => handleChange("office_id", e.target.value)}
                        >
                            <option value="">No office assigned</option>
                            {locations.map((office) => (
                                <option key={office.office_id} value={office.office_id}>
                                    {office.office_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full h-10 flex gap-2 mt-4">
                        <button
                            className="border border-primary text-primary p-2 rounded-md font-medium text-[10px] xl:text-xs flex-1 cursor-pointer disabled:opacity-40 transition-transform active:scale-95"
                            disabled={isSavingEdit || isAnalyzing}
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                        <button
                            className="bg-primary text-white p-2 rounded-md font-medium text-[10px] xl:text-xs flex-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-transform active:scale-95"
                            disabled={!hasChanges || isSavingEdit || isAnalyzing || !isFormValid}
                            onClick={() => setOpenSaveDialog(true)}
                        >
                            {isSavingEdit ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals placed outside the flex layout */}
            {selectedImage && (
                <ScaleImage 
                    selectedImage={selectedImage} 
                    setSelectedImage={setSelectedImage} 
                />
            )}

            {openDiscardDialog && (
                <AdminConfirmDialog
                    title="Discard Changes?"
                    description="You have unsaved changes. Are you sure you want to discard them? The listing will keep its original details."
                    cancelText="Keep Editing"
                    confirmText="Discard Changes"
                    onClose={() => setOpenDiscardDialog(false)}
                    onConfirm={() => {
                        setOpenDiscardDialog(false);
                        setIsEditing(false);
                    }}
                />
            )}

            {openSaveDialog && (
                <AdminConfirmDialog
                    title="Confirm Update"
                    description={
                        <>
                            Are you sure you want to save changes to Item{" "}
                            <span className="font-semibold text-black">
                                {formatItemId(selectedItem.item_id)}
                            </span>
                            ?
                        </>
                    }
                    cancelText="Keep Editing"
                    confirmText="Update Item"
                    onClose={() => setOpenSaveDialog(false)}
                    onConfirm={handleSubmit}
                />
            )}
        </>
    );
}