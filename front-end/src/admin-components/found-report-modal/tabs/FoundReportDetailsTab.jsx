import { useState } from "react";
import { Link2, Handshake, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import QRCodeLib from "qrcode";

// Utility Imports (Adjust paths as needed)
import formatDateTime from "../../../utils/formatDateTime.js";
import formatDate from "../../../utils/formatDate.js";
import { formatActionType } from "../../../utils/formatActionType.js";
import foramtDateTimeNew from "../../../utils/formatDataTimeNew.js";

export default function FoundReportDetailsTab({
    selectedItem,
    claimRecord,
    isClaimRecordLoading,
    disposedDetails,
    setSelectedImage,
    
    // Action Callbacks passed from Parent
    onEdit,
    onClaim,
    onDispose,
    onArchive,
    onRestore
}) {
    const navigate = useNavigate();

    // Local UI States
    const [openUpdateStatus, setOpenUpdateStatus] = useState(false);
    const [openDisposedDetails, setOpenDisposedDetails] = useState(false);
    const [isPrintingQR, setIsPrintingQR] = useState(false);

    // Formatters
    const formatItemId = (id) => `SI-${String(id).padStart(5, "0")}`;
    const formatReportId = (id) => `RPT-${String(id).padStart(5, "0")}`;
    const formatTXNId = (id) => `TXN-${String(id).padStart(5, "0")}`;

    // QR Code Print Logic (Moved here to isolate it from the parent)
    const handlePrintQRCode = async () => {
        setIsPrintingQR(true);
        try {
            const qrData = formatItemId(selectedItem.item_id);
            const qrImageUrl = await QRCodeLib.toDataURL(qrData, {
                width: 300,
                margin: 2,
            });

            const printWindow = window.open("", "_blank");
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Print QR Code - ${selectedItem.item_name}</title>
                        <style>
                            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: Arial, sans-serif; }
                            .card { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px; border: 1px solid #DDD9CF; border-radius: 16px; }
                            .item-id { font-size: 13px; color: #6B5C42; }
                            .item-name { font-weight: bold; font-size: 18px; color: #4B2D23; }
                            .brand { font-weight: bold; font-size: 12px; color: #990000; margin-top: 8px; }
                            img { width: 220px; height: 220px; }
                        </style>
                    </head>
                    <body onload="window.print()">
                        <div class="card">
                            <p class="item-id">${qrData}</p>
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

    return (
        <div className="h-full w-full flex-1">
            {/* LINKED LOST REPORT (If Claimed & Linked) */}
            {selectedItem.linked_report && selectedItem.status === "claimed" && (
                <div className="flex flex-col gap-2 mb-4">
                    <div className="flex items-center gap-2">
                        <Link2 size={15} />
                        <p className="text-black font-semibold text-sm">LINKED LOST REPORT</p>
                    </div>
                    <div className="flex flex-col w-full gap-2 rounded-lg bg-[#FFF9E0] border border-(--color-quaternary) p-2 xl:p-4">
                        <div className="flex justify-between text-[10px] xl:text-xs">
                            <div className="text-black font-semibold rounded-md p-1 px-2">
                                <p className="font-bold">{formatReportId(selectedItem.linked_report)}</p>
                            </div>
                            <div className="bg-green-100 text-green-700 rounded-xl items-center p-1 px-2 font-semibold flex text-center">
                                <p>{selectedItem.lost_report_status}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {selectedItem.lost_item_image_url && (
                                <div className="w-12 h-10 rounded-lg bg-[#F0EDE6] border border-[#DDD9CF]">
                                    <img src={selectedItem.lost_item_image_url} alt={selectedItem.lost_item_name} className="w-full h-full object-contain" />
                                </div>
                            )}
                            <div className="flex flex-col text-[10px] xl:text-xs justify-center">
                                <p className="font-semibold">{selectedItem.lost_item_name}</p>
                                <p className="text-[#6B5C42]">{selectedItem.lost_item_category_name}</p>
                            </div>
                        </div>
                        <button
                            className="bg-green-700 text-white text-[10px] xl:text-xs flex items-center font-medium mt-2 cursor-pointer w-fit py-1 px-2 rounded-md transition hover:opacity-90"
                            onClick={() => navigate(`/admin/report_management?reportId=${selectedItem.linked_report}`)}
                        >
                            <p>View Lost Report &nbsp;</p>
                            <i className="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            )}

            {/* ITEM IMAGE */}
            <div 
                className="relative w-full h-50 bg-[#F5F5F5] border border-[#DDD9CF] rounded-lg overflow-hidden cursor-pointer" 
                onClick={() => setSelectedImage(selectedItem?.image_url)}
            >
                <img src={selectedItem.image_url} alt={selectedItem.item_name} className="w-full h-full object-contain" />
                <div className="text-lg rounded-full p-4 bg-black/70 absolute bottom-3 right-3 hover:scale-110 transition">
                    <i className="fa-solid fa-up-right-and-down-left-from-center text-white"></i>
                </div>
            </div>

            {/* ITEM DETAILS GRID */}
            <div className="flex">
                <div className="flex flex-col text-xs mt-5 flex-1">
                    <p className="text-[#6B5C42]">ITEM ID</p>
                    <p className="text-black font-medium">{formatItemId(selectedItem.item_id)}</p>
                </div>
                <div className="flex flex-col text-xs mt-5 flex-1">
                    <p className="text-[#6B5C42]">CATEGORY</p>
                    <p className="text-black">{selectedItem.category_name}</p>
                </div>
            </div>

            <div className="flex">
                <div className="flex flex-col text-xs mt-5 flex-1">
                    <p className="text-[#6B5C42]">ITEM NAME</p>
                    <p className="text-black">{selectedItem.item_name}</p>
                </div>
            </div>

            <div className="flex">
                <div className="flex flex-col text-xs mt-5 flex-1">
                    <p className="text-[#6B5C42]">LOCATION FOUND</p>
                    <p className="text-black">{selectedItem.location_found}</p>
                </div>
                <div className="flex flex-col text-xs mt-5 flex-1">
                    <p className="text-[#6B5C42]">DATE & TIME FOUND</p>
                    <p className="text-black">{foramtDateTimeNew(selectedItem.found_date)}</p>
                </div>
            </div>

            <div className="flex">
                <div className="flex flex-col text-xs mt-5 flex-1">
                    <p className="text-[#6B5C42]">SPECIFIC LOCATION</p>
                    <p className="text-black">{selectedItem.specific_location || "N/A"}</p>
                </div>
            </div>

            <div className="flex">
                <div className="flex flex-col text-xs mt-5 flex-1">
                    <p className="text-[#6B5C42]">DESCRIPTION</p>
                    <p className="text-black whitespace-pre-wrap">{selectedItem.description}</p>
                </div>
            </div>

            <div className="flex">
                <div className="flex flex-col text-xs mt-5 flex-1">
                    <p className="text-[#6B5C42]">CONTENTS</p>
                    <p className="text-black">{selectedItem.contents || "N/A"}</p>
                </div>
            </div>

            <div className="flex">
                <div className="flex flex-col text-xs mt-5 flex-1">
                    <p className="text-[#6B5C42]">REPORTED BY</p>
                    <p className="text-black">{selectedItem.reported_by_full_name}</p>
                </div>
                <div className="flex flex-col text-xs mt-5 flex-1">
                    <p className="text-[#6B5C42]">DATE LOGGED</p>
                    <p className="text-black">{formatDateTime(selectedItem.date_reported)}</p>
                </div>
            </div>

            <div className="flex">
                <div className="flex flex-col text-xs mt-5 flex-1">
                    <p className="text-[#6B5C42]">SURRENDERED BY</p>
                    <p className="text-black">{selectedItem.reported_by || "N/A"}</p>
                </div>
            </div>

            <div className="flex">
                <div className="flex flex-col text-xs mt-5 flex-1">
                    <p className="text-[#6B5C42]">ADDITIONAL NOTES</p>
                    <p className="text-black whitespace-pre-wrap">{selectedItem.additional_notes || "N/A"}</p>
                </div>
            </div>

            <div className="flex">
                <div className="flex flex-col text-xs mt-5 flex-1">
                    <p className="text-[#6B5C42]">CURRENT LOCATION</p>
                    <p className="text-black">{selectedItem.office_name || "N/A"}</p>
                </div>
            </div>

            {/* TRANSACTION SECTION (If Claimed) */}
            {selectedItem.status === "claimed" && !isClaimRecordLoading && claimRecord && (
                <div className="flex flex-col gap-2 mb-4 mt-8">
                    <div className="flex items-center gap-2">
                        <Handshake size={15} />
                        <p className="text-black font-semibold text-sm">TRANSACTION RECORD</p>
                    </div>
                    <div className="flex flex-col w-full gap-2 rounded-lg bg-gray-100 text-gray-700 border p-2 xl:p-4">
                        <div className="flex justify-between text-[10px] xl:text-xs">
                            <div className="text-black font-semibold rounded-md p-1 px-2">
                                <p className="font-bold">{formatTXNId(claimRecord?.claim_id)}</p>
                            </div>
                            <div className="bg-green-100 text-green-700 rounded-xl items-center p-1 px-2 font-semibold flex text-center">
                                <p>{claimRecord?.claimant_status && "Completed"}</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col text-[10px] xl:text-xs justify-center">
                            <p className="font-semibold">Proof of Claim</p>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            {claimRecord?.claimant_photo_url && (
                                <div className="relative w-full h-40 rounded-lg bg-[#F0EDE6] border border-[#DDD9CF] cursor-pointer" onClick={() => setSelectedImage(claimRecord?.claimant_photo_url)}>
                                    <img src={claimRecord.claimant_photo_url} alt="Proof" className="h-full w-full object-contain" />
                                    <div className="text-md rounded-full p-4 bg-black/70 absolute bottom-3 right-3 hover:scale-110">
                                        <i className="fa-solid fa-up-right-and-down-left-from-center text-white"></i>
                                    </div>
                                </div>
                            )}
                            <div className="text-xs flex flex-col mt-2">
                                <p className="text-[#6B5C42]">CLAIMANT NAME</p>
                                <p className="text-black font-medium">{claimRecord?.claimant_full_name || "N/A"}</p>
                            </div>
                            <div className="text-[10px] xl:text-xs flex flex-col gap-1 mt-2">
                                <p className="text-[#6B5C42]">Processed by: <span className="text-black font-medium">{claimRecord?.processed_by}</span></p>
                                <p className="text-[#6B5C42]">Processed on {formatDateTime(claimRecord?.claim_date)}</p>
                            </div>
                        </div>
                        
                        <button
                            className="bg-green-700 text-white text-[10px] xl:text-xs flex items-center font-medium border mt-2 cursor-pointer w-fit py-1 px-2 rounded-md hover:opacity-90 transition"
                            onClick={() => navigate(`/admin/transactions?claimId=${claimRecord?.claim_id}`)}
                        >
                            <p>View Full Transaction &nbsp;</p>
                            <i className="fa-solid fa-arrow-right"></i>
                        </button>
                    </div>
                </div>
            )}

            {/* DISPOSAL SECTION (If Disposed) */}
            {disposedDetails && (
                <div className={`w-full gap-3 flex rounded-lg mt-8 border-l-4 text-xs p-4 flex-col ${
                    disposedDetails?.disposal_method === "DONATED" 
                        ? "bg-green-50 border-l-green-700 text-green-700" 
                        : "bg-gray-100 border-l-gray-700 text-gray-700"
                }`}>
                    <div className="flex items-center gap-1">
                        {disposedDetails?.disposal_method === "DONATED" ? (
                            <i className="fa-regular fa-heart text-sm"></i>
                        ) : (
                            <i className="fa-regular fa-trash-can text-sm"></i>
                        )}
                        <p className="font-semibold text-sm">
                            {disposedDetails?.disposal_method === "DONATED" ? "Donated" : "Disposed as waste"}
                        </p>
                    </div>
                    
                    <div className="text-[10px] xl:text-xs flex flex-col gap-1">
                        <p className="text-gray-600">Disposed by: <span className="font-medium text-black">{disposedDetails.disposed_by_admin_name}</span></p>
                        <p className="text-gray-600">Disposed on: {formatDateTime(disposedDetails.created_at)}</p>
                    </div>
                    
                    <hr className="border-gray-300 my-1" />
                    
                    <button 
                        className="text-left font-semibold text-[10px] xl:text-xs cursor-pointer hover:underline flex justify-between items-center"
                        onClick={() => setOpenDisposedDetails(!openDisposedDetails)}
                    >
                        View Disposal Details <i className={`fa-solid fa-angle-${openDisposedDetails ? "up" : "down"}`}></i>
                    </button>

                    {openDisposedDetails && (
                        <div className="flex flex-col gap-3 mt-2 animate-in slide-in-from-top-2">
                            <p className="text-gray-600 font-semibold">PROOF OF DISPOSAL</p>
                            <div className="relative w-full h-40 rounded-lg bg-white border border-gray-300 cursor-pointer" onClick={() => setSelectedImage(disposedDetails?.proof_img)}>
                                <img src={disposedDetails.proof_img} alt="Proof" className="h-full w-full object-contain" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-black text-[10px] xl:text-xs mt-2">
                                <div className="flex flex-col">
                                    <p className="text-gray-500 font-medium">DISPOSAL METHOD</p>
                                    <p>{disposedDetails?.disposal_method === "DONATED" ? "For Donation" : "Disposed as waste"}</p>
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-gray-500 font-medium">DATE OF DISPOSAL</p>
                                    <p>{formatDate(disposedDetails.disposal_date)}</p>
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-gray-500 font-medium">
                                        {disposedDetails?.disposal_method === "DONATED" ? "BENEFICIARY/LOCATION" : "REASON"}
                                    </p>
                                    <p>{disposedDetails?.disposal_method === "DONATED" ? disposedDetails.disposal_whereabouts : formatActionType(disposedDetails.discard_reason)}</p>
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-gray-500 font-medium">ADDITIONAL NOTES</p>
                                    <p>{disposedDetails.additional_notes || "N/A"}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ARCHIVE NOTIFICATION (If Archived) */}
            {selectedItem.status === 'archived' && (
                <>
                    <hr className="border-(--color-tertiary) my-5 opacity-30" />
                    <div className="flex w-full gap-2 rounded-lg bg-[#EDE9FE] border border-[#7008E7] p-3 xl:p-5 border-l-4">
                        <div className="flex flex-col text-[10px] xl:text-xs gap-1">
                            <p className="text-[#6B5C42]">Archived by <span className="font-semibold text-black">{selectedItem.archived_by_admin_full_name}</span></p>
                            <p className="text-[#6B5C42]">Archived on {formatDateTime(selectedItem.date_archived)}</p>
                        </div>
                    </div>
                    
                    <button
                        type="button"
                        className="flex gap-3 mt-4 p-3 rounded-md items-center cursor-pointer transition-transform duration-100 enabled:active:scale-95 bg-primary text-white w-full justify-center"
                        onClick={onRestore}
                    >
                        <i className="fa-solid fa-arrow-rotate-left"></i> Restore Listing
                    </button>
                    <p className="text-[#6B5C42] text-[10px] xl:text-xs mt-2 text-center">
                        This item has been marked as archived and is hidden from the public feed.
                    </p>
                </>
            )}

            {/* ACTION BUTTONS (Edit, Update Status Dropdown) */}
            {selectedItem.status !== 'archived' && (
                <>
                    <hr className="border-(--color-tertiary) my-5 opacity-30" />
                    <div className="h-fit text-[9px] xl:text-xs font-medium flex gap-2 xl:gap-3 mt-2 relative">
                        <button
                            type="button"
                            className="h-full border-primary border px-5 py-3 rounded-md text-primary flex-1 disabled:opacity-40 cursor-pointer transition-transform enabled:active:scale-95 disabled:cursor-not-allowed"
                            onClick={onEdit}
                            disabled={selectedItem.status === "claimed" || selectedItem.status === "disposed"}
                        >
                            Edit Item Details
                        </button>
                        
                        <div className="relative">
                            {/* The Dropdown Menu */}
                            {openUpdateStatus && (
                                <div className="absolute bottom-12 right-0 h-fit w-45 bg-white border border-[#DDD9CF] shadow-lg rounded-md z-50 animate-in fade-in slide-in-from-bottom-2">
                                    <button
                                        className="text-xs p-3 border-b border-[#DDD9CF] w-full text-left hover:bg-gray-50 transition"
                                        onClick={() => { onClaim(); setOpenUpdateStatus(false); }}
                                    >
                                        Mark as Claimed
                                    </button>
                                    
                                    {selectedItem.status === "to_be_disposed" && (
                                        <button
                                            className="text-xs p-3 border-b border-[#DDD9CF] w-full text-left hover:bg-gray-50 transition"
                                            onClick={() => { onDispose(); setOpenUpdateStatus(false); }}
                                        >
                                            Mark as Disposed
                                        </button>
                                    )}
                                    
                                    <button
                                        className="text-xs p-3 w-full text-left text-red-600 hover:bg-red-50 transition rounded-b-md"
                                        onClick={() => { onArchive(); setOpenUpdateStatus(false); }}
                                    >
                                        Archive Item
                                    </button>
                                </div>
                            )}
                            
                            <button
                                className="h-full border-primary py-3 border px-5 rounded-md bg-primary text-white xl:px-7 disabled:opacity-40 cursor-pointer transition-transform enabled:active:scale-95 disabled:cursor-not-allowed flex items-center gap-2"
                                onClick={() => setOpenUpdateStatus(!openUpdateStatus)}
                                disabled={selectedItem.status === "claimed" || selectedItem.status === "disposed"}
                            >
                                Update Status 
                                <i className={`fa-solid fa-angle-${openUpdateStatus ? "up" : "down"} text-white transition-transform`}></i>
                            </button>
                        </div>
                    </div>
                    
                    {/* QR Code Print Button */}
                    <div className="mt-3 w-full flex flex-col gap-1 text-[9px] xl:text-xs">
                        <button
                            type="button"
                            onClick={handlePrintQRCode}
                            disabled={selectedItem.status === "claimed" || selectedItem.status === "disposed" || isPrintingQR}
                            className="flex gap-3 p-3 rounded-md items-center cursor-pointer transition-transform active:scale-95 border border-primary text-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <QrCode size="20" />
                            <p>{isPrintingQR ? "Preparing..." : "Print QR Code"}</p>
                        </button>
                        {!selectedItem.qr_code_id && (
                            <p className="text-[#6B5C42] text-[10px] text-center mt-1">
                                This item was not pre-registered with a QR code by its owner.
                            </p>
                        )}
                    </div>
                </>
            )}
            
            {/* Bottom Padding */}
            <div className="h-5"></div>
        </div>
    );
}