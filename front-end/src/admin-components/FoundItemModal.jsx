import { useRef, useState } from "react"
import AdminCategoriesDropdown from "./AdminCategoriesDropdown"
import AdminTextField from "./AdminTextField"
import AdminTextArea from "./AdminTextArea";
import AdminDateInput from "./AdminDateInput";
import AdminHourInput from "./AdminHourInput";
import AdminLocationDropDown from "./AdminLocationDropDown";


export default function FoundItemModal({
    open,
    setOpen,
    categories = [],
    locations = [],
}) {
    const API_URL = import.meta.env.VITE_API_URL;

    const [adminID] = useState(1);
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
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    const isFormValid =
        selectedFile &&
        itemName &&
        category &&
        description &&
        locationFound &&
        dateFound &&
        timeFound &&
        currentLocation;

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

            const response = await fetch(
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
            formData.append("found_date", `${dateFound} ${timeFound}`);
            formData.append("reported_by", surrenderedBy);
            formData.append("additional_notes", additionalNotes);
            formData.append("office_id", currentLocation);

            const response = await fetch(`${API_URL}/api/found-reports`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to list found item");
            }

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
                <p className="font-medium text-sm">
                    Surrendered Item Photo *
                </p>

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-30 border border-dashed border-(--color-quaternary) bg-[#F5F5F5] rounded-lg mt-1 flex flex-col justify-center items-center gap-1 overflow-hidden"
                >
                    {image ? (
                        <img
                            src={image}
                            alt="Selected found item"
                            className="h-full w-full object-cover"
                        />
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
            />

            <AdminCategoriesDropdown
                title="Category"
                placeholder="Select Category"
                value={category}
                onChange={setCategory}
                options={categories}
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
            <AdminTextField
                title="Location Found *"
                value={locationFound}
                onChange={setLocationFound}
            />
            <AdminDateInput
                title="Date Found"
                value={dateFound}
                onChange={setDateFound}
            />
            <AdminHourInput
                title="Time Found"
                value={timeFound}
                onChange={setTimeFound}
            />
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
                title="Current Location"
                placeholder="Select Current Location"
                value={currentLocation}
                onChange={setCurrentLocation}
                options={locations}
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
