import { useRef, useState } from "react";
import { toast } from "react-toastify";

// Constants & Services
import { DISPOSAL_METHODS, DISCARD_REASONS } from "../../../constants/disposal_constants.js";
import { disposeFoundItem } from "../services/foundReportModalServices.js";
import AdminDonationDropDown from "../../AdminDonationDropDown.jsx";
import AdminTextField from "../../AdminTextField.jsx";
import AdminDateInput from "../../AdminDateInput.jsx";
import AdminConfirmDialog from "../../AdminConfirmDialog.jsx";
import AdminTextArea from "../../AdminTextArea.jsx";

export default function DisposeFoundReportTab({
    selectedItem,
    onCancel, // Function to go back to the details tab
    refreshReports
}) {
    // --- USER CONTEXT ---
    const userId = localStorage.getItem("user_id");
    const adminFullName = localStorage.getItem("first_name") + " " + localStorage.getItem("last_name");
    const officeIdNotification = localStorage.getItem("office_location");

    // --- FORM STATES ---
    const [disposalMethod, setDisposalMethod] = useState("");
    const [itemWhereabouts, setItemWhereabouts] = useState("");
    const [donationDate, setDonationDate] = useState("");
    const [notes, setNotes] = useState("");
    const [reasonForDiscarding, setReasonForDiscarding] = useState("");

    // --- FILE STATES ---
    const fileInputRefDisposalProof = useRef(null);
    const [disposalProof, setDisposalProof] = useState(null); // Image preview URL
    const [selectedProofFile, setSelectedProofFile] = useState(null); // Actual file

    // --- UI STATES ---
    const [isDisposing, setIsDisposing] = useState(false);
    const [openCancelDisposed, setOpenCancelDisposed] = useState(false);
    const [openConfirmDesiposed, setOpenConfirmDesiposed] = useState(false);

    // --- FORMATTERS ---
    const formatItemId = (id) => `SI-${String(id).padStart(5, "0")}`;

    // --- VALIDATION ---
    const isValidDisposalDate = (dateStr) => {
        if (!dateStr) return false;
        const selectedDate = new Date(`${dateStr}T00:00:00`);
        if (isNaN(selectedDate.getTime())) return false;
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return selectedDate <= today;
    };
    
    const disposalDateValid = isValidDisposalDate(donationDate);

    const isDisposalValid =
        disposalMethod === "DONATED"
            ? itemWhereabouts?.trim() && donationDate && disposalDateValid && selectedProofFile
            : disposalMethod === "DISPOSED_AS_WASTE"
                ? reasonForDiscarding && donationDate && disposalDateValid && selectedProofFile
                : false;

    const hasDisposalFormChanges = itemWhereabouts.trim() || donationDate || notes.trim() || reasonForDiscarding || selectedProofFile;

    // --- HANDLERS ---
    const resetDisposalForm = () => {
        setItemWhereabouts("");
        setDonationDate("");
        setNotes("");
        setReasonForDiscarding("");
        setDisposalProof(null);
        setSelectedProofFile(null);
        if (fileInputRefDisposalProof.current) {
            fileInputRefDisposalProof.current.value = "";
        }
    };

    const handleDisposalMethodChange = (value) => {
        if (value !== disposalMethod) {
            resetDisposalForm();
        }
        setDisposalMethod(value);
    };

    const handleDisposalProofFileChange = (e) => {
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

        setSelectedProofFile(file);
        setDisposalProof(URL.createObjectURL(file));
    };

    const handleCancelDisposed = () => {
        setDisposalMethod("");
        resetDisposalForm();
        setOpenCancelDisposed(false);
        onCancel(); // Tell parent to switch tabs
    };

    // --- SUBMISSION ---
    const handleDisposedItem = async () => {
        setIsDisposing(true);
        setOpenConfirmDesiposed(false);

        try {
            const officeId = (officeIdNotification && officeIdNotification !== "undefined") ? officeIdNotification : null;
            const formData = new FormData();

            formData.append("found_report_id", selectedItem.found_report_id);
            formData.append("item_id", selectedItem.item_id);
            formData.append("office_name", selectedItem.office_name);
            formData.append("disposed_by_user_id", userId);
            formData.append("disposal_method", disposalMethod);
            formData.append("additional_notes", notes);
            formData.append("disposal_date", donationDate);
            formData.append("admin_full_name", adminFullName);

            if (officeId) formData.append("office_id", officeId);
            if (selectedProofFile) formData.append("proof_img", selectedProofFile);
            
            if (disposalMethod === "DONATED") {
                formData.append("disposal_whereabouts", itemWhereabouts);
            }
            if (disposalMethod === "DISPOSED_AS_WASTE") {
                formData.append("discard_reason", reasonForDiscarding);
            }

            await disposeFoundItem(formData);
            await refreshReports();
            
            toast.success("Item disposed successfully.");
            
            resetDisposalForm();
            setDisposalMethod("");
            onCancel(); // Switches back to the details tab
            
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Failed to dispose item.");
        } finally {
            setIsDisposing(false);
        }
    };

    return (
        <>
            <div className="h-10 w-full bg-[#F5F5F5] flex shrink-0 fixed mt-15 z-100">
                <button className="text-sm px-5 bg-primary text-white font-semibold border-b-2 border-b-(--color-quaternary)">
                    Mark as Disposed
                </button>
            </div>
            
            <div className="flex-1 w-full p-5 pt-20 flex flex-col overflow-y-auto">
                <div className="flex flex-col gap-2 mb-5 mt-10">
                    <p className="text-md font-medium">Confirm Disposal</p>
                    <p className="text-xs text-justify">
                        This item will be marked for disposal or donation. Please provide the details before confirming.
                    </p>
                </div>

                <AdminDonationDropDown
                    title="Disposal Method"
                    disabled={isDisposing}
                    placeholder="Select Disposal Method"
                    value={disposalMethod}
                    onChange={handleDisposalMethodChange}
                    options={DISPOSAL_METHODS}
                    reqField
                />

                {/* FIELDS FOR DONATION */}
                {disposalMethod === 'DONATED' && (
                    <>
                        <AdminTextField
                            title="Beneficiary/Location"
                            reqField={true}
                            disabled={isDisposing}
                            value={itemWhereabouts}
                            onChange={setItemWhereabouts}
                        />
                        <AdminDateInput
                            title="Date of Donation"
                            reqField={true}
                            value={donationDate}
                            disabled={isDisposing}
                            onChange={setDonationDate}
                        />
                        {donationDate && !disposalDateValid && (
                            <p className="text-xs text-primary">Disposal date cannot be in the future.</p>
                        )}
                        
                        <p className="text-sm font-medium mt-2">
                            Proof of Donation Photo Upload <span className="text-primary">*</span>
                        </p>
                        <p className="text-xs text-[#6B5C42]">
                            Take or upload a photo of the signed acknowledgement form or the actual turnover of the item to the beneficiary.
                        </p>
                        
                        <button
                            type="button"
                            disabled={isDisposing}
                            onClick={() => fileInputRefDisposalProof.current?.click()}
                            className="relative disabled:opacity-40 w-full h-30 border border-dashed border-(--color-quaternary) bg-[#F5F5F5] rounded-lg mt-1 flex flex-col justify-center items-center gap-1 overflow-hidden"
                        >
                            {disposalProof ? (
                                <>
                                    <img src={disposalProof} alt="Selected proof" className="h-full w-full object-contain" />
                                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 text-primary text-[10px] px-2 py-1 rounded-md border border-[#DDD9CF]">
                                        Click image to replace photo.
                                    </span>
                                </>
                            ) : (
                                <>
                                    <i className="fa-regular fa-camera text-(--color-quaternary) text-2xl"></i>
                                    <p className="text-[#6B5C42] text-xs">Click to upload photo.</p>
                                </>
                            )}
                        </button>
                    </>
                )}

                {/* FIELDS FOR DISPOSED AS WASTE */}
                {disposalMethod === 'DISPOSED_AS_WASTE' && (
                    <>
                        <AdminDonationDropDown
                            title="Reason for Discarding"
                            reqField={true}
                            value={reasonForDiscarding}
                            disabled={isDisposing}
                            onChange={setReasonForDiscarding}
                            options={DISCARD_REASONS}
                            placeholder="Select a reason"
                        />
                        <AdminDateInput
                            title="Date of Disposal"
                            reqField={true}
                            disabled={isDisposing}
                            value={donationDate}
                            onChange={setDonationDate}
                        />
                        {donationDate && !disposalDateValid && (
                            <p className="text-xs text-primary">Disposal date cannot be in the future.</p>
                        )}
                        
                        <p className="text-sm font-medium mt-2">
                            Proof of Disposal Photo Upload <span className="text-primary">*</span>
                        </p>
                        <p className="text-xs text-[#6B5C42]">
                            Take or upload a photo showing the item has been discarded.
                        </p>
                        
                        <button
                            type="button"
                            disabled={isDisposing}
                            onClick={() => fileInputRefDisposalProof.current?.click()}
                            className="relative w-full h-30 border border-dashed border-(--color-quaternary) bg-[#F5F5F5] rounded-lg mt-1 flex flex-col justify-center items-center gap-1 overflow-hidden"
                        >
                            {disposalProof ? (
                                <>
                                    <img src={disposalProof} alt="Selected proof" className="h-full w-full object-contain" />
                                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 text-primary text-[10px] px-2 py-1 rounded-md border border-[#DDD9CF]">
                                        Click image to replace photo.
                                    </span>
                                </>
                            ) : (
                                <>
                                    <i className="fa-regular fa-camera text-(--color-quaternary) text-2xl"></i>
                                    <p className="text-[#6B5C42] text-xs">Click to upload photo.</p>
                                </>
                            )}
                        </button>
                    </>
                )}
                <p className="text-xs text-[#6B5C42] opacity-70 font-medium mt-1 mb-2 text-center">
                            PNG, JPG or WEBP up to 10MB
                </p>

                {/* HIDDEN INPUT FOR BOTH METHODS */}
                {(disposalMethod === 'DONATED' || disposalMethod === 'DISPOSED_AS_WASTE') && (
                    <input
                        ref={fileInputRefDisposalProof}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleDisposalProofFileChange}
                    />
                )}

                {disposalMethod && (
                    <>
                        <AdminTextArea
                            title="Additional Notes"
                            reqField={true}
                            disabled={isDisposing}
                            value={notes}
                            onChange={setNotes}
                        />
                       <div className="mt-auto">
                         <hr className="border-(--color-tertiary) my-4 opacity-30" />
                        <div className="w-full h-10 flex gap-2 text-xs ">
                            <button
                                className="px-2 h-full bg-white border border-primary text-primary font-medium rounded-md transition-transform active:scale-95"
                                onClick={() => {
                                    if (hasDisposalFormChanges) {
                                        setOpenCancelDisposed(true);
                                    } else {
                                        handleCancelDisposed();
                                    }
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={!isDisposalValid || isDisposing}
                                onClick={() => setOpenConfirmDesiposed(true)}
                                className="flex-1 h-full bg-primary font-medium text-white rounded-md disabled:opacity-40 transition-transform active:scale-95"
                            >
                                {isDisposing ? "Disposing..." : "Confirm Disposal"}
                            </button>
                        </div>
                       </div>
                    </>
                )}
            </div>

            {/* Local Modals */}
            {openCancelDisposed && (
                <AdminConfirmDialog
                    description={`Cancel the disposal of ${formatItemId(selectedItem.item_id)}? The information you've entered on this form will not be saved.`}
                    onClose={() => setOpenCancelDisposed(false)}
                    onConfirm={handleCancelDisposed}
                />
            )}

            {openConfirmDesiposed && (
                <AdminConfirmDialog
                    description={`Are you sure you want to permanently dispose of ${formatItemId(selectedItem.item_id)}? This action cannot be undone and will officially close its record.`}
                    onClose={() => setOpenConfirmDesiposed(false)}
                    onConfirm={handleDisposedItem}
                    confirmText="Confirm Disposal"
                    cancelText="Cancel"
                />
            )}
        </>
    );
}