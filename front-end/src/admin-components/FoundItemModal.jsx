import { useEffect, useRef, useState } from "react"
import AdminCategoriesDropdown from "./AdminCategoriesDropdown"
import AdminTextField from "./AdminTextField"
import AdminTextArea from "./AdminTextArea";
import AdminDateInput from "./AdminDateInput";
import AdminHourInput from "./AdminHourInput";
import AdminLocationDropDown from "./AdminLocationDropDown";
import AdminAllLocationDropDown from "./AdminAllLocationDropDown";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import formatDateTime from "../utils/formatDataTimeNew";
import { toast } from "react-toastify";
import { Info } from "lucide-react";
import AdminConfirmDialog from "./AdminConfirmDialog";


export default function FoundItemModal({
    open,
    setOpen,
    categories = [],
    locations = [],
    allLocations = [],
    onUpdated,
    prefillData,
    setSelectedItem,
}) {

    const API_URL = import.meta.env.VITE_API_URL;

    const adminID = localStorage.getItem("admin_id")
    const userId = localStorage.getItem("user_id")
    const [selectedFile, setSelectedFile] = useState(null);
    const [image, setImage] = useState(null);
    const [itemName, setItemName] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [contents, setContents] = useState("");
    const [locationFound, setLocationFound] = useState("");
    const [dateFound, setDateFound] = useState("");
    const [timeFound, setTimeFound] = useState("");
    const [surrenderedBy, setSurrenderedBy] = useState("");
    const [additionalNotes, setAdditionalNotes] = useState("");
    const [currentLocation, setCurrentLocation] = useState("");
    const [specificLocation, setSpecificLocation] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [prefilledImageUrl, setPrefilledImageUrl] = useState(null);
    const [prefilledQrData, setPrefilledQrData] = useState(null);
    const [prefilledQrOwnerId, setPrefilledQrOwnerId] = useState(null);

    const fileInputRef = useRef(null);
    const prefillAppliedRef = useRef(false);

    const [openListConfirmation, setOpenListConfirmation] = useState(false);
    const [cancelListConfirmation, setCancelListConfirmation] = useState(false);

    useEffect(() => {
        if (open && prefillData && !prefillAppliedRef.current) {
            prefillAppliedRef.current = true;
            setItemName(prefillData.item_name || prefillData.itemName || "");
            setCategory(
                prefillData.category_id ? String(prefillData.category_id) : ""
            );
            setContents(prefillData.contents || "");
            setImage(prefillData.image_url || null);
            setSelectedFile(null);
            setPrefilledImageUrl(prefillData.image_url || null);
            setPrefilledQrData(prefillData.qr_data || null);
            setPrefilledQrOwnerId(prefillData.user_id || null);
        }
        if (!open) {
            prefillAppliedRef.current = false;
        }
    }, [open, prefillData]);

    function isValidPastOrToday(dateStr) {
        if (!dateStr) return false;
        const chosen = new Date(dateStr);
        if (Number.isNaN(chosen.getTime())) return false;
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return chosen <= today;
    }

    function isTimeNotFuture(dateStr, timeStr) {
        if (!dateStr || !timeStr) return false;
        const todayDate = new Date().toISOString().split("T")[0];
        const chosenDate = new Date(dateStr).toISOString().split("T")[0];
        if (chosenDate < todayDate) return true;
        const [hours, minutes] = timeStr.split(":").map(Number);
        const chosenDateTime = new Date(dateStr);
        chosenDateTime.setHours(hours, minutes, 0, 0);
        return chosenDateTime <= new Date();
    }

    const dateValid = isValidPastOrToday(dateFound);
    const timeValid = dateValid && isTimeNotFuture(dateFound, timeFound);
    const hasImage = Boolean(selectedFile || prefilledImageUrl);

    const isFormValid =
        hasImage &&
        itemName.trim() &&
        category &&
        locationFound &&
        dateFound &&
        timeFound &&
        dateValid &&
        currentLocation &&
        timeValid;

    const resetForm = () => {
        prefillAppliedRef.current = false;
        setSelectedFile(null);
        setImage(null);
        setItemName("");
        setCategory("");
        setDescription("");
        setContents("");
        setLocationFound("");
        setDateFound("");
        setTimeFound("");
        setSurrenderedBy("");
        setAdditionalNotes("");
        setCurrentLocation("");
        setSpecificLocation("");
        setPrefilledImageUrl(null);
        setPrefilledQrData(null);
        setPrefilledQrOwnerId(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };


const handleCancelForm = () => {
  
        const userInputs = [
            selectedFile,
            itemName,
            category,
            description,
            contents,
            locationFound,
            dateFound,
            timeFound,
            surrenderedBy,
            additionalNotes,
            specificLocation
        ];


        const hasUserProgress = userInputs.some(value => {
            if (typeof value === 'string') return value.trim() !== '';
            return value !== null && value !== undefined;
        });


        if (hasUserProgress || isSubmitting) {
            setCancelListConfirmation(true);
        } else {
            resetForm(); 
            setOpen(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFile(file);
        setImage(URL.createObjectURL(file));
        setPrefilledImageUrl(null);

        try {
            setIsAnalyzing(true);
            const formData = new FormData();
            formData.append("image", file);
            const response = await fetchWithAuth(
                `${API_URL}/api/gemini-item-listing/describe-item`,
                {
                    method: "POST",
                    body: formData,
                }
            );
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "AI analysis failed");
            }
            setItemName(data.itemName || "");
            setDescription(data.detailedDescription || "");
            setContents(data.contents || "");
            const matchedCategory = categories.find(
                (item) =>
                    item.category_name.toLowerCase() ===
                    data.category?.toLowerCase()
            );
            if (matchedCategory) {
                setCategory(String(matchedCategory.category_id));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleDateChange = (value) => {
        setDateFound(value);
        setTimeFound("");
    };

    const handleSubmit = async () => {
        if (!isFormValid) return;

        try {
            setIsSubmitting(true);
            setOpenListConfirmation(false);

            const formData = new FormData();

            if (selectedFile) {
                formData.append("image", selectedFile);
            } else if (prefilledImageUrl) {
                formData.append("image_url", prefilledImageUrl);
            }

            formData.append("admin_id", adminID);
            formData.append("item_name", itemName);
            formData.append("category_id", category);
            formData.append("description", description);
            formData.append("contents", contents);
            formData.append("location_found", locationFound);
            formData.append("specific_location", specificLocation);
            formData.append("found_date", `${dateFound} ${timeFound}`);
            formData.append("reported_by", surrenderedBy);
            formData.append("additional_notes", additionalNotes);
            formData.append("office_id", currentLocation);
            formData.append("user_id", userId);

            if (prefilledQrData) {
                formData.append("qr_data", prefilledQrData);
            }
            if (prefilledQrOwnerId) {
                formData.append("qr_owner_user_id", prefilledQrOwnerId);
            }

            const response = await fetchWithAuth(`${API_URL}/api/found-reports`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to list found item");
            }

            const reportsResponse = await fetchWithAuth(
                `${API_URL}/api/found-reports`
            );
            const reportsData = await reportsResponse.json();
            if (Array.isArray(reportsData)) {
                onUpdated?.(reportsData);
            }

       onUpdated?.(reportsData);

            const createdFoundReport = reportsData.find(
            report => report.found_report_id === data.report.found_report_id
            );

            setSelectedItem(createdFoundReport);
            toast.success(`Item ${itemName} listed successfully!`)
            resetForm();
            setOpen(false);
            
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedCategory = categories.find(
  c => String(c.category_id) === String(category)
);

const selectedCurrentLocation = locations.find(
  location =>
    String(location.office_id) === String(currentLocation)
);

    return (
        <>
            <dialog className={`modal ${open ? "modal-open" : ""}`}>

                <div className="bg-white flex flex-col w-full max-w-3xl h-[80vh] rounded-2xl">

                    {/* HEADER */}
                    <div className="h-15 w-full bg-primary flex items-center justify-between px-6 rounded-t-2xl shrink-0">
                        <p className="text-xl font-semibold text-white">
                            Log New Found Item
                        </p>
                        <button type="button" onClick={handleCancelForm}>
                            <i className="fa-solid fa-xmark text-xl text-white"></i>
                        </button>
                    </div>

                    {/* SCROLLABLE CONTENT */}
                    <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">

                        <div>
                            <p className="font-medium text-sm ">
                                Surrendered Item Photo <span className="text-primary">*</span>
                            </p>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="relative w-full h-30 border border-dashed border-(--color-quaternary) bg-[#F5F5F5] rounded-lg mt-1 flex flex-col justify-center items-center gap-1 overflow-hidden"
                            >
                                {image ? (
                                    <>
                                        <img
                                            src={image}
                                            alt="Selected found item"
                                            className="h-full w-full object-contain"
                                        />
                                        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 text-primary text-[10px] px-2 py-1 rounded-md border border-[#DDD9CF]">
                                            {prefilledImageUrl
                                                ? "Photo from QR registration. Click to replace."
                                                : "Click image to replace photo."}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-regular fa-camera text-(--color-quaternary) text-4xl"></i>
                                        <p className="text-[#6B5C42] text-md">Click to upload photo.</p>
                                        <p className="text-[#9C8570] text-sm">*FoundNest AI will help auto-fill details based on your photo.</p>
                                    </>
                                )}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            {isAnalyzing && (
                                <p className="text-xs text-primary mt-2">Analyzing image...</p>
                            )}
                        </div>

                        <AdminTextField
                            title="Item Name"
                            placeholder="e.g., iPhone 13 Pro Max, Bag, Umbrella"
                            value={itemName}
                            onChange={setItemName}
                            reqField={true}
                        />
                        <AdminCategoriesDropdown
                            title="Category"
                            placeholder="Select Category"
                            value={category}
                            onChange={setCategory}
                            options={categories}
                            reqField={true}
                        />
                        <AdminTextArea
                            title="Description"
                            placeholder="Brand, Model, Size, Color, Material, etc."
                            value={description}
                            onChange={setDescription}
                        />
                        <AdminTextField
                            title="Contents"
                            placeholder="e.g., Cash amount, ID name"
                            value={contents}
                            onChange={setContents}
                        />
                        <AdminAllLocationDropDown
                            title="Location Found"
                            value={locationFound}
                            placeholder="Select Found Location"
                            onChange={setLocationFound}
                            options={allLocations}
                            reqField={true}
                        />
                        <AdminTextField
                            title="Specific Location"
                            value={specificLocation}
                            onChange={setSpecificLocation}
                        />
                        <AdminDateInput
                            title="Date Found"
                            value={dateFound}
                            onChange={handleDateChange}
                            reqField={true}
                            error={dateFound && !dateValid}
                            max={new Date().toISOString().split("T")[0]}
                        />
                        {dateFound && !dateValid && (
                            <p className="text-xs text-red-500 mt-1 ml-1">
                                Date found cannot be in the future.
                            </p>
                        )}
                        <AdminHourInput
                            title="Time Found"
                            value={timeFound}
                            onChange={setTimeFound}
                            reqField={true}
                            error={dateValid && timeFound && !timeValid}
                            disabled={!dateValid}
                        />
                        {dateFound && !dateValid && (
                            <p className="text-xs text-yellow-500 mt-1 ml-1">
                                Enter a valid date first.
                            </p>
                        )}
                        {dateValid && timeFound && !timeValid && (
                            <p className="text-xs text-red-500 mt-1 ml-1">
                                Time found cannot be in the future.
                            </p>
                        )}
                        <AdminTextField
                            title="Surrendered by (Recommended)"
                            value={surrenderedBy}
                            onChange={setSurrenderedBy}
                        />
                        <AdminTextField
                            title="Additional Notes"
                            placeholder="Any other relevant details.."
                            value={additionalNotes}
                            onChange={setAdditionalNotes}
                        />
                        <AdminLocationDropDown
                            hidden={true}
                            disabled={true}
                            title="Current Location"
                            placeholder="Select Current Location"
                            value={currentLocation}
                            onChange={setCurrentLocation}
                            options={locations}
                            reqField={true}
                        />
                    </div>

                    <div className="h-18 w-full border-t border-[#DDD9CF] flex items-center justify-end px-6 gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={handleCancelForm}
                            className="font-medium text-sm text-primary border border-primary p-3 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={!isFormValid || isAnalyzing || isSubmitting}
                            onClick={()=>setOpenListConfirmation(true)}
                            className={`font-medium text-sm text-white border border-primary p-3 rounded-md bg-primary ${
                                !isFormValid || isAnalyzing || isSubmitting
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                            }`}
                        >
                            {isSubmitting ? "Listing..." : "List Item"}
                        </button>
                    </div>
                </div>

            </dialog>
            {openListConfirmation &&
            (
                
                <>
                 <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-1020">

                        <div className="relative bg-white  rounded-lg w-100 h-fit flex flex-col">
                            <div className="w-full h-10 rounded-t-lg bg-primary text-white flex items-center justify-between px-5">
                                <p className="font-semibold">Review Listing</p>
                                <button onClick={() => setOpenListConfirmation(false)}><i className="fa-solid fa-x text-xs xl:text-sm text-white"></i></button>

                            </div>
                            <div className="w-full flex flex-col p-3 gap-2">
                                 <div className="text-xs xl:text-sm text-justify">
                                      <p >
                                        Publishing this listing will make it visible to everyone on <span className="font-semibold">FoundNest.</span> Please review your photo and item details to ensure everything is accurate before listing."
                                      </p>
                                    </div>
                                    <hr className="border-(--color-tertiary) my-2 opacity-30" />
                                    <div className="flex gap-2">
                                    <button
                                        className="w-full h-10 flex-1 bg-white  rounded-lg  border border-primary text-primary  text-sm font-medium transition-transform duration-100 active:scale-95"
                                        onClick={() => {setOpenListConfirmation(false)}}
                                    >Cancel</button>
                                    <button
                                        className="w-full h-10 flex-1 disabled:opacity-40 bg-primary rounded-lg text-white text-sm font-medium transition-transform duration-100 active:scale-95"
                                        
                                        onClick={handleSubmit}
                                    >Confirm</button>
                                </div>
                              
                            </div>
                            <div>

                            </div>
                           
                         
                        </div>
                    </div>
                </>
             
            )

            }
            {cancelListConfirmation && 
            (
                
              
              
              
                <>
               
                      <AdminConfirmDialog
                        description={"Any information or progress you've entered on this listing form will be permanently lost."}
                        onConfirm={()=> {
                                            setCancelListConfirmation(false);
                                            setOpen(false);
                                            
                                        }}
                        onClose={() => setCancelListConfirmation(false)}
                    />
                </>
            
            
            
            )

            }
        </>
    )
}