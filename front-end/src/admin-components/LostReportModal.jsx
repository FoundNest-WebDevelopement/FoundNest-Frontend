import { useRef, useState } from "react"
import AdminCategoriesDropdown from "./AdminCategoriesDropdown"
import AdminTextField from "./AdminTextField"
import AdminTextArea from "./AdminTextArea";
import AdminDateInput from "./AdminDateInput";
import AdminHourInput from "./AdminHourInput";
import AdminLocationDropDown from "./AdminLocationDropDown";
import AdminAllLocationDropDown from "./AdminAllLocationDropDown";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { Phone } from "lucide-react";
import AdminConfirmDialog from "./AdminConfirmDialog";
import { toast } from "react-toastify";

export default function LostReportModal(
    {
        open,
        setOpen,
        categories = [],
        locations = [],
        sharedSpaces = [],
        offices = [],
        gates = [],
        onUpdated,
        setSelectedItem,
    }
) {
    //API URL
    const API_URL = import.meta.env.VITE_API_URL;

    const [openConfirmReportDialog, setOpenConfirmReportDialog] = useState(false);
    const [openCancelReportDialog, setOpenCancelReportDialog] = useState(false);

    //MODAL CONST
    const userId = localStorage.getItem("user_id")
    const AdminFullName = localStorage.getItem("first_name") + " " + localStorage.getItem("last_name");

    const [selectedFile, setSelectedFile] = useState(null);
    const [image, setImage] = useState(null);
    const [itemName, setItemName] = useState("");
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [contents, setContents] = useState("");
    const [locationLost, setLocationLost] = useState([]);
    const [openLocations, setOpenLocations] = useState(false);
    const [dateLost, setDateLost] = useState("");
    const [timeLost, setTimeLost] = useState("");
    const [email, setEmail] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [ownerName, setOwnerName] = useState("");
    const [specificLocation, setSpecificLocation] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    //OPEN DROPDOWN FOR LOCATIONS
    const [showDropdown, setShowDropdown] = useState(false);
    const [showBuildings, setShowBuildings] = useState(false);
    const [showSharedSpaces, setShowSharedSpaces] = useState(false);
    const [showGates, setShowGates] = useState(false);

    const [cantRemember, setCantRemember] = useState(false);




    //HANDLE LOCATION CHANGE
    const handleLocationChange = (locationName) => {
        setLocationLost((prev) => {
            const current = Array.isArray(prev) ? prev : [];

            if (locationName === "Can't Remember") {

                setShowBuildings(false);
                setShowGates(false);
                setShowSharedSpaces(false);
                setCantRemember(!cantRemember)

                return current.includes("Can't Remember")
                    ? []
                    : ["Can't Remember"];
            }

            const withoutCantRemember = current.filter(
                (item) => item !== "Can't Remember"
            );

            if (withoutCantRemember.includes(locationName)) {
                return withoutCantRemember.filter(
                    (item) => item !== locationName
                );
            }

            return [...withoutCantRemember, locationName];
        });
    };

    //handle count of locations dropown
    const totalLocations = locationLost.length;

    const dropdownLabel =
        totalLocations === 0
            ? "Select Location"
            : totalLocations === 1
                ? locationLost[0]
                : `Locations (${totalLocations})`;

    //button labels
    const buttonLabel =
        totalLocations === 0
            ? "Select Location"
            : totalLocations === 1
                ? locationLost[0]
                : `Locations (${totalLocations})`;

    //DATE VALIDATOR
    function isValidPastOrToday(dateStr) {
        if (!dateStr) return false;

        const chosen = new Date(dateStr);
        if (Number.isNaN(chosen.getTime())) return false;

        const today = new Date();
        today.setHours(23, 59, 59, 999);

        return chosen <= today;
    }

    //TIME VALIDATOR
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

    //DATE AND ITEME CONST
    const dateValid = isValidPastOrToday(dateLost);
    const timeValid = dateValid && isTimeNotFuture(dateLost, timeLost);




    //HANDLE MODAL CLOSE
    const handleClose = () => {
        setOpen(false);
    };

    const isValidPhone = /^09\d{9}$/.test(
        contactNumber
    );
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );
  const oneIdentetifier = 
        (email && isValidEmail) ||
        (contactNumber && isValidPhone);

    //FORM VALIDATOR CHECKER
    const isFormValid =
        itemName.trim() &&
        category &&
        locationLost.length > 0 &&
        dateLost &&
        timeLost &&
        dateValid &&
        ownerName &&
       oneIdentetifier &&
        timeValid;

  

    //FORM REFRESHER
    const resetForm = () => {
        setSelectedFile(null);
        setImage(null);
        setItemName("");
        setCategory("");
        setDescription("");
        setContents("");
        setLocationLost("");
        setDateLost("");
        setTimeLost("");
        setOwnerName("");
        setEmail("");
        setContactNumber("");
        setSpecificLocation("")

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };


    const hasUnsavedChanges =
    selectedFile !== null ||
    itemName.trim() !== "" ||
    category !== "" ||
    description.trim() !== "" ||
    contents.trim() !== "" ||
    locationLost.length > 0 ||
    specificLocation.trim() !== "" ||
    dateLost !== "" ||
    timeLost !== "" ||
    ownerName.trim() !== "" ||
    email.trim() !== "" ||
    contactNumber.trim() !== "";

    //format rpt  id
    const formatReportId = (id) => {
        return `RPT-${String(id).padStart(5, "0")}`;
    };

    //FILE CHANGE HANDLER
    const handleFileChange = async (e) => {
        const file = e.target.files[0];

        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
        toast.error("File size exceeds 10MB limit")
      return;
    }
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type");
      return;
    }


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

    //RESET TIME IF DATE IS CHANGED
    const handleDateChange = (value) => {
        setDateLost(value);
        setTimeLost("");
    };

    //HANDLE REPORT SUBMIT
    const handleSubmit = async () => {

        if (!isFormValid) return;

        try {
            setIsSubmitting(true);
            setOpenConfirmReportDialog(false);

            const formData = new FormData();
            formData.append("image", selectedFile);
            formData.append("user_id", userId);
            formData.append("item_name", itemName);
            formData.append("category_id", category);
            formData.append("description", description);
            formData.append("contents", contents);
            const locationValue =
                locationLost.length === 1
                    ? locationLost[0]
                    : JSON.stringify(locationLost);
            formData.append(
                "location_lost",
                locationValue
            );

            formData.append("specific_location", specificLocation);
            formData.append("lost_date", `${dateLost} ${timeLost}`);
            formData.append("owner_name", ownerName);
            formData.append("email", email);
            formData.append("contact_number", contactNumber);


            const response = await fetchWithAuth(`${API_URL}/api/lost-reports`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to Create Report");
            }

            // Refresh table
            const reportsResponse = await fetchWithAuth(
                `${API_URL}/api/lost-reports`
            );

            const reportsData = await reportsResponse.json();
            if (Array.isArray(reportsData)) {
                onUpdated?.(reportsData);
            }
            const createdReport = reportsData.find(
            report => report.lost_report_id === data.report.lost_report_id
            );

            setSelectedItem(createdReport);


           
            toast.success(`Report ${formatReportId(data.report.lost_report_id)} submitted successfully`)
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


                    <div className="h-15 w-full bg-primary flex items-center justify-between px-6 rounded-t-2xl shrink-0">

                        <p className="text-xl font-semibold text-white">
                            Add New Report
                        </p>
                        <button type="button" onClick={()=>{
                             if (hasUnsavedChanges) {
                                                setOpenCancelReportDialog(true);
                                            } else {
                                                handleClose();
                                            }
                        }}
                        disabled={ isAnalyzing || isSubmitting }
                        >
                            <i className="fa-solid fa-xmark text-xl text-white"></i>
                        </button>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
                        <div>
                            <p className="font-medium text-sm ">
                                Item Description
                            </p>
                            <hr className="border-(--color-tertiary) mt-1 mb-4 opacity-30" />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isSubmitting}
                                className="relative cursor-pointer w-full disabled:cursor-not-allowed h-30 border border-dashed border-(--color-quaternary) bg-[#F5F5F5] rounded-lg mt-1 flex flex-col justify-center items-center gap-1 overflow-hidden"
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
                                        <p className="text-[#6B5C42] text-md">Click to upload photo. <span className="">(Optional)</span></p>
                                        <p className="text-xs text-(--color-tertiary) opacity-50 font-medium mb-1">
                                            PNG, JPG or WEBP up to 10MB
                                        </p>
                                        <p className="text-[#9C8570] text-sm">*FoundNest AI will help auto-fill details based on your photo.</p>
                                    </>
                                )}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={isSubmitting}
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
                            disabled={isSubmitting}
                        />
                        <AdminCategoriesDropdown
                            title="Category"
                            placeholder="Select Category"
                            value={category}
                            onChange={setCategory}
                            options={categories}
                            reqField={true}
                            disabled={isSubmitting}
                        />
                        <AdminTextArea
                            title="Description"
                            placeholder="Brand, Model, Size, Color, Material, etc."
                            value={description}
                            onChange={setDescription}
                            disabled={isSubmitting}
                        />
                        <AdminTextField
                            title="Contents (if Applicable)"
                            placeholder="e.g., Cash amount, ID name"
                            value={contents}
                            onChange={setContents}
                            disabled={isSubmitting}
                        />
                        <div className="dropdown w-full">
                            <p className="text-sm font-medium mt-2">Location Lost <span className="text-primary">*</span></p>
                            <button
                                type="button"
                                disabled={isSubmitting}
                                className={`p-2.5 px-3 justify-between mt-2 flex border border-[#DDD9CF] bg-white rounded-md text-sm w-full text-center disabled:cursor-not-allowed
                                                    ${showDropdown && "border-black"}        
                                            `}
                                onClick={() =>
                                    setShowDropdown(!showDropdown)
                                }
                            >
                                {buttonLabel}
                                <div className="flex items-center justify-center">
                                    <i className={`fa-solid fa-caret-${showDropdown ? "up" : "down "} text-[7px]`}></i>
                                </div>
                            </button>
                            {showDropdown && (
                                <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg">

                                    {/* BUILDINGS */}
                                    <button
                                        type="button"
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm rounded-t-lg disabled:opacity-40"
                                        disabled={cantRemember}
                                        onClick={() =>
                                            setShowBuildings(!showBuildings)
                                        }
                                    >
                                        Buildings  <i className={`fa-solid fa-caret-${showBuildings ? "up" : "down "} text-[7px]`}></i>
                                    </button>

                                    {showBuildings && (
                                        <div className="pl-6 pb-2">
                                            {locations?.map((building) => (
                                                <label
                                                    key={building.office_id}
                                                    className="flex items-center gap-2 py-1 text-sm "
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={locationLost.includes(
                                                            building.office_name
                                                        )}
                                                        disabled={locationLost.includes(
                                                            "Can't Remember"
                                                        )}
                                                        onChange={() =>
                                                            handleLocationChange(
                                                                building.office_name
                                                            )
                                                        }
                                                    />
                                                    {building.office_name}
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {/* SHARED SPACES */}
                                    <button
                                        type="button"
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm disabled:opacity-40"
                                        disabled={cantRemember}
                                        onClick={() =>
                                            setShowSharedSpaces(
                                                !showSharedSpaces
                                            )
                                        }
                                    >
                                        Shared Spaces  <i className={`fa-solid fa-caret-${showSharedSpaces ? "up" : "down "} text-[7px]`}></i>
                                    </button>
                                    {showSharedSpaces && (
                                        <div className="pl-6 pb-2">
                                            {sharedSpaces?.map((space) => (
                                                <label
                                                    key={space.shared_space_id}
                                                    className="flex items-center gap-2 py-1 text-sm "
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={locationLost.includes(
                                                            space.shared_space_name
                                                        )}
                                                        disabled={locationLost.includes(
                                                            "Can't Remember"
                                                        )}
                                                        onChange={() =>
                                                            handleLocationChange(
                                                                space.shared_space_name
                                                            )
                                                        }
                                                    />
                                                    {space.shared_space_name}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                    {/* GATES */}
                                    <button
                                        type="button"
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm disabled:opacity-40"
                                        disabled={cantRemember}
                                        onClick={() =>
                                            setShowGates(!showGates)
                                        }
                                    >
                                        Gates <i className={`fa-solid fa-caret-${showGates ? "up" : "down "} text-[7px]`}></i>
                                    </button>
                                    {showGates && (
                                        <div className="pl-6 pb-2">
                                            {gates?.map((gate) => (
                                                <label
                                                    key={gate.gate_id}
                                                    className="flex items-center gap-2 py-1 text-sm "
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={locationLost.includes(
                                                            gate.gate_name
                                                        )}
                                                        disabled={locationLost.includes(
                                                            "Can't Remember"
                                                        )}
                                                        onChange={() =>
                                                            handleLocationChange(
                                                                gate.gate_name
                                                            )
                                                        }
                                                    />

                                                    {gate.gate_name}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                    {/* CAN'T REMEMBER */}
                                    <div className="border-t mt-2">
                                        <label className="flex items-center gap-2 px-4 py-3 text-sm ">
                                            <input
                                                type="checkbox"
                                                checked={locationLost.includes(
                                                    "Can't Remember"
                                                )}
                                                onChange={() =>
                                                    handleLocationChange(
                                                        "Can't Remember"
                                                    )
                                                }
                                            />
                                            Can't Remember
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                        <AdminTextField
                            title="Specific Location"
                            value={specificLocation}
                            onChange={setSpecificLocation}
                            disabled={isSubmitting}

                        />

                        <AdminDateInput
                            title="Date Lost"
                            value={dateLost}
                            onChange={handleDateChange}
                            disabled={isSubmitting}
                            reqField={true}
                            error={dateLost && !dateValid}
                            max={new Date().toISOString().split("T")[0]}

                        />
                        {dateLost && !dateValid && (
                            <p className="text-xs text-red-500 mt-1 ml-1">
                                Date found cannot be in the future.
                            </p>
                        )}
                        <AdminHourInput
                            title="Time Lost"
                            value={timeLost}
                            onChange={setTimeLost}
                            reqField={true}
                            error={dateValid && timeLost && !timeValid}
                            disabled={!dateValid || isSubmitting}
                        />
                        {dateLost && !dateValid && (
                            <p className="text-xs text-yellow-500 mt-1 ml-1">
                                Enter a valid date first.
                            </p>
                        )}
                        {dateValid && timeLost && !timeValid && (
                            <p className="text-xs text-red-500 mt-1 ml-1">
                                Time Lost cannot be in the future.
                            </p>
                        )}
                        <AdminTextField
                            title="Item Owner Name"
                            value={ownerName}
                            onChange={setOwnerName}
                            reqField={true}
                            disabled={isSubmitting}
                        />
                        <AdminTextField
                            title="Email"
                            placeholder="Juan@gmail.com"
                            value={email}
                            onChange={setEmail}
                            disabled={isSubmitting}
                        />
                        {!isValidEmail && email &&
                            <span className="text-xs text-primary">Please enter a valid Email</span>
                        }


                        <AdminTextField
                            title="Contact Number"
                            placeholder="09XXXXXXXXX"
                            value={contactNumber}
                            onChange={setContactNumber}
                            disabled={isSubmitting}
                        />
                        {!isValidPhone && contactNumber &&
                            <span className="text-xs text-primary">Please enter a valid phone number</span>
                        }
                        <p className="text-xs text-[#6B5C42]">At least one identifier is required.</p>
                        <AdminTextField
                            title="Logged By"
                            value={AdminFullName}
                            disabled={isSubmitting}

                        />
                    </div>
                    <div className="h-18 w-full border-t border-[#DDD9CF] flex items-center justify-end px-6 gap-3 shrink-0">
                        <button
                            type="button"
                            disabled={ isAnalyzing || isSubmitting }
                            onClick={() => { if (hasUnsavedChanges) {
                                                setOpenCancelReportDialog(true);
                                            } else {
                                                handleClose();
                                            }}}
                            className="font-medium text-sm text-primary border border-primary p-3 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={
                                !isFormValid ||
                                isAnalyzing ||
                                isSubmitting ||
                                (email.trim() !== "" && !isValidEmail) ||
                                (contactNumber.trim() !== "" && !isValidPhone)
                            }
                            onClick={() => setOpenConfirmReportDialog(true)}
                            className={`font-medium text-sm text-white border border-primary p-3 rounded-md bg-primary disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {isSubmitting ? "Adding..." : "Add Report"}
                        </button>

                    </div>
                </div>

            </dialog>

            {openConfirmReportDialog &&
                (
                    <AdminConfirmDialog
                        title="Review Report"
                        description={`Publishing this report will make it visible to everyone on FoundNest. Please review your photo, item, 
                and owner details to ensure everything is accurate before submitting the report."`}
                        cancelText="Cancel"
                        confirmText="Confirm"
                        onClose={() => setOpenConfirmReportDialog(false)}
                        onConfirm={handleSubmit}
                    />
                )
            }
            {openCancelReportDialog &&
                (
                    <AdminConfirmDialog
                        title="Review Report"
                        description={`Any information or progress you've entered on this report form will be permanently lost.`}
                        cancelText="Keep Editing"
                        confirmText="Discard"
                        onClose={()=>setOpenCancelReportDialog(false)}
                        onConfirm={handleClose}
                    />
                )
            }
        </>
    )
}