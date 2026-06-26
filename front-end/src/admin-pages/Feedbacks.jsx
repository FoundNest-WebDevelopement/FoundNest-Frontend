import { useEffect, useState } from "react";
import { Eye, X, Pencil, Search, Download } from "lucide-react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Feedbacks() {
    const API_URL = import.meta.env.VITE_API_URL;
    const officeId = localStorage.getItem("office_location");

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState(null);
    const [responseText, setResponseText] = useState("");
    const [isEditingResponse, setIsEditingResponse] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Search & Filters
    const [searchText, setSearchText] = useState("");
    const [starFilterTemp, setStarFilterTemp] = useState("");
    const [statusFilterTemp, setStatusFilterTemp] = useState("");
    const [dateFilterTemp, setDateFilterTemp] = useState("");
    const [starFilter, setStarFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");

    const getStatus = (review) => {
        if (review.response_text) return "responded";
        if (review.is_read) return "read";
        return "new";
    };

    const visibleReviews = reviews.filter((review) => {
        const query = searchText.toLowerCase();
        const feedbackId = `FB-${String(review.review_id).padStart(5, "0")}`.toLowerCase();
        const studentId = (review.student_number || review.email || "").toLowerCase();
        const status = getStatus(review);

        const matchesSearch =
            !query ||
            feedbackId.includes(query) ||
            studentId.includes(query) ||
            status.includes(query);

        const matchesStar = !starFilter || String(review.rating) === starFilter;

        const matchesStatus =
            statusFilter === "archived"
                ? review.is_archived
                : statusFilter
                ? status === statusFilter && !review.is_archived
                : !review.is_archived;

        const reviewDate = new Date(review.created_at).toISOString().split("T")[0];
        const matchesDate = !dateFilter || reviewDate === dateFilter;

        return matchesSearch && matchesStar && matchesStatus && matchesDate;
    });

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const res = await fetchWithAuth(`${API_URL}/api/offices/${officeId}/reviews`);
            const data = await res.json();
            setReviews(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleView = async (review) => {
        setSelectedReview(review);
        setResponseText(review.response_text || "");
        setIsEditingResponse(false);
        if (!review.is_read) {
            try {
                await fetchWithAuth(`${API_URL}/api/reviews/${review.review_id}/read`, {
                    method: "PATCH",
                });
                setReviews((prev) =>
                    prev.map((r) =>
                        r.review_id === review.review_id ? { ...r, is_read: true } : r
                    )
                );
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleSubmitResponse = async () => {
        if (!responseText.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetchWithAuth(
                `${API_URL}/api/reviews/${selectedReview.review_id}/respond`,
                {
                    method: "PATCH",
                    body: JSON.stringify({ response_text: responseText }),
                }
            );
            const data = await res.json();
            setReviews((prev) =>
                prev.map((r) =>
                    r.review_id === selectedReview.review_id ? { ...r, ...data.review } : r
                )
            );
            setSelectedReview((prev) => ({ ...prev, ...data.review }));
            setIsEditingResponse(false);
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelResponse = () => {
        setResponseText(selectedReview.response_text || "");
        setIsEditingResponse(false);
    };

    const handleArchive = async () => {
        try {
            await fetchWithAuth(
                `${API_URL}/api/reviews/${selectedReview.review_id}/archive`,
                { method: "PATCH" }
            );
            setReviews((prev) =>
                prev.map((r) =>
                    r.review_id === selectedReview.review_id ? { ...r, is_archived: true } : r
                )
            );
            setSelectedReview(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleUnarchive = async () => {
        try {
            await fetchWithAuth(
                `${API_URL}/api/reviews/${selectedReview.review_id}/unarchive`,
                { method: "PATCH" }
            );
            setReviews((prev) =>
                prev.map((r) =>
                    r.review_id === selectedReview.review_id ? { ...r, is_archived: false } : r
                )
            );
            setSelectedReview(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleApplyFilters = () => {
        setStarFilter(starFilterTemp);
        setStatusFilter(statusFilterTemp);
        setDateFilter(dateFilterTemp);
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setSearchText("");
        setStarFilterTemp("");
        setStatusFilterTemp("");
        setDateFilterTemp("");
        setStarFilter("");
        setStatusFilter("");
        setDateFilter("");
        setCurrentPage(1);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const officeName = localStorage.getItem("office_name") || "Office";

        doc.setFontSize(16);
        doc.text(`${officeName} - Feedbacks Report`, 14, 16);
        doc.setFontSize(10);
        doc.text(
            `Generated: ${new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
            })}`,
            14,
            22
        );

        const tableRows = visibleReviews.map((review) => [
            `FB-${String(review.review_id).padStart(5, "0")}`,
            review.student_number || review.email,
            "★".repeat(review.rating) + "☆".repeat(5 - review.rating),
            review.review_text || "",
            formatDate(review.created_at),
            getStatus(review).charAt(0).toUpperCase() + getStatus(review).slice(1),
        ]);

        autoTable(doc, {
            startY: 28,
            head: [["Feedback ID", "From", "Rating", "Subject", "Date Submitted", "Status"]],
            body: tableRows,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [153, 0, 0] },
        });

        doc.save(`feedbacks-report-${new Date().toISOString().split("T")[0]}.pdf`);
    };

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={i < rating ? "text-[#FFC107]" : "text-gray-300"}>
                ★
            </span>
        ));
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    };

    const formatDateTime = (dateStr) => {
        return new Date(dateStr).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    const totalPages = Math.max(1, Math.ceil(visibleReviews.length / itemsPerPage));
    const activePage = Math.min(currentPage, totalPages);
    const startIndex = (activePage - 1) * itemsPerPage;
    const paginatedReviews = visibleReviews.slice(startIndex, startIndex + itemsPerPage);

    return (
        <>
            <div className="min-h-screen w-full bg-[#F5F5F5] px-5 pt-5 xl:px-10 xl:pt-7 flex flex-col gap-3">

                {/* Search + Export */}
                <div className="flex gap-3 items-center">
                    <div className="flex-1 flex items-center border border-[#DDD9CF] rounded-md shadow-[0_4px_4px_0px_rgba(0,0,0,0.1)] bg-white px-3">
                        <Search size={18} className="text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by feedback ID, student ID, or status..."
                            value={searchText}
                            onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
                            className="flex-1 px-2 py-2 outline-none text-sm bg-transparent"
                        />
                    </div>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 border border-primary text-primary bg-white rounded-md px-4 py-2 text-sm font-semibold hover:bg-primary/5 transition cursor-pointer whitespace-nowrap"
                    >
                        <Download size={16} />
                        Export PDF
                    </button>
                </div>

                {/* Filters Row */}
                <div className="bg-white border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.1)] rounded-md px-4 py-3 flex items-center gap-3 flex-wrap">
                    <select
                        value={starFilterTemp}
                        onChange={(e) => setStarFilterTemp(e.target.value)}
                        className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm text-[#4B2D23] outline-none flex-1 min-w-32"
                    >
                        <option value="">All Star Rating</option>
                        <option value="5">5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="2">2 Stars</option>
                        <option value="1">1 Star</option>
                    </select>

                    <select
                        value={statusFilterTemp}
                        onChange={(e) => setStatusFilterTemp(e.target.value)}
                        className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm text-[#4B2D23] outline-none flex-1 min-w-32"
                    >
                        <option value="">All Status</option>
                        <option value="new">New</option>
                        <option value="read">Read</option>
                        <option value="responded">Responded</option>
                        <option value="archived">Archived</option>
                    </select>

                    <input
                        type="date"
                        value={dateFilterTemp}
                        onChange={(e) => setDateFilterTemp(e.target.value)}
                        className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm text-[#4B2D23] outline-none flex-1 min-w-32"
                    />

                    <div className="flex items-center gap-3 ml-auto">
                        <button
                            onClick={handleApplyFilters}
                            className="bg-primary text-white rounded-md px-5 py-2 text-sm font-semibold hover:opacity-90 transition active:scale-95 cursor-pointer whitespace-nowrap"
                        >
                            Apply Filters
                        </button>
                        <button
                            onClick={handleClearFilters}
                            className="text-primary text-sm font-semibold hover:underline cursor-pointer whitespace-nowrap"
                        >
                            Clear
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="h-fit w-full max-w-full min-w-0 min-h-100 rounded-t-xl bg-white border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden">
                    <div className="w-full min-w-0 overflow-x-auto overflow-y-hidden bg-white shadow-sm">
                        <table className="table table-zebra table-sm min-w-200 [&_th]:px-2 [&_td]:px-2 text-center">
                            <thead className="bg-primary text-white text-center">
                                <tr>
                                    <th className="w-5"></th>
                                    <th className="w-32">FEEDBACK ID</th>
                                    <th className="w-40">FROM</th>
                                    <th className="w-40">Star Rating</th>
                                    <th className="w-80">SUBJECT</th>
                                    <th className="w-40">DATE SUBMITTED</th>
                                    <th className="w-24">STATUS</th>
                                    <th className="w-24">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8 text-[#6B5C42]">
                                            Loading...
                                        </td>
                                    </tr>
                                ) : paginatedReviews.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8 text-[#6B5C42]">
                                            No feedbacks to display.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedReviews.map((review, index) => (
                                        <tr
                                            key={review.review_id}
                                            className={index % 2 === 0 ? "bg-white" : "bg-[#F5F5F5]"}
                                        >
                                            <td className="align-middle">{startIndex + index + 1}</td>
                                            <td className="align-middle text-center">
                                                FB-{String(review.review_id).padStart(5, "0")}
                                            </td>
                                            <td className="align-middle text-center">
                                                {review.student_number || review.email}
                                            </td>
                                            <td className="align-middle text-center text-lg">
                                                {renderStars(review.rating)}
                                            </td>
                                            <td className="align-middle text-center max-w-80 truncate">
                                                {review.review_text}
                                            </td>
                                            <td className="align-middle text-center">
                                                {formatDate(review.created_at)}
                                            </td>
                                            <td className="align-middle text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                                                            getStatus(review) === "responded"
                                                                ? "bg-green-50 text-green-700 border border-green-300"
                                                                : getStatus(review) === "read"
                                                                ? "bg-gray-100 text-gray-600"
                                                                : "bg-yellow-50 text-yellow-700 border border-yellow-300"
                                                        }`}
                                                    >
                                                        {getStatus(review)}
                                                    </span>
                                                    {review.is_archived && (
                                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-500">
                                                            Archived
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="align-middle text-center">
                                                <button
                                                    onClick={() => handleView(review)}
                                                    className="btn-sm btn-square text-white border-none cursor-pointer transition-transform duration-100 active:scale-95"
                                                >
                                                    <Eye size={18} className="text-primary" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between bg-white border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] rounded-b-xl px-4 py-3 text-xs mt-1">
                    <p className="text-[#6B5C42]">
                        Showing {visibleReviews.length === 0 ? 0 : startIndex + 1}
                        {" - "}
                        {Math.min(startIndex + itemsPerPage, visibleReviews.length)}
                        {" of "}
                        {visibleReviews.length}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={activePage === 1}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            className={`border border-primary rounded-md px-3 py-2 text-primary ${
                                activePage === totalPages ? "opacity-40 cursor-not-allowed" : "cursor-pointer active:scale-95"
                            }`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* View Feedback Side Panel */}
            {selectedReview && (
                <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
                    <div className="bg-white w-full max-w-md h-full shadow-xl flex flex-col">

                        {/* Header */}
                        <div className="bg-primary px-6 py-4 flex items-center justify-between">
                            <h2 className="text-white font-semibold text-lg">View Feedback</h2>
                            <button
                                onClick={() => setSelectedReview(null)}
                                className="text-white hover:opacity-70 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 flex flex-col gap-4 flex-1 overflow-y-auto">

                            {/* User info */}
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                    <i className="fa-regular fa-circle-user text-gray-400 text-2xl"></i>
                                </div>
                                <div>
                                    <p className="font-semibold text-[#4B2D23]">
                                        {selectedReview.student_number || selectedReview.email}
                                    </p>
                                    <div className="text-lg">
                                        {renderStars(selectedReview.rating)}
                                    </div>
                                </div>
                            </div>

                            {/* Review text */}
                            <p className="text-[#4B2D23] text-sm leading-relaxed">
                                {selectedReview.review_text}
                            </p>

                            {/* Date submitted */}
                            <p className="text-xs text-gray-400">
                                Submitted: {formatDateTime(selectedReview.created_at)}
                            </p>

                            <hr className="border-gray-200" />

                            {/* Response section */}
                            {!selectedReview.response_text || isEditingResponse ? (
                                <>
                                    <p className="font-semibold text-[#4B2D23]">
                                        {isEditingResponse ? "Edit Response" : "Respond to Feedback"}
                                    </p>
                                    <textarea
                                        value={responseText}
                                        onChange={(e) => setResponseText(e.target.value)}
                                        placeholder="Type your response here..."
                                        rows={5}
                                        className="w-full border border-gray-300 rounded-lg p-3 text-sm text-[#4B2D23] outline-none focus:border-primary resize-none"
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            onClick={isEditingResponse ? handleCancelResponse : () => setSelectedReview(null)}
                                            className="flex-1 border border-primary text-primary rounded-lg py-3 text-sm font-semibold hover:bg-gray-50 transition active:scale-95 cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSubmitResponse}
                                            disabled={submitting || !responseText.trim()}
                                            className="flex-1 bg-primary text-white rounded-lg py-3 text-sm font-semibold hover:opacity-90 transition active:scale-95 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                                        >
                                            {isEditingResponse ? "Confirm" : "Submit Response"}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="font-semibold text-[#4B2D23]">Response</p>
                                    <div className="bg-[#FFF3D6] border-l-4 border-[#FDC502] rounded-md p-4 flex flex-col gap-2">
                                        <p className="text-sm text-[#4B2D23] leading-relaxed">
                                            {selectedReview.response_text}
                                        </p>
                                        {/* Responded by name + date */}
                                        <div className="flex flex-col gap-0.5 mt-1">
                                            {selectedReview.responded_by_name?.trim() && (
                                                <p className="text-xs text-gray-500">
                                                    Responded by: <span className="font-medium text-[#4B2D23]">{selectedReview.responded_by_name}</span>
                                                </p>
                                            )}
                                            {selectedReview.response_date && (
                                                <p className="text-xs text-gray-400">
                                                    {formatDateTime(selectedReview.response_date)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsEditingResponse(true)}
                                        className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium w-fit hover:bg-gray-50 transition active:scale-95 cursor-pointer"
                                    >
                                        <Pencil size={14} />
                                        Edit Response
                                    </button>
                                </>
                            )}

                            <div className="flex-1" />

                            <hr className="border-gray-200" />
                            <button
                                onClick={selectedReview.is_archived ? handleUnarchive : handleArchive}
                                className="text-primary text-sm font-semibold text-left hover:underline cursor-pointer"
                            >
                                {selectedReview.is_archived ? "Unarchive Feedback" : "Archive Feedback"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}