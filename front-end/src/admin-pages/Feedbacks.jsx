import { useEffect, useState } from "react";
import { Eye, X } from "lucide-react";
import { fetchWithAuth } from "../utils/fetchWithAuth";

export default function Feedbacks() {
    const API_URL = import.meta.env.VITE_API_URL;
    const officeId = localStorage.getItem("office_location");

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReview, setSelectedReview] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

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

    const totalPages = Math.max(1, Math.ceil(reviews.length / itemsPerPage));
    const activePage = Math.min(currentPage, totalPages);
    const startIndex = (activePage - 1) * itemsPerPage;
    const paginatedReviews = reviews.slice(startIndex, startIndex + itemsPerPage);

    return (
        <>
            <div className="min-h-screen w-full bg-[#F5F5F5] px-5 pt-5 xl:px-10 xl:pt-7 flex flex-col gap-3">
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
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                        review.is_read
                                                            ? "bg-gray-100 text-gray-600"
                                                            : "bg-yellow-50 text-yellow-700 border border-yellow-300"
                                                    }`}
                                                >
                                                    {review.is_read ? "Read" : "New"}
                                                </span>
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

                <div className="flex items-center justify-between bg-white border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] rounded-b-xl px-4 py-3 text-xs mt-1">
                    <p className="text-[#6B5C42]">
                        Showing {reviews.length === 0 ? 0 : startIndex + 1}
                        {" - "}
                        {Math.min(startIndex + itemsPerPage, reviews.length)}
                        {" of "}
                        {reviews.length}
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

            {/* View Feedback Modal */}
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

                            {/* Date */}
                            <p className="text-xs text-gray-400">
                                Submitted: {formatDateTime(selectedReview.created_at)}
                            </p>

                            <hr className="border-gray-200" />

                            {/* Respond section */}
                            <p className="font-semibold text-[#4B2D23]">Respond to Feedback</p>
                            <button className="flex items-center gap-2 bg-primary text-white px-4 py-3 rounded-lg text-sm font-medium w-fit hover:opacity-90 transition active:scale-95">
                                <i className="fa-regular fa-paper-plane"></i>
                                Send Response
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}