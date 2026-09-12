import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Search, Filter, ChevronDown, ArrowLeft, Download, Package, CheckCircle2, AlertTriangle, Trash2 } from "lucide-react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";
import formatDateTime from "../utils/formatDataTimeNew";
import { formatItemId, formatReportId } from "../utils/formatId";
import WebLoading from "../global-components/WebLoading";

function StatCard({ icon: Icon, iconBg, iconColor, label, value }) {
    return (
        <div className="bg-white rounded-xl border border-[#E5E1D8] shadow-[0_2px_6px_0px_rgba(0,0,0,0.06)] p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
                    <Icon size={20} className={iconColor} />
                </div>
                <p className="text-sm text-[#6B5C42]">{label}</p>
            </div>
            <p className="text-3xl font-bold text-[#1A1208]">{value}</p>
        </div>
    );
}

const ACTIVITY_FILTERS = [
    { label: "Item Logged", value: "ITEM_LOGGED" },
    { label: "Item Released", value: "ITEM_RELEASED" },
    { label: "Item Edited", value: "ITEM_EDITED" },
    { label: "Item Archived", value: "ITEM_ARCHIVED" },
    { label: "Item Restored", value: "ITEM_RESTORED" },
    { label: "Item Disposed", value: "ITEM_DISPOSED" },
    { label: "Report Resolved", value: "REPORT_RESOLVED" },
    { label: "Report Archived", value: "REPORT_ARCHIVED" },
    { label: "Report Restored", value: "REPORT_RESTORED" },
    { label: "Report Reopened", value: "REPORT_REOPENED" },
    { label: "Transaction Reverted", value: "TRANSACTION_REVERTED" },
];

const ACTIVITY_LABELS = ACTIVITY_FILTERS.reduce((acc, filter) => {
    acc[filter.value] = filter.label;
    return acc;
}, {});

const ACTIVITY_COLORS = {
    ITEM_LOGGED: "bg-[#E6F1FB] text-[#2980B9]",
    ITEM_RELEASED: "bg-[#E3F2E3] text-green-700",
    ITEM_EDITED: "bg-[#EDE7F6] text-[#6A1B9A]",
    ITEM_ARCHIVED: "bg-[#FBEFD8] text-[#C89B3C]",
    ITEM_RESTORED: "bg-[#E6F1FB] text-[#2980B9]",
    ITEM_DISPOSED: "bg-[#FBEFD8] text-[#C89B3C]",
    REPORT_RESOLVED: "bg-[#E3F2E3] text-green-700",
    REPORT_ARCHIVED: "bg-[#FBEFD8] text-[#C89B3C]",
    REPORT_RESTORED: "bg-[#E6F1FB] text-[#2980B9]",
    REPORT_REOPENED: "bg-[#E6F1FB] text-[#2980B9]",
    TRANSACTION_REVERTED: "bg-[#F9ECEC] text-[#C0392B]",
};

export default function SuperAdminSystemReportDetail() {
    const { officeId } = useParams();
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;

    const [office, setOffice] = useState(null);
    const [stats, setStats] = useState(null);
    const [admins, setAdmins] = useState([]);
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);

    const [isLoadingOverview, setIsLoadingOverview] = useState(true);
    const [isLoadingLogs, setIsLoadingLogs] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    const [search, setSearch] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [selectedActivityTypes, setSelectedActivityTypes] = useState([]);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [selectedAdmin, setSelectedAdmin] = useState("all");

    const [appliedActivityTypes, setAppliedActivityTypes] = useState([]);
    const [appliedDateFrom, setAppliedDateFrom] = useState("");
    const [appliedDateTo, setAppliedDateTo] = useState("");
    const [appliedAdmin, setAppliedAdmin] = useState("all");

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const hasActiveFilters =
        appliedActivityTypes.length > 0 ||
        appliedDateFrom !== "" ||
        appliedDateTo !== "" ||
        appliedAdmin !== "all";

    useEffect(() => {
        const fetchOverview = async () => {
            try {
                setIsLoadingOverview(true);
                const response = await fetchWithAuth(`${API_URL}/api/system-reports/office/${officeId}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to fetch office report.");
                }

                setOffice(data.office);
                setStats(data.stats);
                setAdmins(data.admins);
            } catch (err) {
                console.error(err);
                toast.error(err.message || "Failed to load office report.");
            } finally {
                setIsLoadingOverview(false);
            }
        };

        fetchOverview();
    }, [officeId]);

    const fetchLogs = async () => {
        try {
            setIsLoadingLogs(true);

            const params = new URLSearchParams({
                page: currentPage,
                limit: itemsPerPage,
            });

            if (search.trim()) params.set("search", search.trim());
            if (appliedActivityTypes.length > 0) params.set("activity", appliedActivityTypes.join(","));
            if (appliedDateFrom) params.set("date_from", appliedDateFrom);
            if (appliedDateTo) params.set("date_to", appliedDateTo);
            if (appliedAdmin !== "all") params.set("admin_id", appliedAdmin);

            const response = await fetchWithAuth(`${API_URL}/api/system-reports/office/${officeId}/logs?${params.toString()}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch activity logs.");
            }

            setLogs(data.logs);
            setTotal(data.total);
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Failed to load activity logs.");
        } finally {
            setIsLoadingLogs(false);
        }
    };

    useEffect(() => {
        fetchLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [officeId, currentPage, search, appliedActivityTypes, appliedDateFrom, appliedDateTo, appliedAdmin]);

    const toggleActivityType = (value) => {
        if (value === "ALL") {
            setSelectedActivityTypes([]);
            return;
        }

        setSelectedActivityTypes((prev) =>
            prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
        );
    };

    const handleApplyFilters = () => {
        setAppliedActivityTypes(selectedActivityTypes);
        setAppliedDateFrom(dateFrom);
        setAppliedDateTo(dateTo);
        setAppliedAdmin(selectedAdmin);
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setSelectedActivityTypes([]);
        setDateFrom("");
        setDateTo("");
        setSelectedAdmin("all");
        setAppliedActivityTypes([]);
        setAppliedDateFrom("");
        setAppliedDateTo("");
        setAppliedAdmin("all");
        setCurrentPage(1);
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);

            const params = new URLSearchParams();
            if (search.trim()) params.set("search", search.trim());
            if (appliedActivityTypes.length > 0) params.set("activity", appliedActivityTypes.join(","));
            if (appliedDateFrom) params.set("date_from", appliedDateFrom);
            if (appliedDateTo) params.set("date_to", appliedDateTo);
            if (appliedAdmin !== "all") params.set("admin_id", appliedAdmin);

            const response = await fetchWithAuth(`${API_URL}/api/system-reports/office/${officeId}/export?${params.toString()}`);

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to export activity log.");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `office-${officeId}-activity-log.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success("Exported successfully.");
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Failed to export activity log.");
        } finally {
            setIsExporting(false);
        }
    };

    const formatRecordId = (log) =>
        log.record_type === "report" ? formatReportId(log.record_id) : formatItemId(log.record_id);

    const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
    const activePage = Math.min(currentPage, totalPages);
    const startIndex = (activePage - 1) * itemsPerPage;

    if (isLoadingOverview || !stats || !office) {
        return <WebLoading />;
    }

    return (
        <div className="w-full min-h-screen bg-[#FAFAF8] p-6 flex flex-col gap-4">
            <div className="text-sm text-[#6B5C42]">
                <Link to="/super_admin/system_reports" className="hover:underline">System Reports</Link>
                <span className="mx-1">›</span>
                <span className="font-medium text-primary underline">{office.office_name}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-[#1A1208]">{office.office_name}</h1>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate("/super_admin/system_reports")}
                        className="flex items-center gap-2 bg-white border border-primary text-primary px-4 py-2 rounded-md text-sm font-medium
                            transition-transform duration-100 active:scale-95"
                    >
                        <ArrowLeft size={16} />
                        Back to Reports
                    </button>
                    <button
                        type="button"
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium
                            transition-transform duration-100 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Download size={16} />
                        {isExporting ? "Exporting..." : "Export Log"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard icon={Package} iconBg="bg-[#FBEFD8]" iconColor="text-[#C89B3C]" label="Items Logged" value={stats.items_logged} />
                <StatCard icon={CheckCircle2} iconBg="bg-[#E3F2E3]" iconColor="text-green-700" label="Items Claimed" value={stats.items_claimed} />
                <StatCard icon={AlertTriangle} iconBg="bg-[#FBE3E3]" iconColor="text-[#C0392B]" label="Unclaimed Items" value={stats.unclaimed_items} />
                <StatCard icon={Trash2} iconBg="bg-[#E3F2E3]" iconColor="text-green-700" label="Items Disposed" value={stats.items_disposed} />
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white border border-[#DDD9CF] rounded-lg px-3 py-2 flex-1 max-w-md shadow-[0_2px_4px_0px_rgba(0,0,0,0.1)]">
                    <Search size={16} className="text-[#9A8F7C]" />
                    <input
                        type="text"
                        placeholder="Search by item name, ID, or action..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full text-sm outline-none placeholder:text-[#9A8F7C]"
                    />
                </div>

                <div className="flex-1" />

                <button
                    type="button"
                    onClick={() => setIsFilterOpen((prev) => !prev)}
                    className={`flex items-center gap-2 border border-primary px-4 py-2 rounded-md text-sm font-medium
                        transition-transform duration-100 active:scale-95 shrink-0
                        ${hasActiveFilters ? "bg-primary text-white" : "bg-white text-primary"}`}
                >
                    <Filter size={16} />
                    Filter
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isFilterOpen ? "rotate-180" : ""}`} />
                </button>
            </div>

            {isFilterOpen && (
                <div className="bg-white border border-[#DDD9CF] rounded-lg p-5 shadow-[0_2px_4px_0px_rgba(0,0,0,0.1)] flex flex-col gap-5">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 flex flex-col gap-3">
                            <p className="text-sm font-semibold text-[#1A1208]">Filter by Activity</p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => toggleActivityType("ALL")}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                                        ${selectedActivityTypes.length === 0
                                            ? "bg-primary text-white border-primary"
                                            : "bg-white text-[#6B5C42] border-[#DDD9CF]"}`}
                                >
                                    All
                                </button>

                                {ACTIVITY_FILTERS.map((filter) => {
                                    const isActive = selectedActivityTypes.includes(filter.value);
                                    return (
                                        <button
                                            key={filter.value}
                                            type="button"
                                            onClick={() => toggleActivityType(filter.value)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                                                ${isActive
                                                    ? "bg-primary text-white border-primary"
                                                    : "bg-white text-[#6B5C42] border-[#DDD9CF]"}`}
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

                    <div className="flex flex-col gap-3 md:w-72">
                        <p className="text-sm font-semibold text-[#1A1208]">Admin Personnel</p>
                        <select
                            value={selectedAdmin}
                            onChange={(e) => setSelectedAdmin(e.target.value)}
                            className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none focus:border-primary bg-white"
                        >
                            <option value="all">All Admins</option>
                            {admins.map((admin) => (
                                <option key={admin.user_id} value={admin.user_id}>
                                    {admin.name}
                                </option>
                            ))}
                        </select>
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

            <div>
                <div className="h-fit w-full max-w-full min-w-0 rounded-t-xl bg-white border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden">
                    <div className="w-full min-w-0 overflow-x-auto overflow-y-hidden bg-white shadow-sm">
                        <table className="table table-zebra table-sm w-full [&_th]:px-2 [&_td]:px-2 text-center">
                            <thead className="bg-primary text-white text-center">
                                <tr>
                                    <th>TIMESTAMP</th>
                                    <th>ADMIN</th>
                                    <th>ACTION</th>
                                    <th>ID</th>
                                    <th>ITEM</th>
                                    <th>DETAILS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoadingLogs && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-[#6B5C42]">
                                            Loading logs...
                                        </td>
                                    </tr>
                                )}

                                {!isLoadingLogs && logs.map((log, index) => (
                                    <tr
                                        key={log.action_log_id}
                                        className={index % 2 === 0 ? "bg-white" : "bg-[#F5F5F5]"}
                                    >
                                        <td className="align-middle whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                                        <td className="align-middle">{log.admin_name}</td>
                                        <td className="align-middle">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium w-fit inline-block ${ACTIVITY_COLORS[log.activity_key] || "bg-gray-200 text-gray-700"}`}>
                                                {ACTIVITY_LABELS[log.activity_key] || log.activity_key}
                                            </span>
                                        </td>
                                        <td className="align-middle font-semibold text-primary">{formatRecordId(log)}</td>
                                        <td className="align-middle">{log.item_name || "—"}</td>
                                        <td className="align-middle text-left text-[#6B5C42]">{log.description}</td>
                                    </tr>
                                ))}

                                {!isLoadingLogs && logs.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-[#6B5C42]">
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
                        Showing {total === 0 ? 0 : startIndex + 1}
                        {" - "}
                        {Math.min(startIndex + itemsPerPage, total)}
                        {" of "}
                        {total}
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={activePage === 1}
                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                            className={`border border-primary rounded-md px-3 py-2 text-primary ${activePage === 1 ? "opacity-40 cursor-not-allowed" : "cursor-pointer active:scale-95"}`}
                        >
                            Prev
                        </button>
                        <p className="text-[#6B5C42]">Page {activePage} of {totalPages}</p>
                        <button
                            type="button"
                            disabled={activePage === totalPages}
                            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                            className={`border border-primary rounded-md px-3 py-2 text-primary ${activePage === totalPages ? "opacity-40 cursor-not-allowed" : "cursor-pointer active:scale-95"}`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
