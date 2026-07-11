import { useState, useEffect } from "react";
import { Package, CheckCircle2, FileText, AlertTriangle, Sparkles, UserCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer } from "recharts";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";
import WebLoading from "../global-components/WebLoading";

const CENTER_COLORS = ["#7A0C0C", "#D4A017", "#8C7B6B", "#4A6FA5", "#5A8F5A", "#A55A8F"];

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

function CenterBarChart({ title, data, dataKey }) {
    return (
        <div className="flex-1 flex flex-col gap-3">
            <p className="text-sm font-semibold text-[#1A1208] text-center">{title}</p>
            <div className="h-52">
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
    const [counters, setCounters] = useState(null);
    const [actionFeed, setActionFeed] = useState([]);
    const [aiSummary, setAiSummary] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setIsLoading(true);
                const response = await fetchWithAuth(`${API_URL}/api/super-admin/dashboard`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to fetch dashboard.");
                }

                setStats(data.stats);
                setCenters(data.centers);
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
    }, []);

if (isLoading || !stats || !counters) {
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
        <div className="w-full min-h-screen bg-[#FAFAF8] p-6 flex flex-col gap-6">
           
           <p className="text-sm text-[#6B5C42]">
                 Welcome back, <span className="font-semibold text-[#1A1208]">{fullName}</span>! Here's your system overview.
            </p>

            {/* STAT CARDS */}
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
                    label="Overall Claim Rate"
                    value={stats.total_claimed}
                    subtext={`Claim Rate ${stats.claim_rate}%`}
                    subtextColor="text-green-700"
                />
                <StatCard
                    icon={FileText}
                    iconBg="bg-[#E3EAF7]"
                    iconColor="text-blue-700"
                    label="Active Lost Reports"
                    value={stats.active_lost_reports}
                    subtext="Awaiting Verification"
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

            {/* CENTER PERFORMANCE */}
            <div className="bg-white rounded-xl border border-[#E5E1D8] shadow-[0_2px_6px_0px_rgba(0,0,0,0.06)] p-6">
                <p className="font-semibold text-lg text-[#1A1208] mb-4">Center Performance</p>

                <div className="flex flex-col md:flex-row gap-6">
                    <CenterBarChart title="Surrendered Items" data={centers} dataKey="surrendered_items" />
                    <CenterBarChart title="Claimed Items" data={centers} dataKey="claimed_items" />
                    <CenterBarChart title="Unclaimed Items (>30 days)" data={centers} dataKey="unclaimed_30_days" />
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