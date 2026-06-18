import { useEffect, useRef, useState } from "react";
import { Pencil, X, QrCode, Link2 } from "lucide-react";
import QRCodeLib from "qrcode";
import foramtDateTimeNew from "../utils/formatDataTimeNew.js";
import formatNotificationDate from "../utils/fotmatNotifications.js";
import AdminTextField from "./AdminTextField.jsx";
import AdminDateInput from "./AdminDateInput.jsx";
import AdminTextArea from "./AdminTextArea.jsx";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { useNavigate } from "react-router-dom";

export default function FoundReportItemManagementModal({
  selectedItem = [],
  setSelectedItem,
  itemInfo,
  setItemInfo,
  categories = [],
  locations = [],
  onUpdated,
  allLocations = [],
}) {
  const API_URL = import.meta.env.VITE_API_URL;
  const [isLoading, setIsLoading] = useState(false);
  const adminId = localStorage.getItem("admin_id");
  const userId = localStorage.getItem("user_id");
  const navigate = useNavigate();

  //HANDLE STATUS UPDATE TAB
  const [claimTab, setClaimTab] = useState(false);
  const [disposedTab, setDisposedTab] = useState(false);
  const [editTab, setEditTab] = useState(true);

  //claim tab variables

  const [identifierToggle, setIdentifierToggle] = useState(false);
  const [claimantImage, setClaimantImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [linkReport, setLinkReport] = useState(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [fullName, setFullName] = useState("");
  const [claimantEmail, setClaimantEmail] = useState("");
  const [claimantNumber, setClaimantNumber] = useState("");
  const [verificationDetails, setVerificationDetails] = useState("");

  const isValidPhone = /^09\d{9}$/.test(claimantNumber);
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claimantEmail);

  const fileInputRef = useRef(null);
  const resetClaimForm = () => {
    setClaimantEmail("");
    setFullName("");
    setClaimantNumber("");
    setVerificationDetails("");
    setClaimantImage(null);
    setSelectedFile(null);
    setLinkReport(null);
    setSearchResults([]);
    setSearchTerm("");
    setShowSearchResults(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClaimantFileChange = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const officeId = localStorage.getItem("office_location");

    setSelectedFile(file);
    setClaimantImage(URL.createObjectURL(file));
  };

  const isClaimValid =
    fullName.trim() &&
    (claimantNumber.trim() || claimantEmail.trim()) &&
    selectedFile &&
    verificationDetails.trim();

  //format item id
  const formatItemId = (id) => {
    return `SI-${String(id).padStart(5, "0")}`;
  };

  //format report id
  const formatReportId = (id) => {
    return `RPT-${String(id).padStart(5, "0")}`;
  };

  const [isReleasing, setIsReleasing] = useState(false);
  const handleItemRelease = async () => {
    setIsReleasing(true);
    try {
      if (!selectedItem?.found_report_id) {
        throw new Error("Please select an item to release.");
      }

      // Validation
      if (!fullName.trim()) {
        throw new Error("Claimant full name is required.");
      }

      if (!claimantEmail.trim() && !claimantNumber.trim()) {
        throw new Error("Email or Contact Number is required.");
      }

      if (!selectedFile) {
        throw new Error("Proof of claim photo is required.");
      }

      if (!verificationDetails.trim()) {
        throw new Error("Verification details are required.");
      }

      const officeId = localStorage.getItem("office_location");

      const formData = new FormData();

      // Claim Details
      formData.append("claimant_full_name", fullName);
      formData.append("office_id", officeId);

      formData.append("claimant_email", claimantEmail);

      formData.append("claimant_contact_number", claimantNumber);

      formData.append("verification_details", verificationDetails);

      // Admin Processing Claim
      formData.append("processed_by_admin_id", adminId);
      formData.append("user_id", userId);

      // Optional linked report
      if (linkReport) {
        formData.append("lost_report_id", linkReport.lost_report_id);
      }

      // Claimant Photo
      formData.append("claimant_photo", selectedFile);

      const response = await fetchWithAuth(
        `${API_URL}/api/found-reports/${selectedItem.found_report_id}/claim`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to release item.");
        setIsReleasing(false);
      }

      // Refresh table

      const reportsResponse = await fetchWithAuth(
        `${API_URL}/api/found-reports`,
      );

      const reportsData = await reportsResponse.json();

      if (Array.isArray(reportsData)) {
        onUpdated?.(reportsData);
      }

      // Reset form
      resetClaimForm();

      setSelectedItem(null);
      setClaimTab(false);
      setEditTab(true);
      setIsReleasing(false);

      alert("Item released successfully.");
    } catch (error) {
      setIsReleasing(false);

      console.error(error);

      alert(error.message);
    }
  };

  //HANDLE PAGINATION IN OPEN EDIT

  //Item history
  const [itemHistory, setItemHistory] = useState([]);

  //open claim form
  const startClaiming = () => {
    setClaimTab(true);
    setEditTab(false);
    setOpenUpdateStatus(false);
  };

  // open disposed form
  const startDisposing = () => {
    setDisposedTab(true);
    setClaimTab(false);
    setEditTab(false);
    setOpenUpdateStatus(false);
  };

  //OPEN EDIT VARIABLES
  const [openUpdateStatus, setOpenUpdateStatus] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const editImageInputRef = useRef(null);
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [editForm, setEditForm] = useState({
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

  const editDateValid = isValidPastOrToday(editForm.found_date);
  const editTimeValid =
    editDateValid && isTimeNotFuture(editForm.found_date, editForm.found_time);
  const hasRequiredEditFields = Boolean(
    editForm.item_name.trim() &&
    editForm.category_id &&
    editForm.location_found.trim() &&
    editForm.found_date &&
    editForm.found_time,
  );
  const isEditFormValid = Boolean(
    hasRequiredEditFields && editDateValid && editTimeValid,
  );

  // item info button
  const startEditing = () => {
    if (!selectedItem) return;

    const foundDate = selectedItem.found_date
      ? new Date(selectedItem.found_date)
      : null;

    setEditForm({
      item_name: selectedItem.item_name || "",
      category_id: selectedItem.category_id || "",
      location_found: selectedItem.location_found || "",
      specific_location: selectedItem.specific_location || "",
      found_date: foundDate ? foundDate.toISOString().split("T")[0] : "",
      found_time: foundDate ? foundDate.toTimeString().slice(0, 5) : "",
      description: selectedItem.description || "",
      contents: selectedItem.contents || "",
      reported_by: selectedItem.reported_by || "",
      additional_notes: selectedItem.additional_notes || "",
      office_id: selectedItem.office_id || "",
    });

    setEditImageFile(null);
    setEditImagePreview(selectedItem.image_url || null);
    setIsEditing(true);
    setOpenUpdateStatus(false);
  };

  const handleEditChange = (field, value) => {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleEditDateChange = (value) => {
    setEditForm((current) => ({
      ...current,
      found_date: value,
      found_time: "",
    }));
  };

  const handleEditImageChange = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setEditImageFile(file);
    setEditImagePreview(URL.createObjectURL(file));

    try {
      setIsAnalyzing(true);

      const formData = new FormData();
      formData.append("image", file);

      const response = await fetchWithAuth(
        `${API_URL}/api/gemini-item-listing/describe-item`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI analysis failed");
      }

      setEditForm((current) => {
        const matchedCategory = categories.find(
          (item) =>
            item.category_name.toLowerCase() === data.category?.toLowerCase(),
        );

        return {
          ...current,
          item_name: data.itemName || current.item_name,
          description: data.detailedDescription || current.description,
          contents: data.contents || current.contents,
          category_id: matchedCategory
            ? String(matchedCategory.category_id)
            : current.category_id,
        };
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  //edit
  const handleCancelEdit = () => {
    setEditImageFile(null);
    setEditImagePreview(null);

    if (editImageInputRef.current) {
      editImageInputRef.current.value = "";
    }

    setIsEditing(false);
  };

  const handleCloseDetails = () => {
    setSelectedItem(null);
    setItemHistory(false);
    setIsEditing(false);
    setOpenUpdateStatus(false);
    setEditImageFile(null);
    setEditImagePreview(null);
    setIsAnalyzing(false);
    setDisposedTab(false);
    resetClaimForm();
    setItemInfo(true);
  };

  //edit
  const handleSaveEdit = async () => {
    if (!selectedItem || !isEditFormValid) {
      return;
    }

    try {
      setIsSaving(true);

      const formData = new FormData();
      formData.append("item_name", editForm.item_name.trim());
      formData.append("category_id", editForm.category_id);
      formData.append("location_found", editForm.location_found.trim());
      formData.append("specific_location", editForm.specific_location);
      formData.append(
        "found_date",
        `${editForm.found_date} ${editForm.found_time}`,
      );
      formData.append("description", editForm.description);
      formData.append("contents", editForm.contents);
      formData.append("reported_by", editForm.reported_by);
      formData.append("additional_notes", editForm.additional_notes);
      formData.append("office_id", editForm.office_id);
      formData.append("user_id", userId);

      if (editImageFile) {
        formData.append("image", editImageFile);
      }

      const response = await fetchWithAuth(
        `${API_URL}/api/found-reports/${selectedItem.found_report_id}`,
        {
          method: "PUT",
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update found item");
      }

      const refreshedResponse = await fetchWithAuth(
        `${API_URL}/api/found-reports`,
      );
      const refreshedReports = await refreshedResponse.json();

      if (Array.isArray(refreshedReports)) {
        onUpdated?.(refreshedReports);

        const updatedSelected = refreshedReports.find(
          (report) => report.found_report_id === selectedItem.found_report_id,
        );

        if (updatedSelected) {
          setSelectedItem(updatedSelected);
        }
      }

      setEditImageFile(null);
      setEditImagePreview(null);
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const fetchItemHistory = async (itemId) => {
    setIsLoading(true);
    try {
      const response = await fetchWithAuth(
        `${API_URL}/api/item-history/${itemId}`,
      );

      const data = await response.json();
      setItemHistory(data);
      if (response.ok) {
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedItem?.item_id) return;

    fetchItemHistory(selectedItem.item_id);
  }, [selectedItem]);

  const handleHiistoryTab = () => {
    setItemInfo(false);
  };

  // for claim tab
  const fetchLostReports = async (search) => {
    const normalizedSearch = search.replace(/^rpt-/i, "").replace(/^0+/, "");

    const response = await fetchWithAuth(
      `${API_URL}/api/lost-reports/search/rptlink?search=${normalizedSearch}`,
    );

    const data = await response.json();
    setSearchResults(data);
  };

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    fetchLostReports(searchTerm);
  }, [searchTerm]);

  //variable for disposal form
  const [itemWhereabouts, setItemWhereabouts] = useState("");
  const [donationDate, setDonationDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isDisposing, setIsDisposing] = useState(false);

  // Print QR Code
  const [isPrintingQR, setIsPrintingQR] = useState(false);
  const handlePrintQRCode = async () => {
    if (!selectedItem?.qr_data) return;
    setIsPrintingQR(true);
    try {
      const qrImageUrl = await QRCodeLib.toDataURL(selectedItem.qr_data, {
        width: 300,
        margin: 2,
      });

      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
                <html>
                    <head>
                        <title>Print QR Code - ${selectedItem.item_name}</title>
                        <style>
                            body {
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                height: 100vh;
                                margin: 0;
                                font-family: Arial, sans-serif;
                            }
                            .card {
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                gap: 8px;
                                padding: 24px;
                                border: 1px solid #DDD9CF;
                                border-radius: 16px;
                            }
                            .item-name {
                                font-weight: bold;
                                font-size: 18px;
                                color: #4B2D23;
                            }
                            .brand {
                                font-weight: bold;
                                font-size: 12px;
                                color: #990000;
                                margin-top: 8px;
                            }
                            img {
                                width: 220px;
                                height: 220px;
                            }
                        </style>
                    </head>
                    <body onload="window.print()">
                        <div class="card">
                            <p class="item-name">${selectedItem.item_name}</p>
                            <img src="${qrImageUrl}" alt="QR Code" />
                            <p class="brand">FoundNest</p>
                        </div>
                    </body>
                </html>
            `);
      printWindow.document.close();
    } catch (error) {
      console.error(error);
    } finally {
      setIsPrintingQR(false);
    }
  };

  const handleCancelDisposed = async () => {
    (setClaimTab(false), setEditTab(true), setDisposedTab(false));
  };

  const isValidDisposalDate = (dateStr) => {
    if (!dateStr) return false;

    const selectedDate = new Date(`${dateStr}T00:00:00`);

    if (isNaN(selectedDate.getTime())) {
      return false;
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return selectedDate <= today;
  };
  const disposalDateValid = isValidDisposalDate(donationDate);

  const isDisposalValid =
    itemWhereabouts?.trim() && donationDate && disposalDateValid;

  const handleDisposedItem = async () => {
    setIsDisposing(true);
    try {
      if (!itemWhereabouts?.trim()) {
        throw new Error("Disposal location is required.");
      }
      if (!donationDate) {
        throw new Error("Disposal date is required.");
      }
      const response = await fetchWithAuth(`${API_URL}/api/disposed-item`, {
        method: "POST",
        body: JSON.stringify({
          found_report_id: selectedItem.found_report_id,
          item_id: selectedItem.item_id,
          office_name: selectedItem.office_name,
          disposed_by_admin_id: adminId,
          disposal_whereabouts: itemWhereabouts,
          additional_notes: notes,
          disposal_date: donationDate,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to dispose item.");
        setIsDisposing(false);
      }
      // Refresh table
      const reportsResponse = await fetchWithAuth(
        `${API_URL}/api/found-reports`,
      );

      const reportsData = await reportsResponse.json();
      if (Array.isArray(reportsData)) {
        onUpdated?.(reportsData);
      }

      // reset form
      setItemWhereabouts("");
      setDonationDate("");
      setNotes("");
      setDisposedTab(false);
      setEditTab(true);
      // close modal
      setSelectedItem(null);
      setIsDisposing(false);

      alert("Item disposed successfully.");
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <>
      <div className="fixed  inset-0 z-100 w-screen h-screen bg-black/20 flex items-center justify-center">
        <div className="absolute top-0 right-0 h-full w-3/10 bg-white flex flex-col overflow-y-scroll ">
          <div className="w-full h-15 bg-primary items-center flex pl-2 gap-4 shrink-0 sticky top-0 z-50">
            <div>
              <p className="font-semibold text-sm text-white xl:text-xl">
                {" "}
                {selectedItem.item_name}
              </p>
            </div>
            <div
              className={` border-2   p-1 px-2 rounded-full text-[8px] xl:text-xs 
                                        ${selectedItem.status === "unclaimed" && "text-[#6B5C42] border-[#DDD9CF] bg-[#F5F5F5]"} 
                                        ${selectedItem.status === "claimed" && " border-green-700 bg-green-100 text-green-700"} 
                                        ${selectedItem.status === "to_be_disposed" && "text-[#FFA500] border-[#FFA500] bg-[#FFEDCC]"} 
                                        ${selectedItem.status === "disposed" && "text-[#553D25] border-[#553D25] bg-[#DDD1C5]"} 
                                       `}
            >
              <p className=" ">
                {selectedItem.status === "claimed" && "Claimed"}
                {selectedItem.status === "unclaimed" && "Unclaimed"}
                {selectedItem.status === "to_be_disposed" && "For Disposal"}
                {selectedItem.status === "disposed" && "Disposed"}
              </p>
            </div>
            <div className="ml-auto pr-6">
              <button onClick={handleCloseDetails} className="cursor-pointer">
                <i className="fa-solid fa-x text-xs xl:text-sm text-white"></i>
              </button>
            </div>
          </div>

          {editTab && (
            <>
              <div className="h-10 w-full bg-[#F5F5F5] flex shrink-0 fixed mt-15 z-50">
                <button
                  className={`text-[#6B5C42]  text-sm px-5 cursor-pointer
                                    ${itemInfo && "bg-primary text-white font-semibold border-b-2 border-b-(--color-quaternary)"} 
                                     `}
                  onClick={() => setItemInfo(true)}
                >
                  Item Info
                </button>
                <button
                  className={`text-[#6B5C42] text-sm px-5 cursor-pointer
                                        ${!itemInfo && "bg-primary text-white font-semibold border-b-2 border-b-(--color-quaternary)"}`}
                  onClick={handleHiistoryTab}
                >
                  History
                </button>
              </div>
              <div className="h-full w-full p-5 pt-15">
                {itemInfo ? (
                  <>
                    {selectedItem.linked_report &&
                      selectedItem.status === "claimed" && (
                        <div className="flex flex-col gap-2 mb-4">
                          <div className="flex items-center gap-2">
                            <Link2 size={15} />
                            <p className="text-black font-semibold text-sm">
                              LINKED LOST REPORT
                            </p>
                          </div>
                          <div className=" flex flex-col w-full  gap-2 rounded-lg bg-[#FFF9E0] border border-(--color-quaternary) p-2 xl:p-4">
                            <div className="flex justify-between text-[10px] xl:text-xs">
                              <div className="text-black font-semibold  rounded-md p-1 px-2 ">
                                <p className="font-bold">
                                  {formatReportId(selectedItem.linked_report)}
                                </p>
                              </div>
                              <div className="bg-green-100 text-green-700 rounded-xl items-center p-1 px-2 font-semibold flex text-center">
                                <p>{selectedItem.lost_report_status}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {selectedItem.lost_item_image_url && (
                                <div className="w-12 h-10 rounded-lg bg-[#F0EDE6] border border-[#DDD9CF]">
                                  <img
                                    src={selectedItem.lost_item_image_url}
                                    alt={selectedItem.lost_item_name}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              )}
                              <div className=" flex flex-col text-[10px] xl:text-xs justify-center">
                                <p className="font-semibold">
                                  {selectedItem.lost_item_name}
                                </p>
                                <p className="text-[#6B5C42]">
                                  {selectedItem.lost_item_category_name}
                                </p>
                              </div>
                            </div>
                            <div
                              className="text-[10px] xl:text-xs flex items-center font-medium underline mt-2 cursor-pointer"
                              onClick={() =>
                                navigate(
                                  `/admin/report_management?reportId=${selectedItem.linked_report}`,
                                )
                              }
                            >
                              <p>View Lost Report &nbsp; </p>
                              <i className="fa-solid fa-arrow-right"></i>
                            </div>
                          </div>
                        </div>
                      )}
                    <div className="relative w-full h-50 bg-[#F5F5F5] border border-[#DDD9CF] rounded-lg overflow-hidden">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => editImageInputRef.current?.click()}
                            className="w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer"
                          >
                            <img
                              src={editImagePreview || selectedItem.image_url}
                              alt={selectedItem.item_name}
                              className="w-full h-full object-contain"
                            />
                            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 text-primary text-[10px] px-2 py-1 rounded-md border border-[#DDD9CF]">
                              Click image to replace photo.
                            </span>
                          </button>
                          <input
                            ref={editImageInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleEditImageChange}
                          />
                        </>
                      ) : (
                        <img
                          src={selectedItem.image_url}
                          alt={selectedItem.item_name}
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                    {isAnalyzing && (
                      <span className="text-primary text-[10px] pt-2 py-1  ">
                        Analyzing image...
                      </span>
                    )}
                    <div className=" flex">
                      <div className="flex flex-col text-xs mt-5 flex-1">
                        <p className="text-[#6B5C42]">ITEM ID</p>
                        <p className="text-black">
                          {formatItemId(selectedItem.item_id)}
                        </p>
                      </div>
                      <div className="flex flex-col text-xs mt-5 flex-1">
                        <p className="text-[#6B5C42]">
                          CATEGORY
                          {isEditing && <span className="text-primary"> *</span>}
                        </p>
                        {isEditing ? (
                          <select
                            className="select select-sm bg-white border border-[#DDD9CF] text-black w-full mt-1 rounded-md"
                            value={editForm.category_id}
                            onChange={(e) =>
                              handleEditChange("category_id", e.target.value)
                            }
                          >
                            <option value="" disabled>
                              Select category
                            </option>
                            {categories.map((category) => (
                              <option
                                key={category.category_id}
                                value={category.category_id}
                              >
                                {category.category_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-black">
                            {selectedItem.category_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className=" flex">
                      <div className="flex flex-col text-xs mt-5 flex-1">
                        <p className="text-[#6B5C42]">
                          ITEM NAME
                          {isEditing && <span className="text-primary"> *</span>}
                        </p>
                        {isEditing ? (
                          <input
                            className="input input-sm bg-white border border-[#DDD9CF] text-black w-full mt-1 rounded-md"
                            value={editForm.item_name}
                            onChange={(e) =>
                              handleEditChange("item_name", e.target.value)
                            }
                          />
                        ) : (
                          <p className="text-black">{selectedItem.item_name}</p>
                        )}
                      </div>
                    </div>
                    <div className={`flex ${isEditing && "flex-col"}`}>
                      <div className="flex flex-col text-xs mt-5 flex-1">
                        <p className="text-[#6B5C42]">
                          LOCATION FOUND
                          {isEditing && <span className="text-primary"> *</span>}
                        </p>
                        {isEditing ? (
                          <select
                            className="select select-sm bg-white border border-[#DDD9CF] text-black w-full mt-1 rounded-md"
                            value={editForm.location_found}
                            onChange={(e) =>
                              handleEditChange("location_found", e.target.value)
                            }
                            required
                          >
                            <option hidden disabled value={editForm.location_found}>
                              {editForm.location_found}
                            </option>

                            {allLocations.map((option, index) => (
                              <option key={index} value={option.name}>
                                {option.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-black">
                            {selectedItem.location_found}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col text-xs mt-5 flex-1">
                        <p className="text-[#6B5C42]">
                          DATE & TIME FOUND
                          {isEditing && <span className="text-primary"> *</span>}
                        </p>
                        {isEditing ? (
                          <div className="flex gap-2 mt-1">
                            <input
                              type="date"
                              className="input input-sm bg-white border border-[#DDD9CF] text-black w-full rounded-md"
                              value={editForm.found_date}
                              max={getTodayDateString()}
                              onChange={(e) =>
                                handleEditDateChange(e.target.value)
                              }
                            />
                            <input
                              type="time"
                              className="input input-sm bg-white border border-[#DDD9CF] text-black w-full rounded-md"
                              value={editForm.found_time}
                              disabled={!editDateValid}
                              onChange={(e) =>
                                handleEditChange("found_time", e.target.value)
                              }
                            />
                          </div>
                        ) : (
                          <p className="text-black">
                            {foramtDateTimeNew(selectedItem.found_date)}
                          </p>
                        )}
                      </div>
                    </div>
                    {isEditing && editForm.found_date && !editDateValid && (
                      <p className="text-xs text-red-500 mt-1">
                        Date found cannot be in the future.
                      </p>
                    )}
                    {isEditing && !editDateValid && (
                      <p className="text-xs text-yellow-500 mt-1">
                        Enter a valid date before choosing a time.
                      </p>
                    )}
                    {isEditing &&
                      editDateValid &&
                      editForm.found_time &&
                      !editTimeValid && (
                        <p className="text-xs text-red-500 mt-1">
                          Time found cannot be in the future.
                        </p>
                      )}
                    {isEditing && !hasRequiredEditFields && (
                      <p className="text-xs text-red-500 mt-1">
                        Fill in item name, category, location found, date, and
                        time.
                      </p>
                    )}
                    <div className=" flex">
                      <div className="flex flex-col text-xs mt-5 flex-1">
                        <p className="text-[#6B5C42]">SPECIFIC LOCATION</p>
                        {isEditing ? (
                          <input
                            className="input input-sm bg-white border border-[#DDD9CF] text-black w-full mt-1 rounded-md"
                            value={editForm.specific_location}
                            onChange={(e) =>
                              handleEditChange(
                                "specific_location",
                                e.target.value,
                              )
                            }
                          />
                        ) : (
                          <p className="text-black">
                            {selectedItem.specific_location || "N/A"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className=" flex">
                      <div className="flex flex-col text-xs mt-5 flex-1">
                        <p className="text-[#6B5C42]">DESCRIPTION</p>
                        {isEditing ? (
                          <textarea
                            className="textarea bg-white border border-[#DDD9CF] text-black w-full mt-1 rounded-md text-xs"
                            value={editForm.description}
                            onChange={(e) =>
                              handleEditChange("description", e.target.value)
                            }
                          />
                        ) : (
                          <p className="text-black">
                            {selectedItem.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className=" flex">
                      <div className="flex flex-col text-xs mt-5 flex-1">
                        <p className="text-[#6B5C42]">CONTENTS</p>
                        {isEditing ? (
                          <input
                            className="input input-sm bg-white border border-[#DDD9CF] text-black w-full mt-1 rounded-md"
                            value={editForm.contents}
                            onChange={(e) =>
                              handleEditChange("contents", e.target.value)
                            }
                          />
                        ) : (
                          <p className="text-black">
                            {" "}
                            {selectedItem.contents || "N/A"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className=" flex">
                      <div className="flex flex-col text-xs mt-5 flex-1">
                        <p className="text-[#6B5C42]">REPORTED BY</p>
                        <p className="text-black">
                          {selectedItem.admin_full_name}
                        </p>
                      </div>
                      <div className="flex flex-col text-xs mt-5 flex-1">
                        <p className="text-[#6B5C42]">DATE LOGGED</p>
                        <p className="text-black">
                          {" "}
                          {new Date(
                            selectedItem.date_reported,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className=" flex">
                      <div className="flex flex-col text-xs mt-5 flex-1">
                        <p className="text-[#6B5C42]">SURRENDERED BY</p>
                        {isEditing ? (
                          <input
                            className="input input-sm bg-white border border-[#DDD9CF] text-black w-full mt-1 rounded-md"
                            value={editForm.reported_by}
                            onChange={(e) =>
                              handleEditChange("reported_by", e.target.value)
                            }
                          />
                        ) : (
                          <p className="text-black">
                            {selectedItem.reported_by}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className=" flex">
                      <div className="flex flex-col text-xs mt-5 flex-1">
                        <p className="text-[#6B5C42]">ADDITIONAL NOTES</p>
                        {isEditing ? (
                          <textarea
                            className="textarea bg-white border border-[#DDD9CF] text-black w-full mt-1 rounded-md text-xs"
                            value={editForm.additional_notes}
                            onChange={(e) =>
                              handleEditChange(
                                "additional_notes",
                                e.target.value,
                              )
                            }
                          />
                        ) : (
                          <p className="text-black">
                            {" "}
                            {selectedItem.additional_notes || "N/A"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className=" flex">
                      <div className="flex flex-col text-xs mt-5 flex-1">
                        <p className="text-[#6B5C42]">CURRENT LCOATION</p>
                        {isEditing ? (
                          <select
                            className="select select-sm bg-white border border-[#DDD9CF] text-black w-full mt-1 rounded-md"
                            value={editForm.office_id}
                            onChange={(e) =>
                              handleEditChange("office_id", e.target.value)
                            }
                          >
                            <option value="">No office</option>
                            {locations.map((office) => (
                              <option
                                key={office.office_id}
                                value={office.office_id}
                              >
                                {office.office_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-black">{selectedItem.office_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="h-fit text-[9px] xl:text-xs  font-medium flex gap-2 xl:gap-3 mt-2 ">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            className="h-full border-primary border px-5 py-3 rounded-md text-primary flex-1"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={isSaving || isAnalyzing || !isEditFormValid}
                            className="h-full border-primary border px-5 py-3 rounded-md bg-primary text-white flex-1 disabled:opacity-50 "
                            onClick={handleSaveEdit}
                          >
                            {isSaving
                              ? "Saving..."
                              : isAnalyzing
                                ? "Analyzing..."
                                : "Save Changes"}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="h-full border-primary border px-5 py-3 rounded-md text-primary flex-1 disabled:opacity-40"
                          onClick={startEditing}
                          disabled={
                            selectedItem.status === "claimed" ||
                            selectedItem.status === "disposed"
                          }
                        >
                          Edit Item Details
                        </button>
                      )}
                      {!isEditing && (
                        <div className="relative ">
                          {openUpdateStatus && (
                            <div className="absolute bottom-11 h-fit w-45 bg-white border -translate-x-14 xl:-translate-x-5 border-[#DDD9CF] rounded-md">
                              <button
                                className="text-xs p-2 border-b border-[#DDD9CF] w-full"
                                onClick={startClaiming}
                              >
                                <p className="ml-2">Mark as Claimed</p>
                              </button>
                              {selectedItem.status === "to_be_disposed" && (
                                <button
                                  className="text-xs p-2 border-b border-[#DDD9CF] w-full"
                                  onClick={startDisposing}
                                >
                                  <p className="ml-2">Mark as Disposed</p>
                                </button>
                              )}
                            </div>
                          )}
                          {!isEditing && (
                            <button
                              className="h-full border-primary py-3  border px-5 rounded-md  bg-primary text-white xl:px-7 disabled:opacity-40"
                              onClick={() => {
                                setOpenUpdateStatus(!openUpdateStatus);
                              }}
                              disabled={
                                selectedItem.status === "claimed" ||
                                selectedItem.status === "disposed"
                              }
                            >
                              Update Status{" "}
                              <i
                                className={`fa-solid fa-angle-${openUpdateStatus ? "up" : "down"} text-white`}
                              ></i>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="h-10 text-[9px] xl:text-xs mt-2  font-medium flex gap-2 xl:gap-5 ">
                      {!isEditing && (
                        <div className="w-full flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={handlePrintQRCode}
                            className={`flex gap-3  p-2 rounded-md  items-center cursor-pointer transition-transform duration-100
                                                                     active:scale-95 border border-primary text-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed`}
                            disabled={
                              selectedItem.status === "claimed" ||
                              selectedItem.status === "disposed" ||
                              !selectedItem.qr_code_id ||
                              isPrintingQR
                            }
                          >
                            <QrCode size="20" />
                            <p>{isPrintingQR ? "Preparing..." : "Print QR Code"}</p>
                          </button>
                          {!selectedItem.qr_code_id && (
                            <p className="text-[#6B5C42] text-[10px] text-center">
                              This item was not pre-registered with a QR code by
                              its owner.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {!isLoading ? (
                      <>
                        {itemHistory.length > 0 ? (
                          <>
                            {itemHistory?.map((history) => {
                              return (
                                <div
                                  className="w-full  bg-[#F5F5F5] border border-[#DDD9CF] rounded-lg flex gap-2 p-3 mb-2"
                                  key={history.history_id}
                                >
                                  <div className=" h-full">
                                    <i className="fa-regular fa-clock text-(--color-quaternary)"></i>
                                  </div>
                                  <div>
                                    <p className="text-xs">
                                      {history.history_type}
                                    </p>
                                    <p className="text-[10px] text-[#6B5C42] mb-1">
                                      {history.details}
                                    </p>
                                    <p className="text-[10px] text-[#6B5C42]">
                                      {history.full_name || "N/A"} ·{" "}
                                      <span>
                                        {formatNotificationDate(
                                          history.created_at,
                                        )}
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </>
                        ) : (
                          <span className="text-[#6B5C42] text-sm">
                            No history yet
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-[#6B5C42] text-sm">
                        Fetching item history . . .
                      </span>
                    )}
                  </>
                )}
                <div className="h-5"></div>
              </div>
            </>
          )}
          {claimTab && (
            <>
              <div className="h-10 w-full bg-[#F5F5F5] flex shrink-0 fixed mt-15 z-50">
                <button
                  className={`text-[#6B5C42]  text-sm px-5
                                    ${itemInfo && "bg-primary text-white font-semibold border-b-2 border-b-(--color-quaternary)"} 
                                     `}
                >
                  Mark as Claimed
                </button>
              </div>
              <div className="h-full w-full p-5 pt-15">
                <AdminTextField
                  title="Claimant Full Name"
                  reqField={true}
                  placeholder="Full name of claimant"
                  value={fullName}
                  onChange={setFullName}
                />
                <div className="w-full mt-3 flex flex-col gap-2">
                  <p className="text-sm font-medium">
                    BulSU Email / Contact Number{" "}
                    <span className="text-primary">*</span>
                  </p>
                  <div className="w-full h-10 flex ">
                    <button
                      className={`flex-1 text-[#6B5C42] rounded-l-lg text-xs font-semibold border border-[#DDD9CF]
                                                    ${!identifierToggle && "text-white bg-primary border-primary"}`}
                      onClick={() => {
                        setIdentifierToggle(false);
                      }}
                    >
                      Email
                    </button>
                    <button
                      className={`flex-1  text-[#6B5C42] rounded-r-lg  text-xs font-semibold border border-[#DDD9CF]
                                                    ${identifierToggle && "text-white bg-primary border-primary"}`}
                      onClick={() => {
                        setIdentifierToggle(true);
                      }}
                    >
                      Contact No.
                    </button>
                  </div>
                  {identifierToggle ? (
                    <input
                      type="text"
                      className="input border border-[#DDD9CF] bg-white rounded-md text-sm w-full"
                      placeholder="e.g. 09XXXXXXXXX"
                      value={claimantNumber}
                      onChange={(e) => setClaimantNumber(e.target.value)}
                    />
                  ) : (
                    <input
                      type="email"
                      className="input border border-[#DDD9CF] bg-white rounded-md text-sm w-full"
                      placeholder="e.g. juan@gmail.com"
                      value={claimantEmail}
                      onChange={(e) => setClaimantEmail(e.target.value)}
                    />
                  )}
                  {!isValidEmail && claimantEmail && (
                    <span className="text-xs text-primary">
                      Please enter a valid Email
                    </span>
                  )}
                  {!isValidPhone && claimantNumber && (
                    <span className="text-xs text-primary">
                      Please enter a valid phone number
                    </span>
                  )}
                  <span className="text-xs text-[#6B5C42]">
                    At least one identifier is required.
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-medium">
                    Proof of Claim Photo Upload{" "}
                    <span className="text-primary">*</span>
                  </p>
                  <p className="text-xs text-[#6B5C42]">
                    Take or upload a photo of the claimant holding or standing
                    with the claimed item.
                  </p>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-full h-30 border border-dashed border-(--color-quaternary) bg-[#F5F5F5] rounded-lg mt-1 flex flex-col justify-center items-center gap-1 overflow-hidden"
                  >
                    {claimantImage ? (
                      <>
                        <img
                          src={claimantImage}
                          alt="Selected found item"
                          className="h-full w-full object-contain"
                        />
                        <span className="absolute bottom-2  left-1/2 -translate-x-1/2 bg-white/90 text-primary text-[10px] px-2 py-1 rounded-md border border-[#DDD9CF]">
                          Click image to replace photo.
                        </span>
                      </>
                    ) : (
                      <>
                        <i className="fa-regular fa-camera text-(--color-quaternary) text-2xl"></i>
                        <p className="text-[#6B5C42] text-xs">
                          Click to upload photo.
                        </p>
                      </>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleClaimantFileChange}
                  />
                  <div className="mt-3">
                    <p className="text-sm font-medium">
                      Verification Details
                      <span className="text-primary">*</span>
                    </p>

                    <p className="text-xs text-[#6B5C42]">
                      Describe how ownership was verified.
                    </p>

                    <textarea
                      className="textarea w-full bg-white border border-[#DDD9CF] rounded-md mt-1"
                      rows={3}
                      placeholder="Example: Claimant identified contents inside the wallet and presented a valid school ID."
                      value={verificationDetails}
                      onChange={(e) => setVerificationDetails(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-3 flex flex-col">
                  <p className="text-sm font-medium">
                    Link to a Lost Report{" "}
                    <span className="text-black/40">(Optional)</span>
                  </p>
                  <p className="text-[#6B5C42] text-xs">
                    If the claimant has an existing lost report for this item,
                    link it here. The report will be automatically marked as
                    Resolved when the item is released.
                  </p>
                  <div className="relative w-full">
                    {showSearchResults && searchResults?.length > 0 && (
                      <div className="w-full h-fit border border-[#DDD9CF] rounded-md">
                        <div className="absolute bottom-full w-full h-fit border border-[#DDD9CF] rounded-md bg-white z-50">
                          {searchResults.map((result) => (
                            <button
                              key={result.lost_report_id}
                              type="button"
                              className="w-full text-sm flex p-2  border-b border-b-[#DDD9CF] hover:bg-gray-100"
                              onClick={() => {
                                setLinkReport(result);
                                setShowSearchResults(false);
                              }}
                            >
                              <p className="flex-1 text-left">
                                {formatReportId(result.lost_report_id)}
                              </p>

                              <p className="flex-1 text-left">
                                {result.item_name}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {linkReport && (
                      <div className="w-full h-fit border border-(--color-quaternary) rounded-md mt-1">
                        <div className="w-full text-sm  flex bg-(--color-quaternary)/20  p-2 border-b border-b-[#DDD9CF]">
                          <p className="flex-1 overflow-x-auto min-w-0 truncate">
                            {formatReportId(linkReport.lost_report_id)}
                          </p>
                          <p className="flex-1 min-w-0 truncate">
                            {linkReport.item_name}
                          </p>
                          <button
                            onClick={() => {
                              setLinkReport(null);
                            }}
                          >
                            <i className="fa-solid fa-trash-can text-primary"></i>
                          </button>
                        </div>
                      </div>
                    )}

                    <div
                      className="flex flex-1 border border-[#DDD9CF]  rounded-md shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)]
                                                            items-center mt-2"
                    >
                      <i className="fa-solid fa-magnifying-glass text-primary ml-2"></i>
                      <input
                        type="text"
                        placeholder="Search"
                        className="input input-bordered flex-1"
                        onFocus={() => setShowSearchResults(true)}
                        onBlur={() => {
                          setTimeout(() => {
                            setShowSearchResults(false);
                          }, 200);
                        }}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <hr className="border-(--color-tertiary) my-5 opacity-30" />
                <div className="w-full h-10  flex gap-2 text-xs">
                  <button
                    className={`px-2 h-full bg-white border border-primary text-primary  font-medium rounded-md`}
                    onClick={() => {
                      setClaimTab(false), setEditTab(true);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={
                      !isClaimValid ||
                      isReleasing ||
                      (!isValidEmail && claimantEmail) ||
                      (!isValidPhone && claimantNumber)
                    }
                    onClick={handleItemRelease}
                    className={`flex-1 h-full bg-primary font-medium text-white rounded-md disabled:opacity-40 `}
                  >
                    {isReleasing ? "Releasing..." : "Confirm Release"}
                  </button>
                </div>
                <div className="h-5"></div>
              </div>
            </>
          )}
          {disposedTab && (
            <>
              <div className="h-10 w-full bg-[#F5F5F5] flex shrink-0 fixed mt-15 z-50 ">
                <button
                  className={` text-sm px-5
                                    bg-primary text-white font-semibold border-b-2 border-b-(--color-quaternary) 
                                     `}
                >
                  Mark as Disposed
                </button>
              </div>
              <div className="h-full w-full p-5 pt-15 flex flex-col">
                <div className="flex flex-col gap-2 mb-5">
                  <p className="text-md font-medium">Confirm Disposal</p>
                  <p className="text-xs text-justify">
                    This item will be marked for donation. Please provide the
                    donation details before confirming.
                  </p>
                </div>
                <AdminTextField
                  title="Disposed To/Location"
                  reqField={true}
                  value={itemWhereabouts}
                  onChange={setItemWhereabouts}
                />
                <AdminDateInput
                  title="Date of Donation"
                  reqField={true}
                  value={donationDate}
                  onChange={setDonationDate}
                />
                {donationDate && !disposalDateValid && (
                  <p className="text-xs text-primary">
                    Disposal date cannot be in the future.
                  </p>
                )}
                <AdminTextArea
                  title="Additional Notes"
                  reqField={true}
                  value={notes}
                  onChange={setNotes}
                />
                <div className="w-full h-10  flex gap-2 text-xs mt-auto">
                  <button
                    className={`px-2 h-full bg-white border border-primary text-primary  font-medium rounded-md`}
                    onClick={handleCancelDisposed}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!isDisposalValid || isDisposing}
                    onClick={handleDisposedItem}
                    className={`flex-1 h-full bg-[#DDD1C5]  font-medium text-[#553D25] rounded-md disabled:opacity-40`}
                  >
                    {isDisposing ? "Disposing..." : "Confirm Dispossal"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}