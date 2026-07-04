import { useEffect, useState } from "react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { ClipboardList, CheckCircle, Clock, AlertTriangle } from "lucide-react";

export default function Dashboard() {
    const API_URL = import.meta.env.VITE_API_URL;
    const officeId = localStorage.getItem("office_location");
    const firstName = localStorage.getItem("first_name");
    const lastName = localStorage.getItem("last_name");
    const fullName = `${firstName} ${lastName}`.trim();

    const [stats, setStats] = useState(null);
    const [recentActions, setRecentActions] = useState([]);
    const [recentFeedbacks, setRecentFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await fetchWithAuth(`${API_URL}/api/dashboard/${officeId}`);
                const data = await res.json();
                setStats(data.stats);
                setRecentActions(data.recentActions);
                setRecentFeedbacks(data.recentFeedbacks);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

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
        },
        {
            label: "Items Claimed",
            value: stats?.items_claimed ?? "--",
            sub: `Claim Rate ${stats?.claim_rate ?? "--"}%`,
            icon: <CheckCircle size={28} className="text-green-500" />,
            bg: "bg-green-50",
        },
        {
            label: "Unclaimed Items (>30 days)",
            value: stats?.unclaimed_30_days ?? "--",
            sub: "To be donated",
            icon: <AlertTriangle size={28} className="text-red-400" />,
            bg: "bg-red-50",
        },
    ];

    return (
        <div className="min-h-screen w-full bg-[#F5F5F5] px-5 pt-5 xl:px-10 xl:pt-7 flex flex-col gap-5">

            {/* Welcome */}
            <p className="text-[#1A1208] text-base">
                Welcome back, <span className="font-bold">{fullName}</span>! Here's your center overview.
            </p>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {statCards.map((card, i) => (
                    <div key={i} className="bg-white rounded-xl border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.1)] p-5 flex flex-col gap-3">
                        <p className="text-sm text-gray-500">{card.label}</p>
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