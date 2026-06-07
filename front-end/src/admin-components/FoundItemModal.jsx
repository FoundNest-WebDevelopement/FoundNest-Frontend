import { useRef, useState } from "react"
import AdminCategoriesDropdown from "./AdminCategoriesDropdown"
import AdminTextField from "./AdminTextField"
import AdminTextArea from "./AdminTextArea";
import AdminDateInput from "./AdminDateInput";
import AdminHourInput from "./AdminHourInput";
import AdminLocationDropDown from "./AdminLocationDropDown";
import AdminAllLocationDropDown from "./AdminAllLocationDropDown";
import { fetchWithAuth } from "../utils/fetchWithAuth";


export default function FoundItemModal({
    open,
    setOpen,
    categories = [],
    locations = [],
    allLocations = [],
    onUpdated,
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
    
    const fileInputRef = useRef(null);

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

    const isFormValid =
        selectedFile &&
        itemName.trim() &&
        category &&
        locationFound &&
        dateFound &&
        timeFound &&
        dateValid &&
        currentLocation &&
        timeValid;

    const resetForm = () => {
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
        setSpecificLocation("")

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];

        if (!file) return;

        setSelectedFile(file);
        setImage(URL.createObjectURL(file));

        try {
            setIsAnalyzing(true);

            const formData = new FormData();
            formData.append("image", file);
            const token = localStorage.getItem("token")
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

            const formData = new FormData();
            formData.append("image", selectedFile);
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
     
            const response = await fetchWithAuth(`${API_URL}/api/found-reports`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to list found item");
            }

             // Refresh table
            const reportsResponse = await fetchWithAuth(
                `${API_URL}/api/found-reports`
            );

            const reportsData = await reportsResponse.json();
            if (Array.isArray(reportsData)) {
                onUpdated?.(reportsData);
            }
    

            alert("Item Listed Succesfully")
            resetForm();
            setOpen(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    

    return (
        <>
            <dialog className={`modal ${open ? "modal-open" : ""}`}>

    <div className="bg-white flex flex-col w-full max-w-3xl h-[80vh] rounded-2xl">

        {/* HEADER */}
        <div className="h-15 w-full bg-primary flex items-center justify-between px-6 rounded-t-2xl shrink-0">
            
            <p className="text-xl font-semibold text-white">
                Log New Found Item
            </p>

            <button type="button" onClick={handleClose}>
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
                         <span className="absolute bottom-2  left-1/2 -translate-x-1/2 bg-white/90 text-primary text-[10px] px-2 py-1 rounded-md border border-[#DDD9CF]">
                                                        Click image to replace photo.
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
                onClick={handleClose}
                className="font-medium text-sm text-primary border border-primary p-3 rounded-md"
            >
                Cancel
            </button>
            <button
                type="button"
                disabled={!isFormValid || isAnalyzing || isSubmitting}
                onClick={handleSubmit}
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
        </>
    )
}
