import { Pencil } from "lucide-react";
import { useState } from "react";
import LocationManagementModal from "./LocationManagementModal";

const TYPE_LABELS = {
    COLLEGE: "College Building",
    SHARED_SPACE: "Shared Student Spaces",
    GATE: "Gates",
};

export default function LocationTable({ locations, onUpdated, selectedLocation, setSelectedLocation }) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const safeLocations = Array.isArray(locations) ? locations : [];
    const totalPages = Math.max(1, Math.ceil(safeLocations.length / itemsPerPage));
    const activePage = Math.min(currentPage, totalPages);
    const startIndex = (activePage - 1) * itemsPerPage;
    const paginatedLocations = safeLocations.slice(startIndex, startIndex + itemsPerPage);

    const formatLocId = (index) => `LOC-${String(index + 1).padStart(5, "0")}`;

    return (
        <>
            <div>
                <div className="h-fit w-full max-w-full min-w-0 min-h-100 rounded-t-xl bg-white border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden">
                    <div className="w-full min-w-0 overflow-x-auto overflow-y-hidden bg-white shadow-sm">
                        <table className="table table-zebra table-sm min-w-295 [&_th]:px-2 [&_td]:px-2 text-center">
                            <thead className="bg-primary text-white text-center">
                                <tr>
                                    <th className="w-20">LOC ID</th>
                                    <th className="w-48">NAME</th>
                                    <th className="w-40">TYPE</th>
                                    <th className="w-32">STATUS</th>
                                    <th className="w-24">ACTIONS</th>
                                </tr>
                            </thead>

                            <tbody>
                                {paginatedLocations?.map((loc, index) => (
                                    <tr
                                        key={`${loc.location_type}-${loc.location_id}`}
                                        className={
                                            index % 2 === 0
                                                ? "bg-white"
                                                : "bg-[#F5F5F5]"
                                        }
                                    >
                                        <td className="w-28 align-middle text-center">
                                            {formatLocId(startIndex + index)}
                                        </td>

                                        <td className="truncate max-w-48 align-middle text-center">
                                            {loc.location_name ? loc.location_name : "N/A"}
                                        </td>

                                        <td className="align-middle text-center">
                                            {TYPE_LABELS[loc.location_type] || loc.location_type}
                                        </td>

                                        <td className="align-middle text-center">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium 
                                                ${loc.status === true && "bg-green-100 text-green-700"}
                                                ${loc.status == false && "bg-gray-200 text-gray-700"}
                                                `}
                                            >
                                                {loc.status === true && "Active"}
                                                {loc.status === false && "Inactive"}
                                            </span>
                                        </td>

                                        <td className="align-middle text-center">
                                            <button
                                                className=" btn-sm btn-square  text-white border-none cursor-pointer transition-transform duration-100
                                                active:scale-95 disabled:opacity-20 "
                                                onClick={() => setSelectedLocation(loc)}
                                            >
                                                <Pencil size={18} className="text-primary" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {paginatedLocations.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-[#6B5C42]">
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
                        Showing {safeLocations.length === 0 ? 0 : startIndex + 1}
                        {" - "}
                        {Math.min(startIndex + itemsPerPage, safeLocations.length)}
                        {" of "}
                        {safeLocations.length}
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
            </div>

            {selectedLocation && (
                <LocationManagementModal
                    selectedLocation={selectedLocation}
                    setSelectedLocation={setSelectedLocation}
                    onUpdated={onUpdated}
                />
            )}
        </>
    );
}