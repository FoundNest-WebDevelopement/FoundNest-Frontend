import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Package, CheckCircle2, FileText, AlertTriangle } from "lucide-react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";
import GenerateReportModal from "../super-admin-components/GenerateReportModal";
import WebLoading from "../global-components/WebLoading";

function StatCard({ icon: Icon, iconBg, iconColor, label, value, subtext, subtextColor }) {
    return (
        <div className="bg-white rounded-xl border border-[#E5E1D8] shadow-[0_2px_6px_0px_rgba(0,0,0,0.06)] p-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
                    <Icon size={20} className={iconColor} />
                </div>
                <p className="text-sm text-[#6B5C42]">{label}</p>
            </div>
            <p className="text-3xl font-bold text-[#1A1208]">{value}</p>
            <p className={`text-xs font-medium ${subtextColor}`}>{subtext}</p>
        </div>
    );
}

export default function SuperAdminSystemReports() {
    const API_URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [centers, setCenters] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [openGenerateReport, setOpenGenerateReport] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    useEffect(() => {
        const fetchOverview = async () => {
            try {
                setIsLoading(true);
                const response = await fetchWithAuth(`${API_URL}/api/system-reports/overview`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to fetch system reports.");
                }

                setStats(data.stats);
                setCenters(data.centers);
            } catch (err) {
                console.error(err);
                toast.error(err.message || "Failed to load system reports.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchOverview();
    }, []);

    const filteredCenters = centers.filter((c) =>
        c.office_name?.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.max(1, Math.ceil(filteredCenters.length / itemsPerPage));
    const activePage = Math.min(currentPage, totalPages);
    const startIndex = (activePage - 1) * itemsPerPage;
    const paginatedCenters = filteredCenters.slice(startIndex, startIndex + itemsPerPage);

if (isLoading || !stats) {
    return <WebLoading />;
}

    return (
        <div className="w-full min-h-screen bg-[#FAFAF8] p-6 flex flex-col gap-6">

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                    icon={Package}
                    iconBg="bg-[#FBEFD8]"
                    iconColor="text-[#C89B3C]"
                    label="Total Items (All Centers)"
                    value={stats.total_items}
                    subtext="Surrendered Items"
                    subtextColor="text-green-700"
                />
                <StatCard
                    icon={CheckCircle2}
                    iconBg="bg-[#E3F2E3]"
                    iconColor="text-green-700"
                    label="Total Items Claimed"
                    value={stats.total_claimed}
                    subtext={`Claim Rate ${stats.claim_rate}%`}
                    subtextColor="text-green-700"
                />
                <StatCard
                    icon={FileText}
                    iconBg="bg-[#E3EAF7]"
                    iconColor="text-blue-700"
                    label="Total Lost Reports Filled"
                    value={stats.total_lost_reports}
                    subtext="Active lost reports system-wide"
                    subtextColor="text-blue-700"
                />
                <StatCard
                    icon={AlertTriangle}
                    iconBg="bg-[#FBE3E3]"
                    iconColor="text-[#C0392B]"
                    label="Unclaimed Items (> 30 Days)"
                    value={stats.unclaimed_30_days}
                    subtext="To be donated"
                    subtextColor="text-[#C0392B]"
                />
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 bg-white border border-[#E5E1D8] rounded-lg px-3 py-2 w-full max-w-xs shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)]">
                    <Search size={16} className="text-[#9A8F7C]" />
                    <input
                        type="text"
                        placeholder="Search centers..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full text-sm outline-none placeholder:text-[#9A8F7C]"
                    />
                </div>

                <button
                    type="button"
                    onClick={() => setOpenGenerateReport(true)}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium
                        transition-transform duration-100 active:scale-95 shrink-0"
                >
                    <Plus size={16} />
                    Generate Report
                </button>
            </div>

            <div>
                <div className="h-fit w-full max-w-full min-w-0 rounded-t-xl bg-white border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden">
                    <div className="w-full min-w-0 overflow-x-auto overflow-y-hidden bg-white shadow-sm">
                        <table className="table table-zebra table-sm w-full [&_th]:px-2 [&_td]:px-2 text-center">
                            <thead className="bg-primary text-white text-center">
                                <tr>
                                    <th>CENTER</th>
                                    <th>ITEMS LOGGED</th>
                                    <th>ITEMS CLAIMED</th>
                                    <th>CLAIM RATE</th>
                                    <th>UNCLAIMED ITEMS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedCenters.map((center, index) => (
                                    <tr
                                        key={center.office_id}
                                        onClick={() => navigate(`/super_admin/system_reports/${center.office_id}`)}
                                        className={`cursor-pointer ${index % 2 === 0 ? "bg-white" : "bg-[#F5F5F5]"}`}
                                    >
                                        <td className="text-left align-middle font-semibold text-primary underline">
                                            {center.office_name}
                                        </td>
                                        <td className="align-middle">{center.items_logged}</td>
                                        <td className="align-middle">{center.items_claimed}</td>
                                        <td className="align-middle font-semibold">{center.claim_rate}%</td>
                                        <td className="align-middle">{center.unclaimed_items}</td>
                                    </tr>
                                ))}
                                {paginatedCenters.length === 0 && (
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
                        Showing {filteredCenters.length === 0 ? 0 : startIndex + 1}
                        {" - "}
                        {Math.min(startIndex + itemsPerPage, filteredCenters.length)}
                        {" of "}
                        {filteredCenters.length}
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

            {openGenerateReport && (
                <GenerateReportModal
                    centers={centers}
                    onClose={() => setOpenGenerateReport(false)}
                />
            )}
        </div>
    );
}