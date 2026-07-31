import { useState } from "react";
import formatDate from "../utils/formatDate";
import formatTime from "../utils/formatTime";
import formatDateTime from "../utils/formatDataTimeNew";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { Link2, TriangleAlert, X } from "lucide-react"
import { toast } from "react-toastify";

export default function TransactionManagementModal(
    { selectedRecord = [],
        setSelectedRecord,
        itemInfo,
        setItemInfo,
        categories = [],
        locations = [],
        onUpdated,
        allLocations = [], }

) {
    const API_URL = import.meta.env.VITE_API_URL;
    const [isReverting, setIsReverting] = useState(false);

    const [selectedImage, setSelectedImage] = useState(null);

    const adminFullName = localStorage.getItem("first_name") + " " + localStorage.getItem("last_name");
    const officeIdNotification = localStorage.getItem("office_location");


    //Close and reset Modal
    const handleCloseModal = () => {
        setSelectedRecord(null);
    }
    //format txn  id
    const formatTXNId = (id) => {
        return `TXN-${String(id).padStart(5, "0")}`;
    };
    //format item  id
    const formatItemId = (id) => {
        return `SI-${String(id).padStart(5, "0")}`;
    };

    //format item  id
    const formatReportId = (id) => {
        return `RPT-${String(id).padStart(5, "0")}`;
    };

    const [openRevertDialog, setOpenRevertDialog] = useState(false);

    const handleRevertTransaction = async () => {
        setIsReverting(true);
        const officeId =
        officeIdNotification &&
        officeIdNotification !== "undefined"
            ? officeIdNotification
            : null;


        try {
            const response = await fetchWithAuth(
                `${API_URL}/api/claim-records/${selectedRecord.claim_id}/status`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        claimant_status: false,
                        office_id: officeId,
                        admin_full_name: adminFullName,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to revert transaction");

            }

            // Refresh table
            const recordsResponse = await fetchWithAuth(
                `${API_URL}/api/claim-records`
            );

            const recordsData = await recordsResponse.json();
            if (Array.isArray(recordsData)) {
                onUpdated?.(recordsData);
            }
            const updatedRecord = recordsData.find(
                record => record.claim_id === selectedRecord.claim_id
            );

            setIsReverting(false);
            setSelectedRecord(updatedRecord);
            setOpenRevertDialog(false);
            toast.success(`Successfully marked ${formatTXNId(selectedRecord.claim_id)} as Reverted. `)


        } catch (err) {
            console.error(err);
        }
    };



    return (
        <>
            <div className="fixed  inset-0 z-100 w-screen h-screen bg-black/20 flex items-center justify-center">
                <div className="absolute top-0 right-0 h-full w-3/10 bg-white flex flex-col">
                    <div className="w-full h-15 bg-primary items-center flex pl-2 gap-4 shrink-0 sticky top-0 z-50">
                        <p className="text-white font-semibold text-md xl:text-lg pl-2">Transacntion Details</p>
                        <div className="ml-auto pr-6">
                            <button onClick={handleCloseModal}><i className="fa-solid fa-x text-xs xl:text-sm text-white"></i></button>
                        </div>
                    </div>
                    <div className="h-full w-full p-5 flex-1 overflow-y-auto">
                        <div className="flex flex-col w-full h-fit gap-2">
                            <div className="flex justify-between">
                                <p className="text-black font-bold ">{formatTXNId(selectedRecord.claim_id)}</p>
                                <div className={`px-3 py-1 rounded-full text-xs font-medium 
                                        ${selectedRecord.claimant_status === true && "bg-green-100 text-green-700"}
                                        ${selectedRecord.claimant_status == false && "bg-gray-200 text-gray-700"}
                                               `}
                                >
                                    <p>   {selectedRecord.claimant_status === true && "Completed"}
                                        {selectedRecord.claimant_status === false && "Reverted"}
                                    </p>
                                </div>
                            </div>
                            <div className="text-[#6B5C42] text-xs flex items-center gap-1">
                                <p>{formatDateTime(selectedRecord.claim_date)}</p>
                            </div>
                            <div className="text-[#6B5C42] text-xs flex items-center">
                                <p>Processed by {selectedRecord.processed_by}</p>
                            </div>
                        </div>
                        <hr className="border-(--color-tertiary) my-5 opacity-30" />
                        <div className=" flex flex-col gap-2">
                            <p className="text-black font-semibold text-sm">CLAIMED ITEM</p>
                            {selectedRecord.image_url &&
                                (
                                    <div className=" relative w-full h-40 rounded-lg bg-[#F0EDE6] border border-[#DDD9CF] cursor-pointer"
                                        onClick={() => setSelectedImage(selectedRecord?.image_url)}>
                                        <img src={selectedRecord.image_url} alt={selectedRecord.item_name}
                                            className="h-full w-full object-contain" />
                                        <div className="text-md rounded-full p-4 bg-black/70 absolute bottom-3 right-3">
                                            <i className="fa-solid fa-up-right-and-down-left-from-center text-white "></i>
                                        </div>
                                    </div>
                                )
                            }
                            <p className="text-black font-semibold text-sm">{selectedRecord.item_name}</p>
                            <div className="flex">
                                <div className="flex flex-col flex-1">
                                    <p className="text-xs text-[#6B5C42]">ITEM ID</p>
                                    <p className="text-xs">{formatItemId(selectedRecord.item_id)}</p>
                                </div>
                                <div className="flex flex-col flex-1">
                                    <p className="text-xs text-[#6B5C42]">CATEGORY</p>
                                    <p className="text-xs">{selectedRecord.category_name}</p>
                                </div>

                            </div>
                            <div className="flex">
                                <div className="flex flex-col flex-1">
                                    <p className="text-xs text-[#6B5C42]">LOCATION FOUND</p>
                                    <p className="text-xs">{selectedRecord.location_found}</p>
                                </div>
                                <div className="flex flex-col flex-1">
                                    <p className="text-xs text-[#6B5C42]">DATE & TIME FOUND</p>
                                    <p className="text-xs">{formatDateTime(selectedRecord.found_date)}</p>
                                </div>

                            </div>
                            <div className="flex">
                                <div className="flex flex-col flex-1">
                                    <p className="text-xs text-[#6B5C42]">SPECIFIC LOCATION</p>
                                    <p className="text-xs">{selectedRecord.specific_location}</p>
                                </div>
                            </div>
                            <div className="flex">
                                <div className="flex flex-col flex-1">
                                    <p className="text-xs text-[#6B5C42]">DESCRIPTION</p>
                                    <p className="text-xs">{selectedRecord.description}</p>
                                </div>
                            </div>
                            <div className="flex">
                                <div className="flex flex-col flex-1">
                                    <p className="text-xs text-[#6B5C42]">CONTENTS</p>
                                    <p className="text-xs">{selectedRecord.contents || "N/A"}</p>
                                </div>
                            </div>
                            <div className="flex">
                                <div className="flex flex-col flex-1">
                                    <p className="text-xs text-[#6B5C42]">REPORTED BY</p>
                                    <p className="text-xs">{selectedRecord.found_report_reported_by}</p>
                                </div>
                                <div className="flex flex-col flex-1">
                                    <p className="text-xs text-[#6B5C42]">DATE LOGGED</p>
                                    <p className="text-xs">{formatDate(selectedRecord.date_reported)}</p>
                                </div>

                            </div>
                            <div className="flex">
                                <div className="flex flex-col flex-1">
                                    <p className="text-xs text-[#6B5C42]">SURRENDERED BY</p>
                                    <p className="text-xs">{selectedRecord.reported_by}</p>
                                </div>
                            </div>

                            {selectedRecord.lost_report_id &&
                                (
                                    <>
                                        {selectedRecord.claimant_status === true &&

                                            (
                                                <>
                                                    <div className="flex items-center gap-2">
                                                        <Link2 size={15} />
                                                        <p className="text-black font-semibold text-sm">LINKED LOST REPORT</p>
                                                    </div>
                                                    <div className=" flex flex-col w-full gap-2 rounded-lg bg-[#FFF9E0] border border-(--color-quaternary) p-2 xl:p-4">
                                                        <div className="flex justify-between text-[10px] xl:text-xs">
                                                            <div className="text-black rounded-md flex items-center text-xs xl:text-sm">
                                                                <p className="font-semibold">{formatReportId(selectedRecord.lost_report_id)}</p>
                                                            </div>
                                                            <div className="bg-green-100 text-green-700 rounded-xl items-center p-1 px-2 font-semibold">
                                                                <p>Auto-Resolved</p>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs xl:text-sm font-semibold">{selectedRecord.lost_report_reported_by}</p>
                                                        <p className="text-[10px] xl:text-xs text-[#6B5C42]">{selectedRecord.lost_report_student_number || (selectedRecord.lost_report_email || selectedRecord.lost_report_contact_number)}</p>
                                                        <p className="text-[10px] xl:text-xs text-[#6B5C42]">Reported Lost: {selectedRecord.item_name}</p>
                                                        <p className="text-[10px] xl:text-xs text-[#6B5C42] italic opacity-40">Auto-resolved when item was claimed.</p>
                                                    </div>
                                                </>
                                            )

                                        }
                                        <hr className="border-(--color-tertiary) my-5 opacity-30" />
                                        <p className="text-black font-semibold text-sm">CLAIMANT DETAILS</p>
                                        <div className="flex flex-col gap-2">
                                            <p className="text-black font-semibold text-sm">{selectedRecord.claimant_full_name}</p>
                                            <div className="flex">
                                                <div className="flex flex-col flex-1">
                                                    {selectedRecord.claimant_email && (<p className="text-xs text-[#6B5C42]">EMAIL</p>)}
                                                    {selectedRecord.claimant_contact_number && (<p className="text-xs text-[#6B5C42]">CONTACT NUMBER</p>)}
                                                    <p className="text-xs text-[#5B5BD5]">{selectedRecord.claimant_email || selectedRecord.claimant_contact_number}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <hr className="border-(--color-tertiary) my-5 opacity-30" />


                                    </>
                                )

                            }
                            {selectedRecord.claimant_photo_url &&
                                (
                                    <>

                                        <p className="text-black font-semibold text-sm">PROOF OF CLAIM PHOTO</p>
                                        <p className="text-[#6B5C42]  text-xs">Photo of claimant with item, captured at time of release.</p>

                                        <div className=" relative w-full h-40 rounded-lg bg-[#F0EDE6] border border-[#DDD9CF] cursor-pointer"
                                            onClick={() => setSelectedImage(selectedRecord?.claimant_photo_url)}>
                                            <img src={selectedRecord.claimant_photo_url} alt={selectedRecord.claimant_full_name}
                                                className="h-full w-full object-contain" />

                                            <div className="text-md rounded-full p-4 bg-black/70 absolute bottom-3 right-3">
                                                <i className="fa-solid fa-up-right-and-down-left-from-center text-white "></i>
                                            </div>
                                        </div>
                                    </>
                                )
                            }
                            {selectedRecord.claimant_status === false &&

                                (
                                    <>
                                        <hr className="border-(--color-tertiary) my-5 opacity-30" />
                                        <div className=" flex  w-full gap-2 rounded-lg bg-[#FCEBEB] border border-[#F0B8B8] p-3 xl:p-5 ">
                                            <div className="flex flex-col  text-[10px] xl:text-xs gap-1">
                                                <p className="text-xs xl:text-sm font-semibold text-[#C0392B]">Transaction Reverted</p>
                                                <p className="text-[#6B5C42]">Resolved on <span>{formatDateTime(selectedRecord.date_reverted)}</span><span></span></p>
                                                <p className="text-[#6B5C42]">Reverted by {selectedRecord.reverted_by_full_name}</p>
                                            </div>

                                        </div>
                                    </>
                                )

                            }
                            {selectedRecord.claimant_status === true &&
                                <div>
                                    <hr className="border-(--color-tertiary) my-5 opacity-30" />
                                    <button className="w-full h-10 bg-primary rounded-lg text-white mb-2 text-sm font-medium transition-transform duration-100 active:enabled:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                                        onClick={() => setOpenRevertDialog(true)}
                                        disabled={isReverting || selectedRecord.claimant_status === false}
                                    >{isReverting ? "Reverting..." : "Revert Transaction"}</button>
                                </div>
                            }
                            {selectedRecord.claimant_status === false &&
                                <div className=" text-[10px] xl:text-xs gap-1">


                                    <hr className="border-(--color-tertiary) my-5 opacity-30" />
                                    <p className="text-[#6B5C42]">This transaction has been reverted and no further action available</p>

                                </div>
                            }
                        </div>
                    </div>
                </div>




            </div>

            {openRevertDialog &&
                (
                    <>
                        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-1020">

                            <div className="relative bg-white  rounded-lg w-100 h-fit flex flex-col">
                                <div className="w-full h-10 rounded-t-lg bg-primary text-white flex items-center justify-between px-5">
                                    <p className="font-semibold">Revert Transaction</p>
                                    <button onClick={() => setOpenRevertDialog(false)}><i className="fa-solid fa-x text-xs xl:text-sm text-white"></i></button>

                                </div>
                                <div className="flex flex-col flex-1 p-3 gap-2">
                                    <div className="w-full flex justify-center items-center">
                                        <TriangleAlert size={40} className="text-(--color-quaternary)" />
                                    </div>
                                    <div className="w-full bg-[#F9ECEC] rounded-lg flex flex-col gap-2 p-4">
                                        <p className="text-[#6B5C42] font-bold text-sm  ">{formatTXNId(selectedRecord.claim_id)}</p>
                                        <div className="text-xs  gap-2 flex flex-col">
                                            <p>Item: {selectedRecord.item_name} <span>({formatItemId(selectedRecord.item_id)})</span></p>
                                            <p>Claimant:  {selectedRecord.claimant_full_name}</p>
                                            <p className="text-[#6B5C42] ">Date Claimed:  {formatDateTime(selectedRecord.claim_date)}</p>
                                        </div>


                                    </div>
                                    <div className="text-xs text-justify">
                                        <p>Reverting this transaction will return the item to <span className="font-semibold">Unclaimed</span> status. A permanent log of this record will be retained in the Transactions tab for auditing.<span className="font-semibold"> This action cannot be undone</span>.</p>
                                    </div>
                                    <div className="w-full h-full flex items-center text-xs flex-1 text-[#6B5C42] italic">
                                        <p>This revert will be permanently logged under your account.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            className="w-full h-10 flex-1 bg-white  rounded-lg text-primary border border-primary text-sm font-medium transition-transform duration-100 active:scale-95"
                                            onClick={() => setOpenRevertDialog(false)}
                                        >Cancel</button>
                                        <button
                                            className="w-full h-10 flex-1 disabled:opacity-40 bg-primary rounded-lg text-white text-sm font-medium transition-transform duration-100 active:scale-95 disabled:cursor-not-allowed"
                                            onClick={handleRevertTransaction}
                                            disabled={isReverting}
                                        >{isReverting ? "Reverting.." : "Confirm Revert"}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )

            }

            {/* Image Modal */}
            {selectedImage && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-1000">
                    <div className="relative rounded-2xl h-125">
                        <button
                            className="absolute -top-10 -right-10 btn btn-sm btn-circle text-white "
                            onClick={() => setSelectedImage(null)}
                        >
                            <X size={16} />
                        </button>
                        <img
                            src={selectedImage}
                            alt="Preview"
                            className="h-full w-full  "
                        />
                    </div>
                </div>
            )}

        </>
    )
}