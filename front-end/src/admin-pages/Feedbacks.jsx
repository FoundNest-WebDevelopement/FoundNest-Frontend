import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, X, Pencil, Search, Download, Trash2 } from "lucide-react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ConfirmDialog from "../global-components/ConfirmDialog";
import AdminDateInput from "../admin-components/AdminDateInput";

const toLocalISODate = (d = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

export default function Feedbacks() {
    const API_URL = import.meta.env.VITE_API_URL;
    const officeId = localStorage.getItem("office_location");
    const today = toLocalISODate();

    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportFormat, setExportFormat] = useState("pdf");
    const [exportScope, setExportScope] = useState("filtered"); // "filtered" | "all"

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState(null);
    const [responseText, setResponseText] = useState("");
    const [isEditingResponse, setIsEditingResponse] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Search & Filters — applied live, no separate "Apply" step
    const [searchText, setSearchText] = useState("");
    const [starFilter, setStarFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [dateFilterFrom, setDateFilterFrom] = useState("");
    const [dateFilterTo, setDateFilterTo] = useState("");

    // Archive/unarchive confirmation
    const [pendingArchiveAction, setPendingArchiveAction] = useState(null); // null | "archive" | "unarchive"
    const [isArchiving, setIsArchiving] = useState(false);

    // Delete response confirmation
    const [pendingDeleteResponse, setPendingDeleteResponse] = useState(false);
    const [isDeletingResponse, setIsDeletingResponse] = useState(false);

    // Discard-unsaved-changes confirmation — "revert-edit" means Cancel was
    // pressed while editing an existing response (falls back to the saved
    // response); "close-panel" means the whole panel is being closed
    // (X, backdrop click, or Cancel on a brand-new, never-saved response).
    const [pendingDiscardAction, setPendingDiscardAction] = useState(null); // null | "revert-edit" | "close-panel"

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

        const subject = (review.review_text || "").toLowerCase();

        const matchesSearch =
            !query ||
            feedbackId.includes(query) ||
            studentId.includes(query) ||
            status.includes(query) ||
            subject.includes(query);

        const matchesStar = !starFilter || String(review.rating) === starFilter;

        const matchesStatus =
            statusFilter === "archived"
                ? review.is_archived
                : statusFilter
                ? status === statusFilter && !review.is_archived
                : true; // "All Status" means all, including archived

        const reviewDate = toLocalISODate(new Date(review.created_at));
        const matchesDate =
            (!dateFilterFrom || reviewDate >= dateFilterFrom) &&
            (!dateFilterTo || reviewDate <= dateFilterTo);

        return matchesSearch && matchesStar && matchesStatus && matchesDate;
    });

    const reviewsToExport = exportScope === "all" ? reviews : visibleReviews;
    const noReviewsToExport = exportScope === "filtered" && visibleReviews.length === 0;
    const isExportValid = !noReviewsToExport;

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

            if (!res.ok) {
                throw new Error(data.message || "Failed to submit response.");
            }

            setReviews((prev) =>
                prev.map((r) =>
                    r.review_id === selectedReview.review_id ? { ...r, ...data.review } : r
                )
            );
            setSelectedReview((prev) => ({ ...prev, ...data.review }));
            setIsEditingResponse(false);
            toast.success("Response submitted successfully.");
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Failed to submit response.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelResponse = () => {
        setResponseText(selectedReview.response_text || "");
        setIsEditingResponse(false);
    };

    // The compose/edit textarea is showing whenever there's no saved response
    // yet, or an existing one is being edited — "unsaved" means its text no
    // longer matches whatever's actually saved for this review.
    const isComposeFormOpen =
        selectedReview && !selectedReview.is_archived && (!selectedReview.response_text || isEditingResponse);
    const hasUnsavedResponseChanges =
        isComposeFormOpen && responseText.trim() !== (selectedReview?.response_text || "").trim();

    const handleCancelClick = () => {
        if (!hasUnsavedResponseChanges) {
            if (isEditingResponse) handleCancelResponse();
            else setSelectedReview(null);
            return;
        }
        setPendingDiscardAction(isEditingResponse ? "revert-edit" : "close-panel");
    };

    const handleClosePanel = () => {
        if (!hasUnsavedResponseChanges) {
            setSelectedReview(null);
            return;
        }
        setPendingDiscardAction("close-panel");
    };

    const confirmDiscard = () => {
        if (pendingDiscardAction === "revert-edit") {
            handleCancelResponse();
        } else if (pendingDiscardAction === "close-panel") {
            setSelectedReview(null);
        }
        setPendingDiscardAction(null);
    };

    const handleDeleteResponse = async () => {
        setIsDeletingResponse(true);
        try {
            const res = await fetchWithAuth(
                `${API_URL}/api/reviews/${selectedReview.review_id}/response`,
                { method: "DELETE" }
            );
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to delete response.");
            }

            setReviews((prev) =>
                prev.map((r) =>
                    r.review_id === selectedReview.review_id ? { ...r, ...data.review } : r
                )
            );
            setSelectedReview((prev) => ({ ...prev, ...data.review }));
            setResponseText("");
            setIsEditingResponse(false);
            toast.success("Response deleted.");
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Failed to delete response.");
        } finally {
            setIsDeletingResponse(false);
            setPendingDeleteResponse(false);
        }
    };

    const handleArchive = async () => {
        setIsArchiving(true);
        try {
            const res = await fetchWithAuth(
                `${API_URL}/api/reviews/${selectedReview.review_id}/archive`,
                { method: "PATCH" }
            );
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to archive feedback.");
            }

            setReviews((prev) =>
                prev.map((r) =>
                    r.review_id === selectedReview.review_id ? { ...r, is_archived: true } : r
                )
            );
            toast.success("Feedback archived.");
            setSelectedReview(null);
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Failed to archive feedback.");
        } finally {
            setIsArchiving(false);
            setPendingArchiveAction(null);
        }
    };

    const handleUnarchive = async () => {
        setIsArchiving(true);
        try {
            const res = await fetchWithAuth(
                `${API_URL}/api/reviews/${selectedReview.review_id}/unarchive`,
                { method: "PATCH" }
            );
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to unarchive feedback.");
            }

            setReviews((prev) =>
                prev.map((r) =>
                    r.review_id === selectedReview.review_id ? { ...r, is_archived: false } : r
                )
            );
            toast.success("Feedback unarchived.");
            setSelectedReview(null);
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Failed to unarchive feedback.");
        } finally {
            setIsArchiving(false);
            setPendingArchiveAction(null);
        }
    };

    const handleClearFilters = () => {
        setSearchText("");
        setStarFilter("");
        setStatusFilter("");
        setDateFilterFrom("");
        setDateFilterTo("");
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

        const tableRows = reviewsToExport.map((review) => [
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

        doc.save(`feedbacks-report-${exportScope === "all" ? "ALL" : "FILTERED"}.pdf`);
    };

    const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

    const handleExportCSV = () => {
        const header = ["Feedback ID", "From", "Rating", "Subject", "Date Submitted", "Status"];

        const rows = reviewsToExport.map((review) => [
            `FB-${String(review.review_id).padStart(5, "0")}`,
            review.student_number || review.email,
            review.rating,
            review.review_text || "",
            formatDate(review.created_at),
            getStatus(review).charAt(0).toUpperCase() + getStatus(review).slice(1),
        ]);

        const csvContent = [header, ...rows]
            .map((row) => row.map(csvEscape).join(","))
            .join("\r\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `feedbacks-report-${exportScope === "all" ? "ALL" : "FILTERED"}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleExport = () => {
        if (!isExportValid) {
            return;
        }

        if (exportFormat === "pdf") {
            handleExportPDF();
        } else {
            handleExportCSV();
        }

        setIsExportModalOpen(false);
        setExportScope("filtered");
    };

    const handleCloseExportModal = () => {
        setIsExportModalOpen(false);
        setExportScope("filtered");
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
                            placeholder="Search by feedback ID, student ID, subject, or status..."
                            value={searchText}
                            onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
                            className="flex-1 px-2 py-2 outline-none text-sm bg-transparent"
                        />
                    </div>
                    <button
                        onClick={() => setIsExportModalOpen(true)}
                        className="flex items-center gap-2 border border-primary text-primary bg-white rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/5 transition cursor-pointer whitespace-nowrap"
                    >
                        <Download size={16} />
                        Export Feedback
                    </button>
                </div>

                {/* Filters Row */}
                <div className="bg-white border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.1)] rounded-md px-4 py-3 flex items-center gap-3 flex-wrap">
                    <select
                        value={starFilter}
                        onChange={(e) => { setStarFilter(e.target.value); setCurrentPage(1); }}
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
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm text-[#4B2D23] outline-none flex-1 min-w-32"
                    >
                        <option value="">All Status</option>
                        <option value="new">New</option>
                        <option value="read">Read</option>
                        <option value="responded">Responded</option>
                        <option value="archived">Archived</option>
                    </select>

                    <div className="text-[#DDD9CF] text-xl font-light select-none">|</div>
                    <div className="flex-1">
                        <AdminDateInput placeholder="Start Date" value={dateFilterFrom} onChange={(val) => { setDateFilterFrom(val); setCurrentPage(1); }} max={dateFilterTo || today} />
                    </div>
                    <div className="flex-1">
                        <AdminDateInput placeholder="End Date" value={dateFilterTo} onChange={(val) => { setDateFilterTo(val); setCurrentPage(1); }} min={dateFilterFrom || undefined} max={today} />
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                        <button
                            onClick={handleClearFilters}
                            className="text-primary text-sm font-semibold hover:underline cursor-pointer whitespace-nowrap"
                        >
                            Clear Filters
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
                <div
                    className="fixed inset-0 bg-black/40 z-50 flex justify-end"
                    onClick={handleClosePanel}
                >
                    <div
                        className="bg-white w-full max-w-md h-full shadow-xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >

                        {/* Header */}
                        <div className="bg-primary px-6 py-4 flex items-center justify-between">
                            <h2 className="text-white font-semibold text-lg">View Feedback</h2>
                            <button
                                onClick={handleClosePanel}
                                className="text-white hover:opacity-70 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 flex flex-col gap-4 flex-1 overflow-y-auto">

                            {/* User info */}
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                                    {selectedReview.profile_image_url ? (
                                        <img
                                            src={selectedReview.profile_image_url}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <i className="fa-regular fa-circle-user text-gray-400 text-2xl"></i>
                                    )}
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
                                selectedReview.is_archived ? (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                        <p className="text-sm text-gray-500">
                                            This feedback is archived. Unarchive this feedback to send a response.
                                        </p>
                                    </div>
                                ) : (
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
                                            onClick={handleCancelClick}
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
                                )
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
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setIsEditingResponse(true)}
                                            className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium w-fit hover:bg-gray-50 transition active:scale-95 cursor-pointer"
                                        >
                                            <Pencil size={14} />
                                            Edit Response
                                        </button>
                                        <button
                                            onClick={() => setPendingDeleteResponse(true)}
                                            className="flex items-center gap-2 border border-[#C0392B]/30 text-[#C0392B] rounded-lg px-4 py-3 text-sm font-medium w-fit hover:bg-[#FBEAEA] transition active:scale-95 cursor-pointer"
                                        >
                                            <Trash2 size={14} />
                                            Delete Response
                                        </button>
                                    </div>
                                </>
                            )}

                            <div className="flex-1" />

                            <hr className="border-gray-200" />
                            <button
                                onClick={() =>
                                    setPendingArchiveAction(selectedReview.is_archived ? "unarchive" : "archive")
                                }
                                className="text-primary text-sm font-semibold text-left hover:underline cursor-pointer"
                            >
                                {selectedReview.is_archived ? "Unarchive Feedback" : "Archive Feedback"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {pendingArchiveAction === "archive" && (
                <ConfirmDialog
                    title="Archive Feedback"
                    description="Are you sure you want to archive this feedback?"
                    message="You can unarchive it later from the same panel."
                    confirmText={isArchiving ? "Archiving..." : "Archive"}
                    cancelText="Cancel"
                    disabled={isArchiving}
                    onClose={() => setPendingArchiveAction(null)}
                    onConfirm={handleArchive}
                />
            )}

            {pendingArchiveAction === "unarchive" && (
                <ConfirmDialog
                    title="Unarchive Feedback"
                    description="Are you sure you want to unarchive this feedback?"
                    message="It will show up again in the active feedback list."
                    confirmText={isArchiving ? "Unarchiving..." : "Unarchive"}
                    cancelText="Cancel"
                    disabled={isArchiving}
                    onClose={() => setPendingArchiveAction(null)}
                    onConfirm={handleUnarchive}
                />
            )}

            {pendingDeleteResponse && (
                <ConfirmDialog
                    title="Delete Response"
                    description="Are you sure you want to delete this response?"
                    message="The student will no longer see a reply on their review. This can't be undone."
                    confirmText={isDeletingResponse ? "Deleting..." : "Delete"}
                    cancelText="Cancel"
                    disabled={isDeletingResponse}
                    onClose={() => setPendingDeleteResponse(false)}
                    onConfirm={handleDeleteResponse}
                />
            )}

            {pendingDiscardAction && (
                <ConfirmDialog
                    title="Discard Changes"
                    description="You have unsaved changes to this response."
                    message="Are you sure you want to discard them?"
                    confirmText="Discard"
                    cancelText="Keep Editing"
                    onClose={() => setPendingDiscardAction(null)}
                    onConfirm={confirmDiscard}
                />
            )}

            {isExportModalOpen && createPortal(
                <div
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1040]"
                    onClick={handleCloseExportModal}
                >
                    <div
                        className="relative bg-white rounded-lg w-100 max-w-[90vw]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-full h-10 rounded-t-lg bg-primary text-white flex items-center justify-between px-5">
                            <p className="font-semibold">Export Feedbacks</p>
                            <button onClick={handleCloseExportModal}>
                                <i className="fa-solid fa-x text-sm text-white" />
                            </button>
                        </div>

                        <div className="p-4">
                            <div className="flex flex-col gap-2 mb-4">
                                <p className="text-sm font-semibold text-[#1A1208]">Export Scope</p>
                                <label className="flex items-center gap-2 text-sm text-[#1A1208] cursor-pointer select-none">
                                    <input
                                        type="radio"
                                        name="feedback-export-scope"
                                        checked={exportScope === "filtered"}
                                        onChange={() => setExportScope("filtered")}
                                        className="accent-primary cursor-pointer"
                                    />
                                    Current Filtered View ({visibleReviews.length} Item{visibleReviews.length === 1 ? "" : "s"})
                                </label>
                                <label className="flex items-center gap-2 text-sm text-[#1A1208] cursor-pointer select-none">
                                    <input
                                        type="radio"
                                        name="feedback-export-scope"
                                        checked={exportScope === "all"}
                                        onChange={() => setExportScope("all")}
                                        className="accent-primary cursor-pointer"
                                    />
                                    All Items (All Time)
                                </label>
                                {noReviewsToExport && (
                                    <p className="text-xs text-[#C0392B]">No items match the current filters.</p>
                                )}
                            </div>

                            <div className="flex flex-col gap-2 mb-4">
                                <label className="text-sm font-medium text-[#1A1208]">Format</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setExportFormat("pdf")}
                                        className={`px-4 py-1.5 rounded-md text-sm font-medium border transition-transform active:scale-95
                                            ${exportFormat === "pdf" ? "bg-primary text-white border-primary" : "bg-white text-[#6B5C42] border-[#DDD9CF]"}`}
                                    >
                                        PDF
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setExportFormat("csv")}
                                        className={`px-4 py-1.5 rounded-md text-sm font-medium border transition-transform active:scale-95
                                            ${exportFormat === "csv" ? "bg-primary text-white border-primary" : "bg-white text-[#6B5C42] border-[#DDD9CF]"}`}
                                    >
                                        CSV
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    className="flex-1 h-10 bg-white border border-primary rounded-lg text-primary text-sm font-medium
                                        transition-transform duration-100 active:scale-95"
                                    onClick={handleCloseExportModal}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="flex-1 h-10 bg-primary rounded-lg text-white text-sm font-medium
                                        transition-transform duration-100 enabled:active:scale-95
                                        disabled:opacity-40 disabled:cursor-not-allowed"
                                    disabled={noReviewsToExport}
                                    onClick={handleExport}
                                >
                                    Export
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}