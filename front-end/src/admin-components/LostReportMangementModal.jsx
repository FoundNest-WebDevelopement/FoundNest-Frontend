import { useState } from "react";
import formatDate from "../utils/formatDate";
import formatTime from "../utils/formatTime";
import formatDateTime from "../utils/formatDataTimeNew";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { Link2 } from "lucide-react"
import { useNavigate } from "react-router-dom";



export default function LostReportMangementModal(
    { selectedItem = [],
        setSelectedItem,
        itemInfo,
        setItemInfo,
        categories = [],
        locations = [],
        onUpdated,
        allLocations = [],
    }

) {
    console.log(selectedItem)
    const API_URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();

    //mark as resovle toggle variable
    const [resolved, setResolved] = useState(false)

    //Close and reset Modal
    const handleCloseModal = () => {
        setSelectedItem(null);
    }

    //format rpt  id
    const formatReportId = (id) => {
        return `RPT-${String(id).padStart(5, "0")}`;
    };

    //format item  id
    const formatItemId = (id) => {
        return `SI-${String(id).padStart(5, "0")}`;
    };

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

    const [isLoading, setIsLoading] = useState(false)
    const handleResolvedReport = async () => {
        setIsLoading(true);
        try {
            const response = await fetchWithAuth(
                `${API_URL}/api/lost-reports/${selectedItem.lost_report_id}/resolve`,
                {
                    method: "PATCH",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Failed to resolve report"
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
                report => report.lost_report_id === selectedItem.lost_report_id
            );

            alert("Report marked as resolved.");
            setSelectedItem(updatedReport);
            setResolved(false);
            setIsLoading(false)




        } catch (err) {
            console.error(err);
            alert(err.message);
            setIsLoading(false)
        }
    };
    return (
        <>
            <div className="fixed  inset-0 z-100 w-screen h-screen bg-black/20 flex items-center justify-center">
                <div className="absolute top-0 right-0 h-full w-3/10 bg-white flex flex-col">
                    <div className="w-full h-15 bg-primary items-center flex pl-2 gap-4 shrink-0 sticky top-0 z-50">
                        <p className="text-white font-semibold text-md xl:text-lg pl-2">Report Details</p>
                        <div className="ml-auto pr-6">
                            <button onClick={handleCloseModal}><i className="fa-solid fa-x text-xs xl:text-sm text-white"></i></button>
                        </div>
                    </div>
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
                                              <div className="text-[10px] xl:text-xs flex items-center font-medium underline mt-2 cursor-pointer"
                                                 onClick={() =>
                                                    navigate(
                                                        `/admin/item_management?itemId=${selectedItem.found_item_id}`
                                                    )
                                                }
                                                >
                                                  <p>View Found Item &nbsp; </p>
                                                     <i className="fa-solid fa-arrow-right"></i>
                                              </div>
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
                                               `}
                                >
                                    <p>   {selectedItem.status === 'resolved' && "Resolved"}
                                        {selectedItem.status === 'open' && "Open"}
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
                                        <p className="text-xs text-[#6B5C42]">EMAIL</p>
                                        <p className="text-xs">{selectedItem.user_email || selectedItem.email}</p>
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
                                        <div className="mb-5 w-full h-40 rounded-lg bg-[#F0EDE6] border border-[#DDD9CF]">
                                            <img src={selectedItem.image_url} alt={selectedItem.item_name}
                                                className="h-full w-full object-contain" />
                                        </div>
                                    )
                                }

                                 {selectedItem.status === 'resolved' && selectedItem.resolved_by_admin_id &&
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
                             <hr className="border-(--color-tertiary) my-5 opacity-30" />
                           
                                    <button
                                        className="w-full h-10 bg-primary rounded-lg text-white mb-2 text-sm font-medium transition-transform duration-100 active:enabled:scale-95 disabled:opacity-40 "
                                        disabled={selectedItem.status === 'resolved' || selectedItem.status === 'cancelled'}
                                        onClick={() => setResolved(true)}

                                    >
                                        Mark as Resolved
                                    </button>
                                    <div className=" text-[10px] xl:text-xs gap-1">
                                        {selectedItem.status === 'resolved'  &&
                                            <p className="text-[#6B5C42]">This report has been resolved and no further action needed</p>
                                        }
                                        {selectedItem.status === 'cancelled'  &&
                                            <p className="text-[#6B5C42]">This report has been cancelled and no further action needed</p>
                                        }
                                        
                                    </div>
                            

                           
                        </div>
                    </div>

                </div>

            </div>
            {resolved &&
                (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-1020">

                        <div className="relative bg-white  rounded-lg w-100 h-50 flex flex-col">
                            <div className="w-full h-10 rounded-t-lg bg-primary text-white flex items-center justify-between px-5">
                                <p className="font-semibold">Mark as Resolved</p>
                                <button onClick={() => setResolved(false)}><i className="fa-solid fa-x text-xs xl:text-sm text-white"></i></button>

                            </div>
                            <div className="flex flex-col flex-1 p-3">
                                <div className="w-full h-full flex items-center justify-center text-sm flex-1">
                                    <p>Are you sure to mark <span className="font-semibold">{formatReportId(selectedItem.lost_report_id)}</span>  {" "}as Resolved?</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        className="w-full h-8 flex-1 bg-white  rounded-lg text-black border  text-sm font-medium transition-transform duration-100 active:scale-95"
                                        onClick={() => setResolved(false)}
                                    >No</button>
                                    <button
                                        className="w-full h-8 flex-1 disabled:opacity-40 bg-primary rounded-lg text-white text-sm font-medium transition-transform duration-100 active:scale-95"
                                        onClick={handleResolvedReport}
                                        disabled={isLoading}
                                    >{isLoading ? "Resolving.." : "Yes"}</button>
                                </div>
                            </div>
                        </div>
                    </div>

                )

            }
        </>
    )
}