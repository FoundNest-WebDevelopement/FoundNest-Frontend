import { useState } from "react";
import formatDate from "../../utils/formatDate";
import formatTime from "../../utils//formatTime";
import formatDateTime from "../../utils//formatDataTimeNew";
import { fetchWithAuth } from "../../utils//fetchWithAuth";
import { Link2, Archive, ArchiveRestore, X } from "lucide-react"
import { useNavigate } from "react-router-dom";
import AdminConfirmDialog from "../AdminConfirmDialog";
import { toast } from "react-toastify";
import ArchiveDialog from "../ArchiveDialog";
import RestoreDialog from "../RestoreDialog";
import EditTab from "./tabs/EditTab";
import ScaleImage from "../ScaleImage";
import { getLostReports, resolveLostReport } from "./services/LostReportModalService";
import { formatItemId, formatReportId } from "../../utils/formatId";



export default function LostReportMangementModal(
    { selectedItem = [],
        setSelectedItem,
        itemInfo,
        setItemInfo,
        categories = [],
        locations = [],
        sharedSpaces = [],
        gates = [],
        onUpdated,
        allLocations = [],
        
    }

) {

    const API_URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();

    const adminFullName = localStorage.getItem("first_name") + " " + localStorage.getItem("last_name");
    const officeIdNotification = localStorage.getItem("office_location");

    const userId = localStorage.getItem("user_id");

    const lostReportId = selectedItem.lost_report_id;

    const [selectedImage, setSelectedImage] = useState(null);

    //mark as resovle toggle variable
    const [resolved, setResolved] = useState(false);

    const [editTab, setEditTab] = useState(false);

    //update status states
    const [openUpdateStatus, setOpenUpdateStatus] = useState(false);
    const [openArchiveDialog, setOpenArchiveDialog] = useState(false);
    const [openRestoreDialog, setOpenRestoreDialog] = useState(false);

    //Close and reset Modal
    const handleCloseModal = () => {
        setSelectedItem(null);
    }

    //format location
    function formatLocation(locationLost) {
        if (!locationLost) return "N/A";


        if (Array.isArray(locationLost)) {
            return locationLost.join(", ");
        }


        if (typeof locationLost === "string") {
            try {
                const parsed = JSON.parse(locationLost);

                if (Array.isArray(parsed)) {
                    return parsed.join(", ");
                }
            } catch {

            }

            return locationLost;
        }

        return String(locationLost);
    }

    const [isLoading, setIsLoading] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    const handleResolvedReport = async (lostReportId) => {
        setIsLoading(true);
        setOpenUpdateStatus(false);
        try {
            const data = await resolveLostReport(lostReportId, adminFullName);

            const reportsData = await getLostReports();
            if (Array.isArray(reportsData)) {
                onUpdated?.(reportsData);
            }
            const updatedReport = reportsData.find(
                report => report.lost_report_id === lostReportId
            );

            toast.success(`Successfully marked ${formatReportId(lostReportId)} as Resolved.`)
            setSelectedItem(updatedReport);
            setIsLoading(false)
            setResolved(false)
        } catch (err) {
            console.error(err);
            toast.error(err.message);
            setIsLoading(false)
        }
    };

    const handleArchiveReport = async () => {
        setIsArchiving(true);
        setOpenUpdateStatus(false);
        try {
            const officeIdTemp = (officeIdNotification && officeIdNotification !== "undefined") ? officeIdNotification : null;

            const response = await fetchWithAuth(
                `${API_URL}/api/lost-reports/${selectedItem.lost_report_id}/archive`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        office_id: officeIdTemp,
                        admin_full_name: adminFullName,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Failed to archive report"
                );
            }

            // Refresh table
            const reportsResponse = await fetchWithAuth(
                `${API_URL}/api/lost-reports`
            );

            const reportsData = await reportsResponse.json();

            if (Array.isArray(reportsData)) {
                onUpdated?.(reportsData);
            }

            const updatedReport = reportsData.find(
                report =>
                    report.lost_report_id ===
                    selectedItem.lost_report_id
            );

            if (updatedReport) {
                setSelectedItem(updatedReport);
            }

            toast.success(
                `Successfully marked ${formatReportId(selectedItem.lost_report_id)} as Archived. .`
            );
            setOpenArchiveDialog(false);

        } catch (err) {
            console.error(err);
            toast.error(err.message);
        } finally {
            setIsArchiving(false);
        }
    };

    const handleRestoreReport = async () => {
        setIsRestoring(true);


        try {
            const officeIdTemp = (officeIdNotification && officeIdNotification !== "undefined")
                ? officeIdNotification
                : null;


            const response = await fetchWithAuth(
                `${API_URL}/api/lost-reports/${selectedItem.lost_report_id}/restore`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        office_id: officeIdTemp,
                        admin_full_name: adminFullName,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Failed to restore report"
                );
            }

            // Refresh table
            const reportsResponse = await fetchWithAuth(
                `${API_URL}/api/lost-reports`
            );

            const reportsData = await reportsResponse.json();

            if (Array.isArray(reportsData)) {
                onUpdated?.(reportsData);
            }

            const updatedReport = reportsData.find(
                report =>
                    report.lost_report_id ===
                    selectedItem.lost_report_id
            );

            if (updatedReport) {
                setSelectedItem(updatedReport);
            }

            setOpenRestoreDialog(false);

            toast.success(
                `Successfully restored ${formatReportId(selectedItem.lost_report_id)}.`
            );

        } catch (err) {
            console.error(err);
            toast.error(err.message);
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <>
            <div className="fixed  inset-0 z-100 w-screen h-screen bg-black/20 flex items-center justify-center">
                <div className="absolute top-0 right-0 h-full w-3/10 bg-white flex flex-col">
                    <div className="w-full h-15 bg-primary items-center flex pl-2 gap-4 shrink-0 sticky top-0 z-50">
                        <p className="text-white font-semibold text-md xl:text-lg pl-2">Report Details</p>
                        <div className="ml-auto pr-6">
                            <button onClick={handleCloseModal} className="cursor-pointer"><i className="fa-solid fa-x text-xs xl:text-sm text-white"></i></button>
                        </div>
                    </div>
                    {editTab? 
                        (
                            <>
                                <EditTab
                                    selectedItem={selectedItem}
                                    setSelectedItem={setSelectedItem}
                                    categories={categories}
                                    sharedSpaces={sharedSpaces}
                                    gates={gates}
                                    locations={locations}
                                    setEditTab={setEditTab}
                                    onUpdated={onUpdated}

                                />
                            </>
                        )
                        :
                        (
                            <>
                              <div className="h-full w-full p-5 flex-1 overflow-y-auto">
                        {selectedItem.found_report_id &&
                            (
                                <>
                                    <div className="flex flex-col gap-2 mb-4">
                                        <div className="flex items-center gap-2">
                                            <Link2 size={15} />
                                            <p className="text-black font-semibold text-sm">LINKED FOUND ITEM</p>
                                        </div>
                                        <div className=" flex flex-col w-full  gap-2 rounded-lg bg-[#FFF9E0] border border-(--color-quaternary) p-2 xl:p-4">
                                            <div className="flex justify-between text-[10px] xl:text-xs">
                                                <div className="text-black font-semibold  rounded-md p-1 px-2 ">
                                                    <p className="font-bold">{formatItemId(selectedItem.found_report_id)}</p>
                                                </div>
                                                <div className="bg-green-100 text-green-700 rounded-xl items-center p-1 px-2 font-semibold flex text-center">
                                                    <p>{selectedItem.found_report_status}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="w-12 h-10 rounded-lg bg-[#F0EDE6] border border-[#DDD9CF]">
                                                    <img src={selectedItem.found_item_image_url} alt={selectedItem.found_item_name}
                                                        className="w-full h-full object-contain" />
                                                </div>
                                                <div className=" flex flex-col text-[10px] xl:text-xs justify-center">
                                                    <p className="font-semibold">{selectedItem.found_item_name}</p>
                                                    <p className="text-[#6B5C42]">{selectedItem.found_item_category_name}</p>
                                                </div>

                                            </div>
                                            <button className="bg-green-700 text-white text-[10px] xl:text-xs flex items-center font-medium mt-2 cursor-pointer w-fit py-1 px-2 rounded-md"
                                                onClick={() =>
                                                    navigate(
                                                        `/admin/item_management?itemId=${selectedItem.found_item_id}`
                                                    )
                                                }
                                            >
                                                <p>View Found Item &nbsp; </p>
                                                <i className="fa-solid fa-arrow-right"></i>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )
                        }
                        <div className="flex flex-col w-full h-fit gap-2">
                            <div className="flex justify-between">
                                <p className="text-black font-bold ">{formatReportId(selectedItem.lost_report_id)}</p>
                                <div className={`px-3 py-1 rounded-full text-xs font-medium 
                                        ${selectedItem.status === "resolved" && "bg-green-100 text-green-700"}
                                        ${selectedItem.status == "open" && "    bg-[#E6F1FB] text-[#2980B9]"}
                                        ${selectedItem.status === "archived" && "bg-violet-100 text-violet-700"}
                                               `}
                                >
                                    <p>   {selectedItem.status === 'resolved' && "Resolved"}
                                        {selectedItem.status === 'open' && "Open"}
                                        {selectedItem.status === 'archived' && "Archived"}
                                    </p>
                                </div>
                            </div>
                            <div className="text-[#6B5C42] text-xs flex items-center gap-1">
                                <i className="fa-regular fa-clock"></i>
                                <p>Submitted on {formatDate(selectedItem.date_reported)}</p>
                            </div>
                        </div>
                        <hr className="border-(--color-tertiary) my-5 opacity-30" />
                        <div className="flex flex-col w-full h-fit gap-2">
                            <p className="text-black font-semibold text-sm">REPORTED BY</p>
                            <div className="flex gap-2">
                                <div className="h-20 w-20 rounded-full p-1 border border-(--color-quaternary) shrink-0">
                                    <img src={selectedItem.prfile_image_url || "https://t3.ftcdn.net/jpg/18/48/72/28/360_F_1848722869_Mld2cRALJUqHaN2mdDt1JIqufXkAf1DI.jpg"}
                                        alt=""
                                        className="w-full h-full rounded-full object-contain"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div>
                                        <p className="font-semibold">{selectedItem.owner_name || selectedItem.reported_by}</p>
                                        <p className="text-xs">{selectedItem.student_number || ""}</p>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-xs text-[#6B5C42]">{selectedItem.email? "EMAIL" : "CONTACT NUMBER"}</p>
                                        <p className="text-xs">{selectedItem.email? selectedItem.email : selectedItem.contact_number}</p>
                                    </div>
                                </div>
                            </div>
                            <hr className="border-(--color-tertiary) my-5 opacity-30" />
                            <div className=" flex flex-col">
                                <p className="text-black font-semibold text-sm">LOST ITEM DETAILS</p>
                                <div className="my-2">
                                    <p className="font-semibold">{selectedItem.item_name}</p>
                                </div>
                                <div className="flex flex-col gap-2 mb-5">
                                    <div>
                                        <div className="flex flex-col flex-1">
                                            <p className="text-xs text-[#6B5C42]">CATEGORY</p>
                                            <p className="text-xs">{selectedItem.category_name}</p>
                                        </div>

                                    </div>
                                    <div>
                                        <div className="flex flex-col flex-1">
                                            <p className="text-xs text-[#6B5C42]">DESCRIPTION</p>
                                            <p className="text-xs">{selectedItem.description}</p>
                                        </div>

                                    </div>
                                    <div>
                                        <div className="flex flex-col flex-1">
                                            <p className="text-xs text-[#6B5C42]">CONTENTS</p>
                                            <p className="text-xs">{selectedItem.contents || "None"}</p>
                                        </div>

                                    </div>
                                    <div className="flex">
                                        <div className="flex flex-col flex-1">
                                            <p className="text-xs text-[#6B5C42]">DATE LOST</p>
                                            <p className="text-xs">{formatDate(selectedItem.lost_date)}</p>
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <p className="text-xs text-[#6B5C42]">EST. TIME LOST</p>
                                            <p className="text-xs">{formatTime(selectedItem.lost_date)}</p>
                                        </div>

                                    </div>
                                    <div className="flex">
                                        <div className="flex flex-col flex-1">
                                            <p className="text-xs text-[#6B5C42]">LOCATION LOST</p>
                                            <p className="text-xs">
                                                {formatLocation(selectedItem.location_lost)}
                                            </p>
                                        </div>

                                    </div>
                                    <div>
                                        <div className="flex flex-col flex-1">
                                            <p className="text-xs text-[#6B5C42]">SPECIFIC LOCATION</p>
                                            <p className="text-xs">{selectedItem.specific_location || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>
                                {selectedItem.image_url &&
                                    (
                                        <div className="mb-5 w-full h-40 rounded-lg bg-[#F0EDE6] border border-[#DDD9CF] cursor-pointer relative"
                                            onClick={() => setSelectedImage(selectedItem?.image_url)}>
                                            <img src={selectedItem.image_url} alt={selectedItem.item_name}
                                                className="h-full w-full object-contain" />
                                            <div className="text-md rounded-full p-4 bg-black/70 absolute bottom-3 right-3">
                                                <i className="fa-solid fa-up-right-and-down-left-from-center text-white "></i>
                                            </div>
                                        </div>
                                    )
                                }

                                {selectedItem.status === 'resolved' && selectedItem.resolved_by_user_id &&
                                    (<>
                                        <hr className="border-(--color-tertiary) my-5 opacity-30" />
                                        <div className=" flex  w-full gap-2 rounded-lg bg-[#FFF9E0] border border-(--color-quaternary) p-3 xl:p-5 border-l-4">
                                            <div className="flex flex-col  text-[10px] xl:text-xs gap-1">
                                                <p className="text-[#6B5C42]">Resolved by <span className="font-semibold text-black">{selectedItem.resolved_by_admin_full_name}</span></p>
                                                <p className="text-[#6B5C42]">Resolved on <span>{formatDateTime(selectedItem.date_resolved)}</span><span></span></p>
                                            </div>

                                        </div>
                                    </>)
                                }

                                {selectedItem.status === 'cancelled' &&
                                    (<>
                                        <hr className="border-(--color-tertiary) my-5 opacity-30" />
                                        <div className=" flex  w-full gap-2 rounded-lg bg-[#F5F5F5] border border-[#DDD9CF] p-3 xl:p-5">
                                            <div className="flex flex-col  text-[10px] xl:text-xs gap-1">
                                                <p className="text-[#6B5C42] font-semibold">Report Cancelled</p>
                                                <p className="text-[#6B5C42]">Cancelled on <span>{formatDateTime(selectedItem.date_cancelled)}</span><span></span></p>
                                                <p className="text-black ">{selectedItem.cancel_reason}</p>
                                            </div>

                                        </div>
                                    </>)
                                }
                            </div>
                        </div>
                        <div>
                            <div>
                            </div>
                            <hr className="border-(--color-tertiary) my-5 opacity-30" />
                            {selectedItem.status !== 'archived' && selectedItem.status !== 'resolved' &&
                                <div className="relative flex w-full h-10 my-5 gap-2 text-[10px] xl:text-xs">
                                    {openUpdateStatus && (
                                        <div className="absolute bottom-11 right-5  h-fit w-45 bg-white border translate-x-14 xl:translate-x-5 border-[#DDD9CF] rounded-md">
                                            <button
                                                className="text-xs p-2 border-b border-[#DDD9CF] w-full"
                                                onClick={() => setResolved(true)}
                                            >
                                                <p className="ml-2">Mark as Resolved</p>
                                            </button>
                                            {selectedItem.status === "to_be_disposed" && (
                                                <button
                                                    className="text-xs p-2 border-b border-[#DDD9CF] w-full"
                                                    onClick={() => {
                                                        startDisposing();
                                                        setOpenUpdateStatus(false);
                                                    }}
                                                >
                                                    <p className="ml-2">Mark as Disposed</p>
                                                </button>
                                            )}
                                            <button
                                                className="text-xs p-2 border-b border-[#DDD9CF] w-full text-primary"
                                                onClick={() => setOpenArchiveDialog(true)}
                                            >
                                                <p className="ml-2">Archive</p>
                                            </button>
                                        </div>
                                    )}
                                    {selectedItem.status !== 'archived' && userId === String(selectedItem.user_id) &&
                                        <button
                                            type="button"
                                            className="h-full border-primary border rounded-md text-primary flex-1 disabled:opacity-40 cursor-pointer transition-transform duration-100
                                        enabled:active:scale-95 disabled:cursor-not-allowed "
                                        onClick={()=>setEditTab(true)}
                                        >
                                            Edit Report Details
                                        </button>
                                    }
                                    <button
                                        className="h-full border-primary border rounded-md flex-1 bg-primary text-white  disabled:opacity-40
                              cursor-pointer transition-transform duration-100 enabled:active:scale-95 disabled:cursor-not-allowed"
                                        onClick={() => {
                                            setOpenUpdateStatus(!openUpdateStatus);
                                        }}
                                        disabled={
                                            isArchiving
                                        }
                                    >
                                        Update Status{" "}
                                        <i
                                            className={`fa-solid fa-angle-${openUpdateStatus ? "up" : "down"} text-white`}
                                        ></i>
                                    </button>

                                </div>
                            }
                            {selectedItem.status === 'archived' && selectedItem.archived_by_user_id &&
                                (<>
                                    <div className=" flex  w-full gap-2 rounded-lg bg-[#EDE9FE] border border-[#7008E7] p-3 xl:p-5 border-l-4">
                                        <div className="flex flex-col  text-[10px] xl:text-xs gap-1">
                                            <p className="text-[#6B5C42]">Archived by <span className="font-semibold text-black">{selectedItem.archived_by_admin_full_name}</span></p>
                                            <p className="text-[#6B5C42]">Archived on <span>{formatDateTime(selectedItem.archived_date)}</span><span></span></p>
                                        </div>

                                    </div>
                                    <hr className="border-(--color-tertiary) my-5 opacity-30" />
                                </>)

                            }
                            {
                                selectedItem.status === 'archived' &&
                                (
                                    <>
                                        <button
                                            className="w-full h-10 disabled:opacity-40 border bg-primary rounded-lg text-white mb-2 text-sm font-medium transition-transform duration-100 active:enabled:scale-95"
                                            disabled={isRestoring}
                                            onClick={() => setOpenRestoreDialog(true)}
                                        >
                                            {isRestoring ? (
                                                "Restoring..."
                                            ) : (
                                                <>
                                                    <i className="fa-solid fa-arrow-rotate-left mr-2"></i>
                                                    Restore Listing
                                                </>
                                            )}
                                        </button>
                                    </>
                                )
                            }
                            <div className=" text-[10px] xl:text-xs gap-1">
                                {selectedItem.status === 'resolved' &&
                                    <p className="text-[#6B5C42]">This report has been resolved and no further action needed</p>
                                }
                                {selectedItem.status === 'cancelled' &&
                                    <p className="text-[#6B5C42]">This report has been cancelled and no further action needed</p>
                                }
                                {selectedItem.status === 'archived' &&
                                    <p className="text-[#6B5C42]">This item has been marked as archived and is hidden from active reports queue</p>
                                }
                            </div>
                        </div>
                    </div>
                            </>
                        )

                    }
                </div>
            </div>
            {resolved &&
                (
                    <>
                        <AdminConfirmDialog
                            title="Confirm Resolve"
                            description={`Are you sure you want to mark report ${formatReportId(selectedItem.lost_report_id)} as resolved?`}
                            cancelText="Cancel"
                            confirmText="Confirm Resolve"
                            onClose={() => setResolved(false)}
                            disabled={selectedItem.status === 'resolved' || selectedItem.status === 'cancelled' || isLoading || isArchiving}
                            onConfirm={()=>handleResolvedReport(lostReportId)}
                        />
                    </>
                )
            }
            {openArchiveDialog &&
                (
                    <ArchiveDialog
                    open={openArchiveDialog}
                    onClose={() => setOpenArchiveDialog(false)}
                    onConfirm={handleArchiveReport}
                    isArchiving={isArchiving}
                    isLoading={isLoading}
                    />
                )

            }
            {openRestoreDialog &&
                (
                    <RestoreDialog
                        open={openRestoreDialog}
                        onClose={() => setOpenRestoreDialog(false)}
                        onConfirm={handleRestoreReport}
                        isRestoring={isRestoring}
                    />
                )

            }
            {selectedImage && (
                <ScaleImage 
                    selectedImage={selectedImage} 
                    setSelectedImage={setSelectedImage}
                />
            )}
        </>
    )
}