import { useEffect, useRef, useState } from "react";
import { Pencil, X, QrCode, Link2, ArchiveRestore, Archive, Info, CircleCheck, Handshake } from "lucide-react";
import { formatActionType } from "../../utils/formatActionType.js";
import formatNotificationDate from "../../utils/fotmatNotifications.js";

import { fetchWithAuth } from "../../utils/fetchWithAuth.js";
import { useNavigate } from "react-router-dom";

import { toast } from "react-toastify";
import AdminConfirmDialog from "../AdminConfirmDialog.jsx";
import {
  archiveFoundReport,
  restoreFoundReport,
  searchLostReports,
  getDisposedDetails,
} from "./services/foundReportModalServices.js";

import FoundReportDetailsTab from "./tabs/FoundReportDetailsTab.jsx"
import ClaimFoundReportTab from "./tabs/ClaimFoundReportTab.jsx"
import DisposeFoundReportTab from "./tabs/DisposeFoundReportTab.jsx"
import EditFoundReportTab from "./tabs/EditFoundReportTab.jsx"

import { useSaveEditReport } from "./hooks/useSaveEditReport.js";
import { useRefreshFoundReports } from "./utils/useRefreshFoundReports.js";
import ArchiveDialog from "../ArchiveDialog.jsx";
import RestoreDialog from "../RestoreDialog.jsx";
import ScaleImage from "../ScaleImage.jsx";


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

  const adminFullName = localStorage.getItem("first_name") + " " + localStorage.getItem("last_name");
  const officeIdNotification = localStorage.getItem("office_location");

  const foundReportId = selectedItem?.found_report_id;

  const [selectedImage, setSelectedImage] = useState();
  const [searchResults, setSearchResults] = useState();

  //hooks
  const { saveEdit, isSavingEdit } = useSaveEditReport();
  const { refreshReports } = useRefreshFoundReports({
    onUpdated,
    selectedItem,
    setSelectedItem,
  });

  const [linkModal, setLinkModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [imageSelected, setImageSelected] = useState(false);
  const [openArchivedDialog, setOpenArchivedDialog] = useState(false);
  const [openClaimNavigateDialog, setOpenClaimNavigateDialog] = useState(false);
  const [openRestoreDialog, setOpenRestoreDialog] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [openUpdateStatus, setOpenUpdateStatus] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const userId = localStorage.getItem("user_id");
  const navigate = useNavigate();

  //HANDLE STATUS UPDATE TAB
  const [claimTab, setClaimTab] = useState(false);
  const [disposedTab, setDisposedTab] = useState(false);
  const [editTab, setEditTab] = useState(true);


  const [fullName, setFullName] = useState("");


  const [successData, setSuccessData] = useState(null);

  const handleClaimSuccess = (claimId, claimantFullName) => {
    setSuccessData({ claimId, fullName: claimantFullName });
    setClaimTab(false);
    setEditTab(true);
    setOpenClaimNavigateDialog(true);
  };

  const formatTXNId = (id) => {
    return `TXN-${String(id).padStart(5, "0")}`;
  };

  //format item id
  const formatItemId = (id) => {
    return `SI-${String(id).padStart(5, "0")}`;
  };

  const [claimId, setClaimId] = useState(null);

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
  const [editImagePreview, setEditImagePreview] = useState(false);
  const [originalEditForm, setOriginalEditForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const editImageInputRef = useRef(null);
  const [editImageFile, setEditImageFile] = useState(null);
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

    const formData = {
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

    setEditForm(formData);
    setOriginalEditForm(formData);

    setEditImageFile(null);
    setEditImagePreview(selectedItem.image_url || null);
    setIsEditing(true);
    setOpenUpdateStatus(false);
  };

  const handleCloseDetails = () => {
    setSelectedItem(null);
    setItemHistory(false);
    setIsEditing(false);
    setOpenUpdateStatus(false);
    setEditImageFile(null);
    setEditImagePreview(null);
    setDisposedTab(false);
    setItemInfo(true);
  };

  const handleSaveEdit = async () => {

    setOpenUpdateDialog(false);

    if (!selectedItem || !isEditFormValid) {
      return;
    }
    try {

      await saveEdit({
        reportId: foundReportId,
        editForm,
        editImageFile,
        userId,
      });

      await refreshReports();

      setOriginalEditForm({ ...editForm });

      toast.success(
        `Successfully updated ${formatItemId(selectedItem.item_id)}`
      );

      setEditImageFile(null);
      setEditImagePreview(null);
      setIsEditing(false);

    } catch (error) {

      console.error(error);
      toast.error(error.message);

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
    setClaimTab(false);
    setEditTab(true)
  };
  // for claim tab
  const fetchLostReports = async (search) => {
    const data = await searchLostReports(search);
    setSearchResults(data);
  };

  //archive states
  const [isArchiving, setIsArchiving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);



  //Archive Item
  const handleArchiveReport = async (foundReportId) => {
    const officeId = (officeIdNotification && officeIdNotification !== "undefined") ? officeIdNotification : null;
    setIsArchiving(true);
    try {

      const data = await archiveFoundReport(foundReportId, {
        office_id: officeId,
        admin_full_name: adminFullName,
      })

      await refreshReports();
      setOpenArchivedDialog(false);
      toast.success(`Successfully marked ${formatItemId(selectedItem.item_id)} as Archived.`)
      setIsArchiving(false);
    } catch (error) {
      setIsArchiving(false);
      setOpenArchivedDialog(false);
      console.error(error);
      toast.error(error.message);
    }
  };

  const handleRestoreReport = async (foundReportId) => {

    try {
      const officeId = (officeIdNotification && officeIdNotification !== "undefined") ? officeIdNotification : null;
      setIsRestoring(true);

      const data = await restoreFoundReport(foundReportId, { office_id: officeId, admin_full_name: adminFullName });

      await refreshReports();

      setOpenRestoreDialog(false);
      setIsRestoring(false);
      toast.success(`Restored ${formatItemId(selectedItem.item_id)} Succesfully.`)

    } catch (error) {
      setOpenRestoreDialog(false);
      setIsRestoring(false);
      toast.error(`Failed to Restore ${formatItemId(selectedItem.item_id)}`)
    }
  };

  const [claimRecord, setClaimRecord] = useState();
  const [isClaimRecordLoading, setIsClaimRecordLoading] = useState(false);
  const [isDisposedDetails, setIsDisposedDetails] = useState(false);

  const [disposedDetails, setDisposedDetails] = useState([]);



  const fetchDisposedDetails = async () => {
    if (!selectedItem.found_report_id) return;

    try {
      setIsDisposedDetails(true);

      const result = await getDisposedDetails(selectedItem.found_report_id);

      setDisposedDetails(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDisposedDetails(false);
    }
  };

  const fetchClaimRecordByFoundId = async () => {
    if (!foundReportId) return;

    try {
      setIsClaimRecordLoading(true);

      const response = await fetchWithAuth(
        `${API_URL}/api/claim-records/found-report/${foundReportId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch claim record.");
      }

      const result = await response.json();

      setClaimRecord(result);

    } catch (err) {
      console.error(err);
    } finally {
      setIsClaimRecordLoading(false);
    }
  };
  useEffect(() => {

    if (selectedItem?.status === "claimed") {
      fetchClaimRecordByFoundId();
    }
    else {
      setClaimRecord(null);
    }
    if (selectedItem?.status === "disposed") {
      fetchDisposedDetails();
    } else {
      setDisposedDetails(null)
    }
  }, [selectedItem])

  return (
    <>
      <div className="fixed  inset-0 z-100 w-screen h-screen bg-black/20 flex items-center justify-center">
        <div className="absolute top-0 right-0 h-full w-3/10 bg-white flex flex-col overflow-y-scroll ">
          <div className=" flex flex-col  top-0 w-3/10 fixed z-100">
            <div className="w-full h-15 bg-primary items-center flex pl-2 gap-4 z-100">
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
                                        ${selectedItem.status === 'archived' && "bg-violet-100 text-violet-700 border-violet-700"}
                                       `}
              >
                <p className=" ">
                  {selectedItem.status === "claimed" && "Claimed"}
                  {selectedItem.status === "unclaimed" && "Unclaimed"}
                  {selectedItem.status === "to_be_disposed" && "For Disposal"}
                  {selectedItem.status === "disposed" && "Disposed"}
                  {selectedItem.status === "archived" && "Archived"}
                </p>
              </div>
              <div className="ml-auto pr-5">
                <button onClick={handleCloseDetails} className="cursor-pointer">
                  <i className="fa-solid fa-x text-xs xl:text-sm text-white"></i>
                </button>
              </div>

            </div>
            <div className="h-10 w-full bg-[#F5F5F5] flex shrink-0 z-50">
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
          </div>

          {editTab && (
            <>

              <div className="h-full w-full p-5 pt-30">
                {itemInfo ? (
                  <>
                    {isEditing ?
                      (
                        <>
                          <EditFoundReportTab
                            selectedItem={selectedItem}
                            setSelectedItem={setSelectedItem}
                            categories={categories}
                            locations={locations}
                            allLocations={allLocations}
                            setIsEditing={setIsEditing}
                            refreshReports={refreshReports}
                          />
                        </>
                      )
                      :
                      (
                        <FoundReportDetailsTab
                          selectedItem={selectedItem}
                          claimRecord={claimRecord}
                          isClaimRecordLoading={isClaimRecordLoading}
                          disposedDetails={disposedDetails}
                          setSelectedImage={setSelectedImage} // Uses the parent's full-screen image preview state

                          // Wiring up the callbacks to the parent's state changes
                          onEdit={startEditing}
                          onClaim={startClaiming}
                          onDispose={startDisposing}
                          onArchive={() => setOpenArchivedDialog(true)}
                          onRestore={() => setOpenRestoreDialog(true)}
                        />
                      )

                    }
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
                                      {formatActionType(history.history_type)}
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
            <ClaimFoundReportTab
              selectedItem={selectedItem}
              refreshReports={refreshReports}
              onCancel={() => {
                setClaimTab(false);
                setEditTab(true);
              }}
              onSuccess={handleClaimSuccess}
              setClaimId={setClaimId}
            />
          )}
          {disposedTab && (
            <DisposeFoundReportTab
              selectedItem={selectedItem}
              refreshReports={refreshReports}
              onCancel={() => {
                setDisposedTab(false);
                setEditTab(true);
              }}
            />
          )}
        </div>
      </div>

      {imageSelected &&
        (
          <>
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-1020">
              <div className="relative bg-white  rounded-lg w-100 h-fit flex flex-col">
                <div className="w-full h-10 rounded-t-lg bg-primary text-white flex items-center justify-between px-5">
                  <p className="font-semibold">Link Report</p>
                  <button onClick={() => setImageSelected(false)}><i className="fa-solid fa-x text-xs xl:text-sm text-white"></i></button>
                </div>
                <div className="w-full flex flex-col p-3 gap-2">
                  <div className="w-full h-80 rounded-lg bg-[#F0EDE6] border border-[#DDD9CF]">
                    <img
                      src={selectedReport.image_url}
                      alt={selectedReport.item_name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )
      }
      {openArchivedDialog && (
  <ArchiveDialog
    open={openArchivedDialog}
    onClose={() => setOpenArchivedDialog(false)}
    onConfirm={() => handleArchiveReport(selectedItem.found_report_id)}
    isArchiving={isArchiving}
  />
)}
      {openRestoreDialog &&
        (
          <RestoreDialog
            open={openRestoreDialog}
            onClose={() => setOpenRestoreDialog(false)}
            isRestoring={isRestoring}
            onConfirm={() => handleRestoreReport(selectedItem.found_report_id)}

          />
        )
      }
      {openUpdateDialog &&
        (
          <>
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-1020">
              <div className="relative bg-white rounded-lg w-100 h-fit flex flex-col">
                {/* Header */}
                <div className="w-full h-10 rounded-t-lg bg-primary text-white flex items-center justify-between px-5">
                  <p className="font-semibold">Confirm Update</p>
                  <button onClick={() => setOpenUpdateDialog(false)}>
                    <i className="fa-solid fa-x text-xs xl:text-sm text-white"></i>
                  </button>
                </div>

                <div className="flex flex-col flex-1 p-3 gap-3">
                  {/* Icon & Title */}
                  <div className="w-full flex flex-col justify-center items-center mt-2">
                    <Info size={40} className="text-[#4A5568]" />
                    <p className="text-md font-medium mt-2">Update Item?</p>
                  </div>
                  {/* Update Message */}
                  <div className="text-sm text-center px-2 text-gray-700">
                    <p>Are you sure you want to save these changes on Item <span className="font-semibold text-black">{formatItemId(selectedItem.item_id)}</span>?.</p>
                  </div>

                  <hr className="border-(--color-tertiary) my-2 opacity-30" />
                  {/* Buttons */}
                  <div className="flex gap-2">
                    <button
                      className="w-full h-10 flex-1 bg-white rounded-lg text-primary border border-primary text-sm font-medium transition-transform duration-100 active:scale-95"
                      onClick={() => setOpenUpdateDialog(false)}
                    >
                      Keep Editing
                    </button>
                    <button
                      className="w-full h-10 flex-1 disabled:opacity-40 bg-primary rounded-lg text-white text-sm font-medium transition-transform duration-100 active:scale-95"
                      onClick={() => handleSaveEdit(foundReportId)}
                    >
                      {isSavingEdit ? "Updating..." : "Update Item"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )
      }

      {openClaimNavigateDialog &&
        <AdminConfirmDialog
          description={`Item ${formatItemId(selectedItem.item_id)} successfully released to ${fullName}.`}
          onClose={() => {
            setOpenClaimNavigateDialog(false)
          }
          }
          onConfirm={() => {
            navigate(
              `/admin/transactions?claimId=${claimId}`
            )
          }}
          Icon={CircleCheck}
          iconColor="text-[#22C55E]"
          cancelText="Close"
          confirmText="View Transaction"
          message={`Transaction ${formatTXNId(claimId)} has been created.`}
          title="Item Released"

        />
      }

      {selectedImage &&
        <ScaleImage
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
        />
      }
    </>
  );
}