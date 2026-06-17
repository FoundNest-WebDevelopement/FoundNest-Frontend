import { useState } from "react";
import { Eye, X } from "lucide-react";
import TransactionManagementModal from "./TransactionManagementModal";

export default function TransactionTable(   {
         reports,
    categories = [],
    locations = [],
    onUpdated,
    allLocations = [],
    }
){
    //ADMIN CREDENTIALS
    const userId = localStorage.getItem("user_id");
    const adminId = localStorage.getItem("admin_id");

    //Set Record
    const [selectedRecord, setSelectedRecord] = useState(null);

    //TABLE CONST
    const [selectedImage, setSelectedImage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const safeReports = Array.isArray(reports) ? reports : [];
    const totalPages = Math.max(1, Math.ceil(safeReports.length / itemsPerPage));
    const activePage = Math.min(currentPage, totalPages);
    const startIndex = (activePage - 1) * itemsPerPage;
    const paginatedReports = safeReports.slice(
        startIndex,
        startIndex + itemsPerPage
    );

     //format txn  id
    const formatTXNId = (id) => {
        return `TXN-${String(id).padStart(5, "0")}`;
    };


    return(
        <>
            <div className="h-fit w-full max-w-full min-w-0 min-h-100 rounded-t-xl bg-white border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden">
                <div className="w-full min-w-0 overflow-x-auto overflow-y-hidden bg-white shadow-sm">

                    <table className="table table-zebra table-sm min-w-295 [&_th]:px-2 [&_td]:px-2 text-center">

                        <thead className="bg-primary text-white text-center">
                            <tr>
                                <th className="w-5"></th>
                                <th className="w-20">TXN ID</th>
                                <th className="w-48">ITEM NAME</th>
                                <th className="w-32">CLAIMANT NAME</th>
                                <th className="w-32">CONTACT</th>
                                <th className="w-32">DATE CLAIMED</th>
                                <th className="w-32">PROCESSED BY</th>
                                <th className="w-37">STATUS</th>
                                <th className="w-24">ACTIONS</th>
                            </tr>
                        </thead>

                        <tbody>
                            {paginatedReports?.map((rcd, index) => (
                                <tr
                                    key={rcd.claim_id}
                                    className={
                                        index % 2 === 0
                                            ? "bg-white"
                                            : "bg-[#F5F5F5]"
                                    }
                                >

                                    <td className="align-middle h-15">{startIndex + index + 1}</td>

                                    <td className="w-28 align-middle text-center">{formatTXNId(rcd.claim_id)}</td>

                    

                                    <td className="truncate max-w-48 align-middle text-center">{rcd.item_name}</td>

                                    <td className="truncate max-w-48 align-middle text-center">{rcd.claimant_full_name}</td>

                                    <td className="truncate max-w-48 align-middle text-center">{rcd.claimant_email || rcd.claimant_contact_number}</td>


                                    <td className="align-middle text-center bg-re"> {new Date(rcd.claim_date).toLocaleDateString()}</td>

                                    <td className="truncate max-w-48 align-middle text-center">{rcd.processed_by}</td>

                                    <td className="align-middle text-center">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium 
                                        ${rcd.claimant_status === true && "bg-green-100 text-green-700" }
                                        ${rcd.claimant_status == false && "bg-gray-200 text-gray-700"}
                                    
                
                                        `}
                                        >
                                        {rcd.claimant_status === true && "Completed"}
                                            {rcd.claimant_status === false && "Reverted"}
            
                                        </span>
                                    </td>

                                    <td className="align-middle text-center">
                                        <button className=" btn-sm btn-square  text-white border-none cursor-pointer transition-transform duration-100
                                     active:scale-95 disabled:opacity-20 "
                                            onClick={() => { setSelectedRecord(rcd)}}
                                        > 
                                            <Eye size={18} className="text-primary" />                       
                                        </button>
                                    </td>

                                </tr>
                            ))}
                            {paginatedReports.length === 0 && (
                                <tr>
                                    <td colSpan={11} className="text-center py-8 text-[#6B5C42]">
                                        No Records to display.
                                    </td>
                                </tr>
                            )}
                        </tbody>

                    </table>

                </div>
            </div>

            <div className="flex items-center justify-between bg-white border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] rounded-b-xl px-4 py-3 text-xs mt-1">
                <p className="text-[#6B5C42]">
                    Showing {safeReports.length === 0 ? 0 : startIndex + 1}
                    {" - "}
                    {Math.min(startIndex + itemsPerPage, safeReports.length)}
                    {" of "}
                    {safeReports.length}
                </p>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        disabled={activePage === 1}
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        className={`border border-primary rounded-md px-3 py-2 text-primary ${activePage === 1
                            ? "opacity-40 cursor-not-allowed"
                            : "cursor-pointer active:scale-95"
                            }`}
                    >
                        Previous
                    </button>

                    <p className="text-[#6B5C42]">
                        Page {activePage} of {totalPages}
                    </p>

                    <button
                        type="button"
                        disabled={activePage === totalPages}
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                        className={`border border-primary rounded-md px-3 py-2 text-primary ${activePage === totalPages
                            ? "opacity-40 cursor-not-allowed"
                            : "cursor-pointer active:scale-95"
                            }`}
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* Image Modal
            {selectedImage && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

                    <div className="relative bg-white p-3 rounded-2xl">

                        <button
                            className="absolute top-2 right-2 btn btn-sm btn-circle"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X size={16} />
                        </button>

                        <img
                            src={selectedImage}
                            alt="Preview"
                            className="max-w-125 max-h-125 rounded-xl"
                        />

                    </div>

                </div>
            )} */}

            

            {selectedRecord &&
                (
                    <TransactionManagementModal
                    selectedRecord={selectedRecord}
                    setSelectedRecord={setSelectedRecord}
                    categories={categories}
                    locations={locations}
                    allLocations={allLocations}
                    onUpdated={onUpdated}
                    userId={userId}
                    adminId={adminId} />
                )

            }
        </>
    )
}