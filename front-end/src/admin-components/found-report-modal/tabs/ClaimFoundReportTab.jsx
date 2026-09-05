import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

import { formatReportId } from "../../../utils/formatId.js";

// API Services (Adjust import paths as needed)
import { claimFoundItem, searchLostReports } from "../services/foundReportModalServices.js"
import AdminConfirmDialog from "../../AdminConfirmDialog.jsx";
import AdminTextField from "../../AdminTextField.jsx";

export default function ClaimFoundReportTab({
    selectedItem,
    setClaimId,
    onCancel, // Function to go back to previous tab
    onSuccess, // Function to trigger when claim is successful
    refreshReports
}) {
    const userId = localStorage.getItem("user_id");
    const adminFullName = localStorage.getItem("first_name") + " " + localStorage.getItem("last_name");

    // --- FORM STATES ---
    const [fullName, setFullName] = useState("");
    const [claimantEmail, setClaimantEmail] = useState("");
    const [claimantNumber, setClaimantNumber] = useState("");
    const [verificationDetails, setVerificationDetails] = useState("");
    const [identifierToggle, setIdentifierToggle] = useState(false);

    // --- FILE STATES ---
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [claimantImage, setClaimantImage] = useState(null);

    // --- SEARCH & LINK STATES ---
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [linkReport, setLinkReport] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null); // For the link modal

    // --- UI/MODAL STATES ---
    const [isReleasing, setIsReleasing] = useState(false);
    const [openConfirmRelease, setOpenConfirmRelease] = useState(false);
    const [openCancelRelease, setOpenCancelRelease] = useState(false);
    const [linkModal, setLinkModal] = useState(false);

    // --- VALIDATION ---
    const isValidPhone = /^09\d{9}$/.test(claimantNumber);
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claimantEmail);
    const isClaimValid = fullName.trim() && (claimantNumber.trim() || claimantEmail.trim()) && selectedFile && verificationDetails.trim();
    const hasClaimFormChanges = fullName.trim() || claimantEmail.trim() || claimantNumber.trim() || verificationDetails.trim() || selectedFile || linkReport;

    const formatItemId = (id) => `SI-${String(id).padStart(5, "0")}`;

    // --- HANDLERS ---
    const handleClaimantFileChange = (e) => {
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

        setSelectedFile(file);
        setClaimantImage(URL.createObjectURL(file));
    };

    // --- SEARCH EFFECT ---
    useEffect(() => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }
        const fetchReports = async () => {
            const data = await searchLostReports(searchTerm);
            setSearchResults(data);
        };
        fetchReports();
    }, [searchTerm]);

    // --- SUBMISSION ---
    const handleItemRelease = async () => {
        setIsReleasing(true);
        setOpenConfirmRelease(false);
        try {
            const officeId = localStorage.getItem("office_location");
            const officeIdTemp = (officeId && officeId !== "undefined") ? officeId : null;

            const formData = new FormData();
            formData.append("claimant_full_name", fullName);
            if (officeIdTemp) formData.append("office_id", officeIdTemp);
            formData.append("claimant_email", claimantEmail);
            formData.append("claimant_contact_number", claimantNumber);
            formData.append("verification_details", verificationDetails);
            formData.append("processed_by_user_id", userId);
            formData.append("admin_full_name", adminFullName);
            formData.append("user_id", userId);
            if (linkReport) formData.append("lost_report_id", linkReport.lost_report_id);
            formData.append("claimant_photo", selectedFile);

            const data = await claimFoundItem(selectedItem.found_report_id, formData);



            setClaimId(data.claim.claim_id);

            await refreshReports();
            toast.success(`Successfully marked ${formatItemId(selectedItem.item_id)} as Claimed.`);

            // Pass the claimId and fullName back to the parent to show the success dialog
            onSuccess(data.claim.claim_id, fullName);

        } catch (error) {
            console.error(error);
            toast.error(error.message || "Failed to release item.");
        } finally {
            setIsReleasing(false);
        }
    };

    return (
        <>
            <div className="h-10 w-full bg-[#F5F5F5] flex shrink-0 fixed mt-15 z-100 ">
                <button className=" text-sm px-5 bg-primary text-white font-semibold border-b-2 border-b-(--color-quaternary)">
                    Mark as Claimed
                </button>
            </div>

            <div className="flex flex-col overflow-y-auto h-screen w-full p-5 pt-25 ">
                {/* Form Fields - Exact same JSX as before */}
                <AdminTextField title="Claimant Full Name" reqField={true} placeholder="Full name of claimant" value={fullName} disabled={isReleasing} onChange={setFullName} />

                <div className="w-full mt-3 flex flex-col gap-2">
                    <p className="text-sm font-medium">BulSU Email / Contact Number <span className="text-primary">*</span></p>
                    <div className="w-full h-10 flex">
                        <button className={`flex-1 text-[#6B5C42] rounded-l-lg text-xs font-semibold border border-[#DDD9CF] ${!identifierToggle && "text-white bg-primary border-primary"}`} onClick={() => setIdentifierToggle(false)}>Email</button>
                        <button className={`flex-1 text-[#6B5C42] rounded-r-lg text-xs font-semibold border border-[#DDD9CF] ${identifierToggle && "text-white bg-primary border-primary"}`} onClick={() => setIdentifierToggle(true)}>Contact No.</button>
                    </div>
                    {identifierToggle ? (
                        <input type="text" className="input border border-[#DDD9CF] bg-white rounded-md text-sm w-full" placeholder="e.g. 09XXXXXXXXX" value={claimantNumber} disabled={isReleasing} onChange={(e) => setClaimantNumber(e.target.value)} />
                    ) : (
                        <input type="email" className="input border border-[#DDD9CF] bg-white rounded-md text-sm w-full" placeholder="e.g. juan@gmail.com" value={claimantEmail} disabled={isReleasing} onChange={(e) => setClaimantEmail(e.target.value)} />
                    )}
                    {!isValidEmail && claimantEmail && <span className="text-xs text-primary">Please enter a valid Email</span>}
                    {!isValidPhone && claimantNumber && <span className="text-xs text-primary">Please enter a valid phone number</span>}
                </div>

                {/* File Upload */}
                <div className="mt-3">
                    <p className="text-sm font-medium">Proof of Claim Photo Upload <span className="text-primary">*</span></p>
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isReleasing} className="relative w-full h-30 disabled:opacity-40 border border-dashed border-(--color-quaternary) bg-[#F5F5F5] rounded-lg mt-1 flex flex-col justify-center items-center gap-1 overflow-hidden">
                        {claimantImage ? (
                            <>
                                <img src={claimantImage} alt="Selected found item" className="h-full w-full object-contain" />
                                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 text-primary text-[10px] px-2 py-1 rounded-md border border-[#DDD9CF]">Click image to replace photo.</span>
                            </>
                        ) : (
                            <>
                                <i className="fa-regular fa-camera text-(--color-quaternary) text-2xl"></i>
                                <p className="text-[#6B5C42] text-xs">Click to upload photo.</p>
                            </>
                        )}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" disabled={isReleasing} onChange={handleClaimantFileChange} />
                </div>
                <p className="text-xs text-[#6B5C42] opacity-70 font-medium mt-1 mb-2 text-center">
                            PNG, JPG or WEBP up to 10MB
                </p>

                {/* Verification */}
                <div className="mt-3">
                    <p className="text-sm font-medium">Verification Details <span className="text-primary">*</span></p>
                    <textarea className="textarea w-full bg-white border border-[#DDD9CF] rounded-md mt-1" rows={3} placeholder="Example: Claimant identified contents inside the wallet and presented a valid school ID." value={verificationDetails} disabled={isReleasing} onChange={(e) => setVerificationDetails(e.target.value)} />
                </div>

                {/* Link Lost Report */}
                <div className="mt-3 flex flex-col">
                    <p className="text-sm font-medium">Link to a Lost Report <span className="text-black/40">(Optional)</span></p>
                    <div className="relative w-full mt-2">
                        {showSearchResults && searchResults?.length > 0 && (
                            <div className="w-full h-fit border border-[#DDD9CF] rounded-md">
                                <div className="absolute bottom-full w-full h-fit border border-[#DDD9CF] rounded-md bg-white z-50">
                                    {searchResults.map((result) => (
                                        <button key={result.lost_report_id} type="button" className="w-full text-sm flex p-2 border-b border-b-[#DDD9CF] hover:bg-gray-100" onMouseDown={() => { setSelectedReport(result); setLinkModal(true); setShowSearchResults(false); }}>
                                            <p className="flex-1 text-left">{formatReportId(result.lost_report_id)}</p>
                                            <p className="flex-1 text-left">{result.item_name}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {linkReport && (
                            <div className="w-full h-fit border border-(--color-quaternary) rounded-md mb-2">
                                <div className="w-full text-sm flex bg-(--color-quaternary)/20 p-2 border-b border-b-[#DDD9CF]">
                                    <p className="flex-1 overflow-x-auto min-w-0 truncate">{formatReportId(linkReport.lost_report_id)}</p>
                                    <p className="flex-1 min-w-0 truncate">{linkReport.item_name}</p>
                                    <button onClick={() => setLinkReport(null)}><i className="fa-solid fa-trash-can text-primary"></i></button>
                                </div>
                            </div>
                        )}
                        <div className="flex flex-1 border border-[#DDD9CF] rounded-md shadow-sm items-center">
                            <i className="fa-solid fa-magnifying-glass text-primary ml-2"></i>
                            <input type="text" placeholder="Search Report ID" className="input input-bordered flex-1" disabled={isReleasing} onFocus={() => setShowSearchResults(true)} onBlur={() => setTimeout(() => setShowSearchResults(false), 200)} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="mt-auto">
                    <hr className="border-(--color-tertiary) my-5 opacity-30 " />

                {/* Actions */}
                <div className="w-full h-10 flex gap-2 text-xs">
                    <button className="px-2 h-full bg-white border border-primary text-primary font-medium rounded-md transition-transform active:scale-95" onClick={() => hasClaimFormChanges ? setOpenCancelRelease(true) : onCancel()}>
                        Cancel
                    </button>
                    <button type="button" disabled={!isClaimValid || isReleasing || (!isValidEmail && claimantEmail) || (!isValidPhone && claimantNumber)} onClick={() => setOpenConfirmRelease(true)} className="flex-1 h-full bg-primary font-medium text-white rounded-md disabled:opacity-40 transition-transform active:scale-95">
                        {isReleasing ? "Releasing..." : "Confirm Release"}
                    </button>
                </div>
                </div>
                <div className="h-5"></div>
            </div>

            {/* Local Modals */}
            {openCancelRelease && (
                <AdminConfirmDialog
                    description="Cancel the release? The information you've entered on this form will not be saved."
                    onClose={() => setOpenCancelRelease(false)}
                    onConfirm={() => { setOpenCancelRelease(false); onCancel(); }}
                />
            )}

            {openConfirmRelease && (
                <AdminConfirmDialog
                    title="Confirm Release"
                    description={`Confirm release for ${formatItemId(selectedItem.item_id)}`}
                    cancelText="Cancel"
                    confirmText="Confirm Release"
                    onClose={() => setOpenConfirmRelease(false)}
                    onConfirm={handleItemRelease}
                />
            )}

            {/* Link Report Modal */}
            {linkModal && selectedReport && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-1020">
                    <div className="relative bg-white rounded-lg w-100 h-fit flex flex-col">
                        <div className="w-full h-10 rounded-t-lg bg-primary text-white flex items-center justify-between px-5">
                            <p className="font-semibold">Link Report</p>
                            <button onClick={() => { setLinkModal(false); setSelectedReport(null); }}><i className="fa-solid fa-x text-xs text-white"></i></button>
                        </div>
                        <div className="p-4 flex flex-col gap-3">
                            <img src={selectedReport.image_url} alt={selectedReport.item_name} className="w-full h-40 object-contain bg-[#F0EDE6] rounded-md border" />
                            <div className="bg-[#FCEBEB] p-3 rounded-md text-xs flex flex-col gap-1">
                                <p className="text-sm font-semibold text-[#6B5C42]">{formatReportId(selectedReport.lost_report_id)}</p>
                                <p className="text-[#6B5C42]">Item: <span className="text-black">{selectedReport.item_name}</span></p>
                                <p className="text-[#6B5C42]">Owner: <span className="text-black">{selectedReport.owner_name}</span></p>
                            </div>
                            <p className="text-xs text-gray-600 text-justify">
                                Linking this report will connect this case to the found item and update the status to ‘Resolved’. Please verify that the details match.
                            </p>
                            <div className="flex gap-2 mt-2">
                                <button className="flex-1 h-10 border border-primary text-primary rounded-md" onClick={() => { setLinkModal(false); setSelectedReport(null); }}>No</button>
                                <button className="flex-1 h-10 bg-primary text-white rounded-md" onClick={() => { setLinkReport(selectedReport); setLinkModal(false); setSelectedReport(null); }}>Confirm Link</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}