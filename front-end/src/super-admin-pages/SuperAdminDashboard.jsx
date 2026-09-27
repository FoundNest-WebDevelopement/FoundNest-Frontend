import { useState, useEffect } from "react";
import { Package, CheckCircle2, FileText, AlertTriangle, Sparkles, UserCircle2, Gift, Trash2 } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";
import WebLoading from "../global-components/WebLoading";
import DateRangeFilter from "../global-components/DateRangeFilter";
import TrendBadge from "../global-components/TrendBadge";

const CENTER_COLORS = ["#7A0C0C", "#D4A017", "#8C7B6B", "#4A6FA5", "#5A8F5A", "#A55A8F"];

// Fixed categorical order — color follows the series identity, never its rank.
const TREND_SERIES = [
    { key: "logged", label: "Logged", color: "#2a78d6" },
    { key: "claimed", label: "Claimed", color: "#eb6834" },
    { key: "donated", label: "Donated", color: "#1baf7a" },
    { key: "disposed", label: "Disposed", color: "#eda100" },
];

function formatPeriodLabel(period, granularity) {
    const date = new Date(period);
    if (granularity === "month") {
        return date.toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "Asia/Manila" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "Asia/Manila" });
}

function StatCard({ icon: Icon, iconBg, iconColor, label, value, subtext, subtextColor, trend }) {
    return (
        <div className="bg-white rounded-xl border border-[#E5E1D8] shadow-[0_2px_6px_0px_rgba(0,0,0,0.06)] p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
                        <Icon size={20} className={iconColor} />
                    </div>
                    <p className="text-sm text-[#6B5C42] min-w-0">{label}</p>
                </div>
                <div className="shrink-0">
                    <TrendBadge percent={trend} />
                </div>
            </div>
            <p className="text-3xl font-bold text-[#1A1208]">{value}</p>
            <p className={`text-xs font-medium ${subtextColor}`}>{subtext}</p>
        </div>
    );
}

function CenterBarChart({ title, data, dataKey }) {
    // Bars keep a minimum width as centers are added — instead of squeezing
    // every bar thinner to fit them all in this panel, the chart grows wider
    // than the panel and scrolls horizontally once there's no more room.
    const minWidth = Math.max(280, data.length * 70);

    return (
        <div className="flex-1 flex flex-col gap-3 min-w-0">
            <p className="text-sm font-semibold text-[#1A1208] text-center">{title}</p>
            <div className="h-52 overflow-x-auto">
                <div style={{ width: "100%", minWidth: `${minWidth}px`, height: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                            <XAxis dataKey="office_name" hide />
                            <YAxis hide />
                            <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} label={{ position: "top", fontSize: 12, fontWeight: 600 }}>
                                {data.map((entry, index) => (
                                    <Cell key={entry.office_id} fill={CENTER_COLORS[index % CENTER_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                {data.map((entry, index) => (
                    <div key={entry.office_id} className="flex items-center gap-1.5">
                        <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: CENTER_COLORS[index % CENTER_COLORS.length] }}
                        />
                        <span className="text-xs text-[#6B5C42]">{entry.office_name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function timeAgo(dateStr) {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? "" : "s"} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

export default function SuperAdminDashboard() {
    const API_URL = import.meta.env.VITE_API_URL;
    const fullName = `${localStorage.getItem("first_name") || ""} ${localStorage.getItem("last_name") || ""}`.trim();

    const [stats, setStats] = useState(null);
    const [centers, setCenters] = useState([]);
    const [statusTrend, setStatusTrend] = useState({ granularity: "day", points: [] });
    const [comparison, setComparison] = useState(null);
    const [counters, setCounters] = useState(null);
    const [actionFeed, setActionFeed] = useState([]);
    const [aiSummary, setAiSummary] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setIsLoading(true);
                const params = new URLSearchParams();
                if (dateRange.startDate && dateRange.endDate) {
                    params.set("start_date", dateRange.startDate);
                    params.set("end_date", dateRange.endDate);
                }
                const query = params.toString() ? `?${params.toString()}` : "";
                const response = await fetchWithAuth(`${API_URL}/api/super-admin/dashboard${query}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to fetch dashboard.");
                }

                setStats(data.stats);
                setCenters(data.centers);
                setStatusTrend(data.statusTrend ?? { granularity: "day", points: [] });
                setComparison(data.comparison ?? null);
                setCounters(data.counters);
                setActionFeed(data.actionFeed);
                setAiSummary(data.aiSummary);
            } catch (err) {
                console.error(err);
                toast.error(err.message || "Failed to load dashboard.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboard();
    }, [dateRange]);

if (!stats || !counters) {
    return <WebLoading />;
}

    const counterItems = [
        { label: "Total Admins", value: counters.total_admins },
        { label: "Students Registered", value: counters.students_registered.toLocaleString() },
        { label: "Items Logged Today", value: counters.items_logged_today },
        { label: "Claims Processed Today", value: counters.claims_processed_today },
        { label: "Open Reports Today", value: counters.open_reports_today },
    ];

    return (
        <div className={`w-full min-h-screen bg-[#FAFAF8] p-6 flex flex-col gap-6 transition-opacity ${isLoading ? "opacity-60" : "opacity-100"}`}>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-[#6B5C42]">
                    Welcome back, <span className="font-semibold text-[#1A1208]">{fullName}</span>! Here's your system overview.
                </p>
                <DateRangeFilter onChange={setDateRange} />
            </div>

            {/* STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-5">
                <StatCard
                    icon={Package}
                    iconBg="bg-[#FBEFD8]"
                    iconColor="text-[#C89B3C]"
                    label="Total Items (All Centers)"
                    value={stats.total_items}
                    subtext="Surrendered Items"
                    subtextColor="text-green-700"
                    trend={comparison?.total_items}
                />
                <StatCard
                    icon={CheckCircle2}
                    iconBg="bg-[#E3F2E3]"
                    iconColor="text-green-700"
                    label="Overall Claim Rate"
                    value={stats.total_claimed}
                    subtext={`Claim Rate ${stats.claim_rate}%`}
                    subtextColor="text-green-700"
                    trend={comparison?.total_claimed}
                />
                <StatCard
                    icon={FileText}
                    iconBg="bg-[#E3EAF7]"
                    iconColor="text-blue-700"
                    label="Active Lost Reports"
                    value={stats.active_lost_reports}
                    subtext="Awaiting Verification"
                    subtextColor="text-blue-700"
                    // No trend badge — this is a live snapshot of currently-open
                    // reports, not scoped to the date filter.
                />
                <StatCard
                    icon={AlertTriangle}
                    iconBg="bg-[#FBE3E3]"
                    iconColor="text-[#C0392B]"
                    label="Unclaimed Items (> 30 Days)"
                    value={stats.unclaimed_30_days}
                    subtext="To be donated"
                    subtextColor="text-[#C0392B]"
                    // No trend badge — always a live backlog snapshot too.
                />
                <StatCard
                    icon={Gift}
                    iconBg="bg-[#E3EAF7]"
                    iconColor="text-blue-700"
                    label="Donated Items"
                    value={stats.donated_items}
                    subtext="Given to charity"
                    subtextColor="text-blue-700"
                    trend={comparison?.donated_items}
                />
                <StatCard
                    icon={Trash2}
                    iconBg="bg-[#F0EFEC]"
                    iconColor="text-[#6B5C42]"
                    label="Disposed Items"
                    value={stats.disposed_items}
                    subtext="Discarded as waste"
                    subtextColor="text-[#6B5C42]"
                    trend={comparison?.disposed_items}
                />
            </div>

            {/* CENTER PERFORMANCE */}
            <div className="bg-white rounded-xl border border-[#E5E1D8] shadow-[0_2px_6px_0px_rgba(0,0,0,0.06)] p-6">
                <p className="font-semibold text-lg text-[#1A1208] mb-4">Center Performance</p>

                <div className="flex flex-col md:flex-row gap-6">
                    <CenterBarChart title="Surrendered Items" data={centers} dataKey="surrendered_items" />
                    <CenterBarChart title="Claimed Items" data={centers} dataKey="claimed_items" />
                    <CenterBarChart title="Unclaimed Items (>30 days)" data={centers} dataKey="unclaimed_30_days" />
                </div>
            </div>

            {/* STATUS OVER TIME */}
            <div className="bg-white rounded-xl border border-[#E5E1D8] shadow-[0_2px_6px_0px_rgba(0,0,0,0.06)] p-6">
                <p className="font-semibold text-lg text-[#1A1208] mb-4">Status Over Time</p>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={statusTrend.points} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <XAxis
                                dataKey="period"
                                tickFormatter={(value) => formatPeriodLabel(value, statusTrend.granularity)}
                                tick={{ fontSize: 12 }}
                            />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <Tooltip
                                labelFormatter={(value) => formatPeriodLabel(value, statusTrend.granularity)}
                                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                            />
                            {TREND_SERIES.map((series) => (
                                <Line
                                    key={series.key}
                                    type="monotone"
                                    dataKey={series.key}
                                    name={series.label}
                                    stroke={series.color}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 5 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3">
                    {TREND_SERIES.map((series) => (
                        <div key={series.key} className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: series.color }} />
                            <span className="text-xs text-[#6B5C42]">{series.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI SUMMARY */}
            <div className="bg-[#FBF3D9] border border-[#E8D9A0] rounded-xl p-5 flex gap-3">
                <div className="shrink-0">
                    <Sparkles size={18} className="text-[#C89B3C] mt-0.5" />
                </div>
                <div>
                    <p className="text-xs font-semibold tracking-wide text-[#8C7B4A] mb-1">AI SUMMARY</p>
                    <p className="text-sm text-[#4A3F2A] leading-relaxed">{aiSummary}</p>
                </div>
            </div>

            {/* ACTION FEED + QUICK COUNTERS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-[#E5E1D8] shadow-[0_2px_6px_0px_rgba(0,0,0,0.06)] p-5">
                    <p className="font-semibold text-base text-[#1A1208] mb-4">System Action Feed</p>

                    <div className="flex flex-col gap-3">
                        {actionFeed.length === 0 && (
                            <p className="text-sm text-[#6B5C42] text-center py-6">No recent activity.</p>
                        )}

                        {actionFeed.map((action) => (
                            <div
                                key={action.action_log_id}
                                className="flex items-start gap-3 bg-[#F5F5F3] rounded-lg px-4 py-3"
                            >
                                <UserCircle2 size={28} className="text-[#1A1208] shrink-0 mt-0.5" strokeWidth={1.5} />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-semibold text-[#1A1208]">
                                            {action.first_name
                                                ? `${action.first_name} ${action.last_name}`
                                                : "System"}
                                        </p>
                                        {action.office_name && (
                                            <span className="text-xs text-[#9A8F7C]">{action.office_name}</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-[#4A3F2A]">{action.description}</p>
                                    <p className="text-xs text-[#9A8F7C] mt-0.5">{timeAgo(action.created_at)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-[#E5E1D8] shadow-[0_2px_6px_0px_rgba(0,0,0,0.06)] p-5">
                    <p className="font-semibold text-base text-[#1A1208] mb-4">Quick Counters</p>

                    <div className="flex flex-col">
                        {counterItems.map((item, index) => (
                            <div
                                key={item.label}
                                className={`flex items-center justify-between py-3 ${
                                    index !== counterItems.length - 1 ? "border-b border-[#E5E1D8]" : ""
                                }`}
                            >
                                <p className="text-sm text-[#6B5C42]">{item.label}</p>
                                <p className="text-xl font-bold text-[#1A1208]">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}