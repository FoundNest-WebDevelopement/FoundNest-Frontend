import { useEffect, useRef, useState } from "react"
import { Pencil, X, QrCode, Info } from "lucide-react"
import foramtDateTimeNew from "../utils/formatDataTimeNew.js"
import formatNotificationDate from "../utils/fotmatNotifications.js";
import AdminTextField from "./AdminTextField.jsx";
import FoundReportItemManagementModal from "./FoundReportemManagementModal.jsx";



export default function ItemManagementTable({
    reports,
    categories = [],
    locations = [],
    onUpdated,
    allLocations = [],
    selectedItem,
    setSelectedItem,

}) {
    console.log(reports[0])
    const API_URL = import.meta.env.VITE_API_URL;

    const userId = localStorage.getItem("user_id");
    const adminId = localStorage.getItem("admin_id");


    const [selectedImage, setSelectedImage] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [tableHeight, setTableHeight] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState();
    const safeReports = Array.isArray(reports) ? reports : [];
    const totalPages = Math.max(1, Math.ceil(safeReports.length / itemsPerPage));
    const activePage = Math.min(currentPage, totalPages);
    const startIndex = (activePage - 1) * itemsPerPage;
    const paginatedReports = safeReports.slice(
        startIndex,
        startIndex + itemsPerPage
    );


    const [itemInfo, setItemInfo] = useState(true);


    //format item  id
    const formatItemId = (id) => {
        return `SI-${String(id).padStart(5, "0")}`;
    };

    useEffect(() => {
    const updateTableSize = () => {
        const height = window.innerHeight;

        if (height > 732) {
            setTableHeight("min-h-155");
            setItemsPerPage(9);
        } else {
            setTableHeight("min-h-106");
            setItemsPerPage(6);
        }
    };

    updateTableSize();

    window.addEventListener("resize", updateTableSize);

    return () => {
        window.removeEventListener("resize", updateTableSize);
    };
}, []);




    return (
        <>
            <div className={`h-fit w-full max-w-full min-w-0 ${tableHeight} rounded-t-xl bg-white border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden`}>
                <div className="w-full min-w-0 overflow-x-auto overflow-y-hidden bg-white shadow-sm">

                    <table className="table table-zebra table-sm min-w-295 [&_th]:px-2 [&_td]:px-2 text-center">

                        <thead className="bg-primary text-white text-center">
                            <tr>
                                <th className="w-5"></th>
                                <th className="w-20">ITEM ID</th>
                                <th className="w-24">PHOTO</th>
                                <th className="w-48">ITEM NAME</th>
                                <th className="w-32">CATEGORY</th>
                                <th className="w-40">LOCATION</th>
                                <th className="w-32">DATE FOUND</th>
                                <th className="w-37">STATUS</th>
                                <th className="w-40">LINKED REPORT</th>
                                <th className="w-40">REPORTED BY</th>
                                <th className="w-24">ACTIONS</th>
                            </tr>
                        </thead>

                        <tbody>
                            {paginatedReports?.map((item, index) => (
                                <tr
                                    key={item.found_report_id}
                                    className={
                                        index % 2 === 0
                                            ? "bg-white"
                                            : "bg-[#F5F5F5]"
                                    }
                                >

                                    <td className="align-middle">{startIndex + index + 1}</td>

                                    <td className="w-28 align-middle text-center">{formatItemId(item.item_id)}</td>

                                    <td className="align-middle text-center">
                                        <img
                                            src={item.image_url}
                                            alt={item.image_url}
                                            className="w-12 h-12 object-cover rounded-lg cursor-pointer hover:scale-105 transition"
                                            onClick={() => setSelectedImage(item.image_url)}
                                        />
                                    </td>

                                    <td className="truncate max-w-48 align-middle text-center">{item.item_name}</td>

                                    <td className="align-middle text-center">{item.category_name}</td>

                                    <td className="align-middle text-center">{item.office_name}</td>

                                    <td className="align-middle text-center bg-re"> {new Date(item.found_date).toLocaleDateString()}</td>

                                    <td className="align-middle text-center">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium 
                                        ${item.status === "claimed" && "bg-green-100 text-green-700"}
                                        ${item.status == "unclaimed" && "bg-gray-200 text-gray-700"}
                                        ${item.status === 'to_be_disposed' && "text-[#FFA500] border-[#DDD9CF] bg-[#FFA500]/20"} 
                                        ${item.status === 'disposed' && "bg-[#DDD1C5] text-[#553D25]"}
                                        ${item.status === 'archived' && "bg-violet-100 text-violet-700"}
                                        `}
                                        >
                                            {item.status === 'claimed' && "Claimed"}
                                            {item.status === 'unclaimed' && "Unclaimed"}
                                            {item.status === 'to_be_disposed' && "For Disposal"}
                                            {item.status === 'disposed' && "Disposed"}
                                            {item.status === 'archived' && "Archived"}
                                        </span>
                                    </td>

                                    <td className="align-middle text-center font-medium">{item.linked_report ? <span>RPT-00{item.linked_report}</span> : ""}</td>

                                    <td className="align-middle text-center ">{item.admin_full_name}</td>

                                    <td className="align-middle text-center">
                                        <button className=" btn-sm btn-square  text-white border-none cursor-pointer transition-transform duration-100
                                     active:scale-95 disabled:opacity-20 "
                                            onClick={() => { setSelectedItem(item) }}
                                        >
                                            {(
                                                item.status === "unclaimed" ||
                                                item.status === "to_be_disposed" ||
                                                item.status === "archived"
                                            ) && (
                                                    <Pencil size={18} className="text-primary" />
                                                )}
                                            {(
                                                item.status === "claimed" ||
                                                item.status === "disposed"
                                            ) && (
                                                    <Info size={18} className="text-primary" />
                                                )}

                                        </button>
                                    </td>

                                </tr>
                            ))}
                            {paginatedReports.length === 0 && (
                                <tr>
                                    <td colSpan={11} className="text-center py-8 text-[#6B5C42]">
                                        No found items to display.
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

            {/* Image Modal */}
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
            )}

            {selectedItem &&
                (
                    <FoundReportItemManagementModal
                        selectedItem={selectedItem}
                        itemInfo={itemInfo}
                        setSelectedItem={setSelectedItem}
                        setItemInfo={setItemInfo}
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
