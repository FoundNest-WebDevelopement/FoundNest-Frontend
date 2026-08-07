import AdminDropDown from "../../AdminDropdown";
import AdminLocationMultiSelect from "../../AdminLocationMultiSelect";
import AdminTextArea from "../../AdminTextArea";
import AdminTextField from "../../AdminTextField";
import { useEffect, useRef, useState } from "react";
import { fetchWithAuth } from "../../../utils/fetchWithAuth";
import { formatReportId } from "../../../utils/formatId";
import AdminCategoriesDropdown from "../../AdminCategoriesDropdown";
import ScaleImage from "../../ScaleImage";
import AdminDateInput from "../../AdminDateInput";
import AdminHourInput from "../../AdminHourInput";
import AdminConfirmDialog from "../../AdminConfirmDialog";
import { Upload, CircleMinus, Image } from "lucide-react"
import { toast } from "react-toastify";
import { updateLostReport, getLostReports } from "../services/LostReportModalService";
export default function EditTab({
    selectedItem,
    setSelectedItem,
    categories = [],
    locations = [],
    sharedSpaces = [],
    gates = [],
    onUpdated,
    setEditTab,
}) {
    console.log(selectedItem)
    const API_URL = import.meta.env.VITE_API_URL;

    const [isSaving, setIsSaving] = useState(false);

    const [selectedImage, setSelectedImage] = useState(null);

    const [selectedFile, setSelectedFile] = useState(null);
    const [image, setImage] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef(null);

    const [originalFormData, setOriginalFormData] = useState({});
    const [hasChanges, setHasChanges] = useState(false);
    const [openDiscardDialog, setOpenDiscardDialog] = useState(false);
    const [openSaveDialog, setOpenSaveDialog] = useState(false);

    function parseLocation(locationLost) {
        try {
            return JSON.parse(locationLost);
        } catch {
            return [locationLost];
        }
    }

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const preview = URL.createObjectURL(file);

        setSelectedFile(file);
        setImage(preview);
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
                throw new Error(data.error);
            }

            const matchedCategory = categories.find(
                (category) =>
                    category.category_name.toLowerCase() ===
                    data.category?.toLowerCase()
            );

            setFormData(prev => ({
                ...prev,
                item_name: data.itemName || prev.item_name,
                description: data.detailedDescription || prev.description,
                contents: data.contents || prev.contents,
                category_id: matchedCategory
                    ? String(matchedCategory.category_id)
                    : prev.category_id,
            }));

        } catch (err) {
            console.error(err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const [formData, setFormData] = useState({
        item_name: "",
        category_id: "",
        description: "",
        contents: "",
        lost_date: "",
        location_lost: [],
        specific_location: "",
    });

    const handleRemovePicture = () => {
        setFormData(prev => ({
            ...prev,
            image_url: "REMOVE",
        }));
        setImage(null)
    }

    useEffect(() => {
        if (!selectedItem) return;

        setImage(selectedItem?.image_url);
        setSelectedFile(null);

        const initialData = {
            item_name: selectedItem?.item_name || "",
            category_id: selectedItem?.category_id || "",
            description: selectedItem?.description || "",
            contents: selectedItem?.contents || "",
            lost_date: selectedItem?.lost_date
                ? new Date(selectedItem?.lost_date).toISOString().slice(0, 16)
                : "",
            location_lost:
                typeof selectedItem?.location_lost === "string"
                    ? parseLocation(selectedItem?.location_lost)
                    : selectedItem?.location_lost || [],
            specific_location: selectedItem?.specific_location || "",
            owner_name: selectedItem?.owner_name || "",
            email: selectedItem?.email || "",
            contact_number: selectedItem?.contact_number || "",
        };

        setFormData(initialData);
        setOriginalFormData(initialData);



    }, [selectedItem]);

    const handleChange = e => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        setOpenSaveDialog(false);
        setIsSaving(true);
        try {
            const payload = new FormData();

            Object.entries(formData).forEach(([key, value]) => {
                if (key === "location_lost") {
                    payload.append(key, JSON.stringify(value));
                } else {
                    payload.append(key, value ?? "");
                }
            });

            if (selectedFile) {
                payload.append("image", selectedFile);
            }


            await updateLostReport(selectedItem.lost_report_id, payload);

            const data = await getLostReports();


            if (Array.isArray(data)) {
                onUpdated?.(data);
            }

            const updatedReport = data.find(
                report =>
                    report.lost_report_id ===
                    selectedItem.lost_report_id
            );

            if (updatedReport) {
                setSelectedItem(updatedReport);
            }


            setEditTab(false);
            toast.success(`${formatReportId(selectedItem.lost_report_id)} updated successfully`)
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };


    useEffect(() => {
        return () => {
            if (selectedFile && image?.startsWith("blob:")) {
                URL.revokeObjectURL(image);
            }
        };
    }, [image, selectedFile]);

    useEffect(() => {
        const imageChanged = selectedFile !== null;

        const formChanged =
            JSON.stringify(formData) !== JSON.stringify(originalFormData);

        setHasChanges(imageChanged || formChanged);
    }, [formData, originalFormData, selectedFile]);

    const handleCancel = () => {
        if (hasChanges) {
            setOpenDiscardDialog(true);
            return;
        }
        setEditTab(false);
    };

    const isFormValid =
    formData.item_name.trim() !== "" &&
    formData.category_id !== "" &&
    formData.lost_date !== "" &&
    formData.location_lost.length > 0 &&
    (
        formData.email.trim() !== "" ||
        formData.contact_number.trim() !== ""
    );

    useEffect(() => {
        console.log(formData.lost_date);
    }, [formData.lost_date]);

    const isValidPhone = /^09\d{9}$/.test(
        formData.contact_number
    );
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email
    );

    return (
        <>
            <div className="h-full w-full p-5 flex-1 overflow-y-auto">
                <div className="flex flex-col gap-4">

                    <div className="flex flex-col gap-3">
                        <div className="flex w-full text-black font-semibold justify-between">
                        <p className=" text-md xl:text-lg pl-2 mb-5">Edit Report Details</p>
                    </div>
                    <div className="flex w-full text-black font-semibold justify-between">
                        <p className="lg:text-[13px] xl:text-base pl-2">{formatReportId(selectedItem.lost_report_id)}</p>
                        
                    </div>
                        <div className=" w-full h-40 rounded-lg bg-[#F0EDE6] border border-[#DDD9CF] cursor-pointer relative justify-center flex items-center"
                            onClick={() => setSelectedImage(image)}>
                            {image ?
                                (
                                    <>
                                        <img src={image}
                                            className="h-full w-full object-contain" />
                                        <div className="text-md rounded-full p-4 bg-black/70 absolute bottom-3 right-3">
                                            <i className="fa-solid fa-up-right-and-down-left-from-center text-white "></i>
                                        </div>
                                    </>
                                )
                                :
                                (
                                    <div className=" flex flex-col items-center justify-center text-[#D3B8AE]">
                                        <Image size={70} strokeWidth={1.25} />
                                        <p className="font-medium">No Image Available</p>
                                    </div>
                                )
                            }

                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isAnalyzing}
                            onChange={handleFileChange}
                        />

                        <div className="flex gap-2 h-10 justify-center text-[10px] xl:text-xs">
                            {image &&
                                <button
                                    className=" border border-primary items-center text-primary rounded-md p-2  cursor-pointer disabled:opacity-40 w-fit flex gap-2"
                                    disabled={isAnalyzing}
                                    onClick={() => handleRemovePicture()}
                                >
                                    <CircleMinus size={15} />  <p>Remove Picture</p>
                                </button>

                            }
                            <button
                                className=" bg-primary text-white items-center rounded-md p-2 cursor-pointer disabled:opacity-40 w-fit flex gap-2"
                                disabled={isAnalyzing}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload size={15} />  <p>{image ? "Change Picture" : "Upload Picture"}</p>
                            </button>

                        </div>

                        {isAnalyzing && (
                            <p className="text-primary text-sm">
                                Analyzing image...
                            </p>
                        )}
                    </div>
                    {/* Item Name */}

                    <AdminTextField
                        title="Item Name"
                        reqField={true}
                        value={formData?.item_name}
                        onChange={(value) =>
                            setFormData(prev => ({
                                ...prev,
                                item_name: value
                            }))
                        }
                    />
                    {/* Category */}

                    <AdminCategoriesDropdown
                        title="Category"
                        reqField={true}
                        value={formData.category_id}
                        options={categories}
                        onChange={(value) =>
                            setFormData(prev => ({
                                ...prev,
                                category_id: value
                            }))
                        }
                    />
                    {/* Description */}

                    <AdminTextArea
                        title="Description"
                        value={formData.description}
                        onChange={(value) =>
                            setFormData(prev => ({
                                ...prev,
                                description: value
                            }))
                        }
                    />
                    {/* Contents */}

                    <AdminTextArea
                        title="Contents"
                        value={formData.contents}
                        onChange={(value) =>
                            setFormData(prev => ({
                                ...prev,
                                contents: value
                            }))
                        }
                    />

                    {/* Date */}

                    <AdminDateInput
                        title={"Date Lost"}
                        reqField={true}
                        value={formData.lost_date.split("T")[0]}
                        onChange={(date) => {
                            setFormData(prev => {
                                const time = prev.lost_date.split("T")[1] || "00:00";

                                return {
                                    ...prev,
                                    lost_date: `${date}T${time}`,
                                };
                            });
                        }}
                    />

                    <AdminHourInput
                        title={"Time Lost"}
                        reqField={true}
                        value={formData.lost_date.split("T")[1]?.slice(0, 5) || ""}
                        onChange={(time) => {
                            setFormData(prev => {
                                const date = prev.lost_date.split("T")[0];

                                return {
                                    ...prev,
                                    lost_date: `${date}T${time}`,
                                };
                            });
                        }}
                    />
                    {/* Locations */}

                    <AdminLocationMultiSelect
                        value={formData.location_lost}
                        onChange={(value) =>
                            setFormData(prev => ({
                                ...prev,
                                location_lost: value
                            }))
                        }
                        locations={locations}
                        sharedSpaces={sharedSpaces}
                        gates={gates}
                        reqField
                    />

                    {/* Specific Location */}

                    <AdminTextField
                        title="Specific Location"
                        value={formData.specific_location}
                        onChange={(value) =>
                            setFormData(prev => ({
                                ...prev,
                                specific_location: value
                            }))
                        }
                    />

                    <AdminTextField
                        title="Item Owner Name"
                        value={formData.owner_name}
                        onChange={(value) =>
                            setFormData(prev => ({
                                ...prev,
                                owner_name: value
                            }))
                        }
                    />

                    <AdminTextField
                        title="Email"
                        reqField={true}
                        name="specific_location"
                        value={formData?.email}
                        onChange={(value) =>
                            setFormData(prev => ({
                                ...prev,
                                email: value
                            }))
                        }
                    />
                    {!isValidEmail && formData.email &&
                            <span className="text-xs text-primary">Please enter a valid Email</span>
                        }
                    <AdminTextField
                        title="Contact Number"
                        reqField={true}
                        name="specific_location"
                        value={formData?.contact_number}
                        onChange={(value) =>
                            setFormData(prev => ({
                                ...prev,
                                contact_number: value
                            }))
                        }
                    />
                        {!isValidPhone && formData.contact_number &&
                            <span className="text-xs text-primary">Please enter a valid phone number</span>
                        }
                     <p className="text-xs text-[#6B5C42]">At least one identifier is required.</p>

                    <div className="w-full h-10 flex gap-2">
                        <button
                            className="border border-primary text-primary p-2 rounded-md font-medium text-[10px] xl:text-xs flex-1 cursor-pointer disabled:opacity-40"
                            disabled={isSaving || isAnalyzing}
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                        <button
                            className="bg-primary  text-white p-2 rounded-md font-medium text-[10px] xl:text-xs flex-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={!hasChanges || isSaving || isAnalyzing ||
                                !isFormValid ||
                                (formData.email.trim() !== "" && !isValidEmail) || 
                                (formData.contact_number.trim() !== "" && !isValidPhone)}
                            onClick={()=>setOpenSaveDialog(true)}
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>

                    </div>

                </div>
            </div>
            {selectedImage &&
                <ScaleImage selectedImage={selectedImage} setSelectedImage={setSelectedImage} />
            }
            {openDiscardDialog && (
                <AdminConfirmDialog
                    title="Discard Changes?"
                    description="You have unsaved changes. Are you sure you want to discard them?"
                    cancelText="Keep Editing"
                    confirmText="Discard Changes"
                    onClose={() => setOpenDiscardDialog(false)}
                    onConfirm={() => {
                        setOpenDiscardDialog(false);
                        setEditTab(false);
                    }}
                />
            )}
            {openSaveDialog && (
                <AdminConfirmDialog
                    title="Save Changes?"
                    description={
                        <>
                            Are you sure you want to save changes to report{" "}
                            <span className="font-semibold">
                                {formatReportId(selectedItem.lost_report_id)}
                            </span>
                            ?
                        </>
                    }
                    cancelText="Keep Editing"
                    confirmText="Save Changes"
                    onClose={() => setOpenSaveDialog(false)}
                    onConfirm={handleSubmit}
                />
            )}

        </>
    );
}

