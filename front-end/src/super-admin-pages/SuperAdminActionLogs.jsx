import { useState, useEffect, useMemo, Fragment } from "react";
import { Search, Filter, Download, ChevronDown } from "lucide-react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";
import formatDateTime from "../utils/formatDataTimeNew";
import { formatActionType } from "../utils/formatActionType";
import WebLoading from "../global-components/WebLoading";
import ExportModal from "../global-components/ExportModal";

// Maps DB enum values to filter pill labels shown in the UI.
// NOTE: a few of these (deactivate variants, unlock) don't have their own
// enum value yet in action_log_type — they reuse the closest existing type
// (e.g. UPDATE_LOCATION for both "Edited Location" and "Deactivated Location").
// If you want these to be filterable as truly separate events, you'll need
// to add dedicated enum values (e.g. DEACTIVATE_LOCATION, UNLOCK_ACCOUNT).
const ACTION_TYPE_FILTERS = [
    { label: "Granted Admin Privileges", value: "CREATE_ADMIN" },
    { label: "Revoked Admin Privileges", value: "REVOKE_ADMIN" },
    { label: "Transferred Super Admin Privileges", value: "TRANSFER_SUPER_ADMIN" },
    { label: "Added Policy", value: "CREATE_POLICY" },
    { label: "Edited Policy", value: "UPDATE_POLICY" },
    { label: "Added Location", value: "CREATE_LOCATION" },
    { label: "Edited Location", value: "UPDATE_LOCATION" },
    { label: "Deactivated Location", value: "DEACTIVATE_LOCATION" },
    { label: "Added Category", value: "CREATE_CATEGORY" },
    { label: "Edited Category", value: "UPDATE_CATEGORY" },
    { label: "Deactivated Category", value: "DEACTIVATE_CATEGORY" },
    { label: "Added Center", value: "CREATE_OFFICE" },
    { label: "Edited Center", value: "UPDATE_OFFICE" },
    { label: "Deactivated Center", value: "DEACTIVATE_OFFICE" },
    { label: "Locked User Account", value: "LOCK_ACCOUNT" },
    { label: "Unlocked User Account", value: "UNLOCK_ACCOUNT" },
    { label: "Reset Password", value: "RESET_PASSWORD" },
    { label: "Exported CSV", value: "EXPORT_CSV" },
    { label: "Exported PDF", value: "EXPORT_PDF" },
];

// Badge color per action type — grouped loosely by "severity"/category
const ACTION_TYPE_COLORS = {
    CREATE_ADMIN: "bg-[#FFF3CD] text-[#856404]",
    REVOKE_ADMIN: "bg-[#F9ECEC] text-[#C0392B]",
    TRANSFER_SUPER_ADMIN: "bg-[#EDE7F6] text-[#6A1B9A]",
    CREATE_POLICY: "bg-[#E6F1FB] text-[#2980B9]",
    UPDATE_POLICY: "bg-[#EDE7F6] text-[#6A1B9A]",
    CREATE_LOCATION: "bg-[#E6F1FB] text-[#2980B9]",
    UPDATE_LOCATION: "bg-[#EDE7F6] text-[#6A1B9A]",
    CREATE_CATEGORY: "bg-[#E6F1FB] text-[#2980B9]",
    UPDATE_CATEGORY: "bg-[#EDE7F6] text-[#6A1B9A]",
    CREATE_OFFICE: "bg-[#E6F1FB] text-[#2980B9]",
    UPDATE_OFFICE: "bg-[#EDE7F6] text-[#6A1B9A]",
    LOCK_ACCOUNT: "bg-[#F9ECEC] text-[#C0392B]",
    RESET_PASSWORD: "bg-[#F9ECEC] text-[#C0392B]",
    EXPORT_CSV: "bg-gray-200 text-gray-700",
    EXPORT_PDF: "bg-gray-200 text-gray-700",
    GENERATE_REPORT: "bg-[#E6F1FB] text-[#2980B9]",
};

const getActionTypeColor = (actionType) =>
    ACTION_TYPE_COLORS[actionType] || "bg-gray-200 text-gray-700";

export default function SuperAdminActionLogs() {
    const API_URL = import.meta.env.VITE_API_URL;

    const userId = localStorage.getItem("user_id")

    const superAdminUserId = localStorage.getItem("user_id");

    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLogs, setIsLogs] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const [search, setSearch] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedActionTypes, setSelectedActionTypes] = useState([]); // [] means "All"
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    // Applied filters (only updated when "Apply Filters" is clicked)
    const [appliedActionTypes, setAppliedActionTypes] = useState([]);
    const [appliedDateFrom, setAppliedDateFrom] = useState("");
    const [appliedDateTo, setAppliedDateTo] = useState("");

    const [expandedLogId, setExpandedLogId] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [tableHeight, setTableHeight] = useState("");
        const [itemsPerPage, setItemsPerPage] = useState();

    const formatLogId = (id) => `LOG-${String(id).padStart(5, "0")}`;
    const formatRecordId = (entityType, entityId) => {
        if (!entityType || !entityId) return "N/A";
        const prefix = entityType.slice(0, 3).toUpperCase();
        return `${prefix}-${String(entityId).padStart(5, "0")}`;
    };

    const fetchLogs = async () => {
        try {
            setIsLoading(true);
            setIsLogs(true);
            const response = await fetchWithAuth(`${API_URL}/api/action-logs/user/${superAdminUserId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch action logs.");
            }

            setLogs(data);
            setIsLogs(false);
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const toggleActionType = (value) => {
        if (value === "ALL") {
            setSelectedActionTypes([]);
            return;
        }

        setSelectedActionTypes((prev) =>
            prev.includes(value)
                ? prev.filter((v) => v !== value)
                : [...prev, value]
        );
    };

    const handleApplyFilters = () => {
        setAppliedActionTypes(selectedActionTypes);
        setAppliedDateFrom(dateFrom);
        setAppliedDateTo(dateTo);
        setCurrentPage(1);
        setIsFilterOpen(false);
    };

    const handleClearFilters = () => {
        setSelectedActionTypes([]);
        setDateFrom("");
        setDateTo("");
        setAppliedActionTypes([]);
        setAppliedDateFrom("");
        setAppliedDateTo("");
        setCurrentPage(1);
    };

    const filteredLogs = useMemo(() => {
        return logs?.filter((log) => {
            const matchesSearch =
                search.trim() === "" ||
                formatActionType(log.action_type).toLowerCase().includes(search.toLowerCase()) ||
                formatRecordId(log.entity_type, log.entity_id).toLowerCase().includes(search.toLowerCase()) ||
                log.description?.toLowerCase().includes(search.toLowerCase());

            const matchesActionType =
                appliedActionTypes.length === 0 ||
                appliedActionTypes.includes(log.action_type);

            const logDate = new Date(log.created_at);
            const matchesDateFrom = !appliedDateFrom || logDate >= new Date(appliedDateFrom);
            const matchesDateTo = !appliedDateTo || logDate <= new Date(appliedDateTo + "T23:59:59");

            return matchesSearch && matchesActionType && matchesDateFrom && matchesDateTo;
        });
    }, [logs, search, appliedActionTypes, appliedDateFrom, appliedDateTo]);

    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
    const activePage = Math.min(currentPage, totalPages);
    const startIndex = (activePage - 1) * itemsPerPage;
    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);



useEffect(() => {
    const updateTableSize = () => {
        const height = window.innerHeight;

        if (height > 732) {
            setTableHeight("min-h-160");
            setItemsPerPage(10);
        } else {
            setTableHeight("min-h-115");
            setItemsPerPage(7);
        }
    };

    updateTableSize();

    window.addEventListener("resize", updateTableSize);

    return () => {
        window.removeEventListener("resize", updateTableSize);
    };
}, []);

    return (
        <div className="w-full flex flex-col gap-4 bg-[#F5F5F5] px-5 pt-5 xl:px-10 xl:pt-7">
            {!isLogs? 
                (
                    <>
                    <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white border border-[#DDD9CF] rounded-lg px-3 py-2 flex-1 shadow-[0_2px_4px_0px_rgba(0,0,0,0.1)]">
                    <Search size={16} className="text-[#9A8F7C]" />
                    <input
                        type="text"
                        placeholder="Search by action type or affected record..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full text-sm outline-none placeholder:text-[#9A8F7C]"
                    />
                </div>
                <div className="flex-1">
                        {/* spacer */}
                </div>

                <button
                    type="button"
                    onClick={() => setIsFilterOpen((prev) => !prev)}
                    className="flex items-center gap-2 bg-white border border-primary text-primary px-4 py-2 rounded-md text-sm font-medium
                        transition-transform duration-100 active:scale-95 shrink-0"
                >
                    <Filter size={16} />
                    Filter
                    <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${isFilterOpen ? "rotate-180" : ""}`}
                    />
                </button>

                <button
                    type="button"
                    onClick={() => setIsExportModalOpen(true)}
                    disabled={isExporting}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium
                        transition-transform duration-100 active:scale-95 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <Download size={16} />
                    {isExporting? "Exporting..." : "Export Logs"}
                </button>
            </div>

         
            {isFilterOpen && (
                <div className="bg-white border border-[#DDD9CF] rounded-lg p-5 shadow-[0_2px_4px_0px_rgba(0,0,0,0.1)] flex flex-col gap-5">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 flex flex-col gap-3">
                            <p className="text-sm font-semibold text-[#1A1208]">Action Type</p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => toggleActionType("ALL")}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                                        ${
                                            selectedActionTypes.length === 0
                                                ? "bg-primary text-white border-primary"
                                                : "bg-white text-[#6B5C42] border-[#DDD9CF]"
                                        }`}
                                >
                                    All
                                </button>

                                {ACTION_TYPE_FILTERS.map((filter) => {
                                    const isActive = selectedActionTypes.includes(filter.value);
                                    return (
                                        <button
                                            key={filter.label}
                                            type="button"
                                            onClick={() => toggleActionType(filter.value)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                                                ${
                                                    isActive
                                                        ? "bg-primary text-white border-primary"
                                                        : "bg-white text-[#6B5C42] border-[#DDD9CF]"
                                                }`}
                                        >
                                            {filter.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 md:w-56 shrink-0">
                            <p className="text-sm font-semibold text-[#1A1208]">Date Range</p>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                            />
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    <hr className="border-[#DDD9CF]" />

                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={handleApplyFilters}
                            className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium
                                transition-transform duration-100 active:scale-95"
                        >
                            Apply Filters
                        </button>
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="text-primary text-sm font-medium"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className={`h-fit ${tableHeight} w-full max-w-full min-w-0 rounded-t-xl bg-white border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] flex flex-col`}>
                <div className="w-full min-w-0 overflow-x-auto overflow-y-hidden bg-white shadow-sm rounded-t-xl">
                    <table className="table table-zebra table-sm   min-w-full [&_th]:px-2 [&_td]:px-2 text-left">
                        <thead className="bg-primary text-white text-center">
                            <tr>
                                <th className="w-10 whitespace-nowrap"></th>
                                <th className="w-24 whitespace-nowrap">LOG ID</th>
                                <th className="w-40">TIMESTAMP</th>
                                <th className="w-52 whitespace-nowrap">ACTION TYPE</th>
                                <th className="w-32">AFFECTED RECORD</th>
                                <th>DETAILS</th>
                            </tr>
                        </thead>
                        

                        <tbody>

                          
                            {isLoading && (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-[#6B5C42]">
                                        Loading logs...
                                    </td>
                                </tr>
                            )}

                            {!isLoading &&
                                paginatedLogs.map((log, index) => {
                                    const isExpanded = expandedLogId === log.action_log_id;
                                    const description = log.description || "No additional details.";
                                    const isLong = description.length > 60;
                                    const performedBy = log.first_name
                                        ? `${log.first_name} ${log.last_name}${log.user_role ? ` (${formatActionType(log.user_role)})` : ""}`
                                        : "N/A";

                                    return (
                                        <Fragment key={log.action_log_id}>
                                            <tr
                                                className={index % 2 === 0 ? "bg-white text-center" : "bg-[#F5F5F5] text-center "}
                                            >
                                                <td className="align-top py-3 font-medium text-[#1A1208] whitespace-nowrap">
                                             
                                                </td>
                                                <td className="align-top py-3 font-medium text-[#1A1208] whitespace-nowrap">
                                                    {formatLogId(log.action_log_id)}
                                                </td>

                                                <td className="align-top py-3 text-[#6B5C42] whitespace-nowrap">
                                                    {formatDateTime(log.created_at)}
                                                </td>

                                                <td className="align-top py-3 whitespace-nowrap">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-medium w-fit inline-block 
                                                            ${getActionTypeColor(log.action_type)}`}
                                                    >
                                                        {formatActionType(log.action_type)}
                                                    </span>
                                                </td>

                                                <td className="align-top py-3 font-medium text-[#1A1208] whitespace-nowrap">
                                                    {formatRecordId(log.entity_type, log.entity_id)}
                                                </td>

                                                <td className="align-top py-3 text-[#6B5C42] max-w-md text-left ">
                                                    <p className="truncate pl-10">{description}</p>
                                                    <button 
                                                        type="button"
                                                        onClick={() =>
                                                            setExpandedLogId(isExpanded ? null : log.action_log_id)
                                                        }
                                                        className="text-primary text-xs font-medium flex items-center gap-1 mt-1 pl-10" 
                                                    >
                                                        <ChevronDown
                                                            size={12}
                                                            className={`transition-transform duration-200 ${
                                                                isExpanded ? "rotate-180" : ""
                                                            }`}
                                                        />
                                                        {isExpanded ? "Collapse" : "Expand"}
                                                    </button>
                                                </td>
                                            </tr>

                                            {isExpanded && (
                                                <tr className="bg-[#FFF8E7]">
                                                    <td colSpan={6} className="p-0  w-full ">
                                                        <div className="w-full py-4">
                                                            <div className="border-l-4  border-l-[#D4A017] py-4 px-2 flex flex-col gap-2 ml-15 pl-6">
                                                            <p className="text-sm font-semibold text-[#1A1208]">
                                                                Full Details
                                                            </p>
                                                            <p className="text-sm text-[#1A1208]">
                                                                {description}
                                                            </p>
                                                            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-[#9A8F7C] mt-1">
                                                                <span>Timestamp: {formatDateTime(log.created_at)}</span>
                                                                <span>Log ID: {formatLogId(log.action_log_id)}</span>
                                                                <span>Record: {formatRecordId(log.entity_type, log.entity_id)}</span>
                                                                <span>Performed by: {performedBy}</span>
                                                            </div>
                                                        </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}

                            {!isLoading && paginatedLogs.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-8 text-[#6B5C42]">
                                        No Records to display.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between bg-white border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] rounded-b-xl px-4 py-3 text-xs -mt-3">
                <p className="text-[#6B5C42]">
                    Showing {filteredLogs.length === 0 ? 0 : startIndex + 1}
                    {" - "}
                    {Math.min(startIndex + itemsPerPage, filteredLogs.length)}
                    {" of "}
                    {filteredLogs.length}
                </p>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        disabled={activePage === 1}
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        className={`border border-primary rounded-md px-3 py-2 text-primary ${
                            activePage === 1 ? "opacity-40 cursor-not-allowed" : "cursor-pointer active:scale-95"
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
                        className={`border border-primary rounded-md px-3 py-2 text-primary ${
                            activePage === totalPages ? "opacity-40 cursor-not-allowed" : "cursor-pointer active:scale-95"
                        }`}
                    >
                        Next
                    </button>
                </div>
            </div>
                    </>
                ) 
                :
                (
                    <>
                      <WebLoading/>
                    </>
                )
            }
            {isExportModalOpen && (
                <ExportModal
                    title="Export Action Logs"
                    endpoint="/api/export/action-logs"
                    queryParams={{ userId }}
                    filenamePrefix="ACTION_LOGS"
                    onClose={() => setIsExportModalOpen(false)}
                    onUpdate={fetchLogs}
                />
            )}
            
        </div>
    );
}