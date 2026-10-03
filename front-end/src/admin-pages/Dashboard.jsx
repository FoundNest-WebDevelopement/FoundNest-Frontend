import { useEffect, useState } from "react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { ClipboardList, CheckCircle, AlertTriangle, Gift, Trash2 } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer } from "recharts";
import DateRangeFilter from "../global-components/DateRangeFilter";
import TrendBadge from "../global-components/TrendBadge";

const STATUS_COLORS = ["#4A6FA5", "#C0392B", "#5A8F5A", "#D4A017", "#8C7B6B"];

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

// Recharts' default Tooltip doesn't reliably follow the <Line> declaration
// order, so this renders each series explicitly in TREND_SERIES order
// (Logged, Claimed, Donated, Disposed) regardless of how Recharts orders payload.
function TrendTooltip({ active, payload, label, granularity }) {
    if (!active || !payload || payload.length === 0) return null;

    const valueByKey = Object.fromEntries(payload.map((p) => [p.dataKey, p.value]));

    return (
        <div style={{ background: "#fff", border: "1px solid #DDD9CF", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
            <p style={{ fontWeight: 600, margin: "0 0 4px" }}>{formatPeriodLabel(label, granularity)}</p>
            {TREND_SERIES.map((series) => (
                <p key={series.key} style={{ margin: 0, color: series.color }}>
                    {series.label}: {valueByKey[series.key] ?? 0}
                </p>
            ))}
        </div>
    );
}

export default function Dashboard() {
    const API_URL = import.meta.env.VITE_API_URL;
    const officeId = localStorage.getItem("office_location");
    const firstName = localStorage.getItem("first_name");
    const lastName = localStorage.getItem("last_name");
    const fullName = `${firstName} ${lastName}`.trim();

    const [stats, setStats] = useState(null);
    const [statusBreakdown, setStatusBreakdown] = useState([]);
    const [statusTrend, setStatusTrend] = useState({ granularity: "day", points: [] });
    const [comparison, setComparison] = useState(null);
    const [recentActions, setRecentActions] = useState([]);
    const [recentFeedbacks, setRecentFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (dateRange.startDate && dateRange.endDate) {
                    params.set("start_date", dateRange.startDate);
                    params.set("end_date", dateRange.endDate);
                }
                const query = params.toString() ? `?${params.toString()}` : "";
                const res = await fetchWithAuth(`${API_URL}/api/dashboard/${officeId}${query}`);
                const data = await res.json();
                setStats(data.stats);
                setStatusBreakdown(data.statusBreakdown ?? []);
                setStatusTrend(data.statusTrend ?? { granularity: "day", points: [] });
                setComparison(data.comparison ?? null);
                setRecentActions(data.recentActions);
                setRecentFeedbacks(data.recentFeedbacks);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, [dateRange]);

    const formatTimeAgo = (dateStr) => {
        const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
        if (diff < 60) return `${diff} secs ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        return `${Math.floor(diff / 86400)} days ago`;
    };

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={i < rating ? "text-[#FFC107]" : "text-gray-300"}>★</span>
        ));
    };

    const statCards = [
        {
            label: "Items Logged",
            value: stats?.items_logged ?? "--",
            sub: `Items This Month: ${stats?.items_this_month ?? "--"}`,
            icon: <ClipboardList size={28} className="text-yellow-500" />,
            bg: "bg-yellow-50",
            trend: comparison?.items_logged,
        },
        {
            label: "Items Claimed",
            value: stats?.items_claimed ?? "--",
            sub: `Claim Rate ${stats?.claim_rate ?? "--"}%`,
            icon: <CheckCircle size={28} className="text-green-500" />,
            bg: "bg-green-50",
            trend: comparison?.items_claimed,
        },
        {
            label: "Unclaimed Items (>30 days)",
            value: stats?.unclaimed_30_days ?? "--",
            sub: "To be donated",
            icon: <AlertTriangle size={28} className="text-red-400" />,
            bg: "bg-red-50",
            // No trend badge here — this is always a live backlog snapshot,
            // not scoped to the date filter, so "vs previous period" doesn't apply.
        },
        {
            label: "Donated Items",
            value: stats?.donated_items ?? "--",
            sub: "Given to charity",
            icon: <Gift size={28} className="text-blue-500" />,
            bg: "bg-blue-50",
            trend: comparison?.donated_items,
        },
        {
            label: "Disposed Items",
            value: stats?.disposed_items ?? "--",
            sub: "Discarded as waste",
            icon: <Trash2 size={28} className="text-gray-500" />,
            bg: "bg-gray-100",
            trend: comparison?.disposed_items,
        },
    ];

    return (
        <div className="min-h-screen w-full bg-[#F5F5F5] px-5 pt-5 xl:px-10 xl:pt-7 flex flex-col gap-5">

            {/* Welcome */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-[#1A1208] text-base">
                    Welcome back, <span className="font-bold">{fullName}</span>! Here's your center overview.
                </p>
                <DateRangeFilter onChange={setDateRange} />
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4">
                {statCards.map((card, i) => (
                    <div key={i} className="bg-white rounded-xl border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.1)] p-5 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-gray-500 min-w-0 flex-1">{card.label}</p>
                            {!loading && (
                                <div className="shrink-0">
                                    <TrendBadge percent={card.trend} />
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`${card.bg} p-2 rounded-full`}>
                                {card.icon}
                            </div>
                            <p className="text-4xl font-bold text-[#1A1208]">
                                {loading ? "--" : card.value}
                            </p>
                        </div>
                        <p className="text-xs text-gray-400">{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* Item Status Breakdown */}
            <div className="bg-white rounded-xl border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.1)] p-5">
                <p className="font-semibold text-[#1A1208] text-base mb-4">Item Status Breakdown</p>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statusBreakdown} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                            <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]} label={{ position: "top", fontSize: 12, fontWeight: 600 }}>
                                {statusBreakdown.map((entry, index) => (
                                    <Cell key={entry.status} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Status Over Time */}
            <div className="bg-white rounded-xl border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.1)] p-5">
                <p className="font-semibold text-[#1A1208] text-base mb-4">Status Over Time</p>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={statusTrend.points} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <XAxis
                                dataKey="period"
                                tickFormatter={(value) => formatPeriodLabel(value, statusTrend.granularity)}
                                tick={{ fontSize: 12 }}
                            />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <Tooltip content={<TrendTooltip granularity={statusTrend.granularity} />} />
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

            {/* Bottom Section */}
            <div className="flex gap-4 flex-col xl:flex-row">

                {/* Recent Actions */}
                <div className="flex-1 bg-white rounded-xl border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.1)] p-5">
                    <p className="font-semibold text-[#1A1208] text-base mb-4">Recent Actions</p>
                    <div className="flex flex-col gap-3">
                        {loading ? (
                            <p className="text-sm text-gray-400">Loading...</p>
                        ) : recentActions.length === 0 ? (
                            <p className="text-sm text-gray-400">No recent actions.</p>
                        ) : (
                            recentActions.map((action, i) => (
                                <div key={i} className="flex gap-3 items-start border-l-4 border-[#FDC502] pl-3 py-1">
                                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        <i className="fa-regular fa-circle-user text-gray-400 text-xl"></i>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-[#1A1208]">
                                            {action.first_name} {action.last_name}
                                        </p>
                                        <p className="text-xs text-gray-500">{action.details}</p>
                                        <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(action.created_at)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Feedbacks */}
                <div className="xl:w-80 bg-white rounded-xl border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.1)] p-5">
                    <p className="font-semibold text-[#1A1208] text-base mb-4">Recent Feedbacks</p>
                    <div className="flex flex-col gap-4">
                        {loading ? (
                            <p className="text-sm text-gray-400">Loading...</p>
                        ) : recentFeedbacks.length === 0 ? (
                            <p className="text-sm text-gray-400">No feedbacks yet.</p>
                        ) : (
                            recentFeedbacks.map((fb, i) => (
                                <div key={i} className="flex flex-col gap-1 border-b border-[#FDC502] pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                <i className="fa-regular fa-circle-user text-gray-400 text-lg"></i>
                                            </div>
                                            <p className="text-sm font-semibold text-[#1A1208]">
                                                {fb.student_number || fb.email}
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-400">{formatTimeAgo(fb.created_at)}</p>
                                    </div>
                                    <div className="text-base ml-10">{renderStars(fb.rating)}</div>
                                    <p className="text-xs text-gray-500 ml-10">{fb.review_text}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}