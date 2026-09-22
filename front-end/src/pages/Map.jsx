import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { useSearchParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchWithAuth } from "../utils/fetchWithAuth";

const API_URL = import.meta.env.VITE_API_URL;

const createMarkerIcon = (label) =>
  new L.DivIcon({
    className: "",
    html: `
    <div style="position:absolute; transform:translate(-50%, -100%); display:flex; flex-direction:column; align-items:center;">
      <div style="background:#990000; color:white; font-size:10px; font-weight:600; padding:3px 8px; border-radius:20px; white-space:nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
        ${label}
      </div>
      <div style="width:0; height:0; border-left:8px solid transparent; border-right:8px solid transparent; border-top:10px solid #990000; margin-top:-1px;"></div>
    </div>
  `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });

const bulsuIcon = new L.DivIcon({
  className: "",
  html: `
    <div style="position:absolute; transform:translate(-50%, -50%); background:white; color:#990000; font-size:11px; font-weight:700; padding:4px 10px; border-radius:20px; white-space:nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 1.5px solid #990000;">
      Bulacan State University Main Campus
    </div>
  `,
  iconSize: [0, 0],
  iconAnchor: [0, 0],
});

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: () => onMapClick(),
  });
  return null;
}

function FlyToOffice({ office }) {
  const map = useMap();

  useEffect(() => {
    if (office) {
      map.flyTo([office.lat, office.lng], 19, { duration: 1 });
    }
  }, [office, map]);

  return null;
}

export default function Map() {
  const user_id = localStorage.getItem("user_id");
  const [searchParams, setSearchParams] = useSearchParams();
  const focusOfficeId = searchParams.get("officeId");

  const [offices, setOffices] = useState([]);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [flyToOffice, setFlyToOffice] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [myReview, setMyReview] = useState(null);
  const [toast, setToast] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [officeSearch, setOfficeSearch] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("Search for a Drop-off location...");
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showDeleteReviewModal, setShowDeleteReviewModal] = useState(false);
  const [deletingReview, setDeletingReview] = useState(false);

  // Fetch offices from backend
  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const res = await fetch(`${API_URL}/api/offices`);
        const data = await res.json();
        if (res.ok) {
          const mapped = data
            .filter((office) => office.status !== false)
            .map((office) => ({
              ...office,
              lat: office.latitude ? Number(office.latitude) : 14.8574,
              lng: office.longitude ? Number(office.longitude) : 120.8146,
            }));
          setOffices(mapped);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchOffices();
  }, []);

  // Fetch ALL reviews for the selected office
  const fetchReviews = useCallback(async (officeId) => {
    setLoadingReviews(true);
    try {
      const res = await fetch(`${API_URL}/api/offices/${officeId}/reviews`);
      const data = await res.json();
      if (res.ok) {
        setReviews(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  // Fetch the CURRENT user's own review for the selected office (if any)
  const fetchMyReview = useCallback(async (officeId) => {
    try {
      const res = await fetch(`${API_URL}/api/offices/${officeId}/reviews/mine?user_id=${user_id}`);
      const data = await res.json();
      if (res.ok && data) {
        setMyReview(data);
        setRating(data.rating);
        setReviewText(data.review_text || "");
      } else {
        setMyReview(null);
        setRating(0);
        setReviewText("");
      }
    } catch (err) {
      console.error(err);
      setMyReview(null);
    }
  }, [user_id]);

  const handleMarkerClick = (office) => {
    setSelectedOffice(office);
    fetchMyReview(office.office_id);
    fetchReviews(office.office_id);
  };

  // "View Office Location" quick link (e.g. from Found Item Details) lands
  // here as /map?officeId=X — once offices are loaded, jump straight to that
  // office's pin and open its info sheet, same as clicking the marker.
  useEffect(() => {
    if (!focusOfficeId || offices.length === 0) return;

    const office = offices.find((o) => String(o.office_id) === String(focusOfficeId));
    if (office) {
      handleMarkerClick(office);
      setSelectedLabel(office.office_name);
      setFlyToOffice(office);
    }

    searchParams.delete("officeId");
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offices, focusOfficeId]);

  const handleClose = () => {
    setSelectedOffice(null);
    setReviews([]);
    setMyReview(null);
  };

const handlePostReview = async () => {
    if (rating === 0) return;

    try {
      if (myReview) {
        const res = await fetchWithAuth(`${API_URL}/api/reviews/${myReview.review_id}`, {
          method: "PUT",
          body: JSON.stringify({ rating, review_text: reviewText }),
        });
        if (res.ok) {
          setToast("Review updated. Thank you for your feedback!");
          setTimeout(() => setToast(null), 3000);
          fetchMyReview(selectedOffice.office_id);
          fetchReviews(selectedOffice.office_id);
        }
      } else {
        if (reviewText.trim() === "") return;
        const res = await fetchWithAuth(`${API_URL}/api/offices/${selectedOffice.office_id}/reviews`, {
          method: "POST",
          body: JSON.stringify({ user_id, rating, review_text: reviewText }),
        });
        if (res.ok) {
          setRating(0);
          setReviewText("");
          setToast("Review posted. Thank you for your feedback!");
          setTimeout(() => setToast(null), 3000);
          fetchMyReview(selectedOffice.office_id);
          fetchReviews(selectedOffice.office_id);
        }
      }
    } catch (err) {
      console.error(err);
    }
};

  const hasReviewChanges = myReview
    ? rating !== myReview.rating || reviewText !== (myReview.review_text || "")
    : true;

  const handleDeleteReview = async () => {
    if (!myReview) return;
    setDeletingReview(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/api/reviews/${myReview.review_id}`, {
        method: "DELETE",
        body: JSON.stringify({ user_id }),
      });
      if (res.ok) {
        setToast("Review deleted.");
        setTimeout(() => setToast(null), 3000);
        setMyReview(null);
        setRating(0);
        setReviewText("");
        fetchReviews(selectedOffice.office_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingReview(false);
      setShowDeleteReviewModal(false);
    }
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return "0.0";
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const getRatingBarWidth = (star) => {
    if (reviews.length === 0) return "0%";
    const count = reviews.filter((r) => r.rating === star).length;
    return `${(count / reviews.length) * 100}%`;
  };

  const getUserLabel = (review) => {
    if (review.first_name && review.last_name) {
      return `${review.first_name} ${review.last_name}`;
    }
    return review.email?.split("@")[0] || "User";
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 3.5rem)" }}>

      {/* Custom Dropdown */}
      <div className="absolute top-17 left-0 right-0 z-[1000] px-3">
        <div className="relative">
          <button
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setOfficeSearch("");
            }}
            className="w-full px-4 py-2 rounded-lg bg-white shadow-md text-sm text-gray-600 border border-gray-200 outline-none flex justify-between items-center"
          >
            <span className="truncate">{selectedLabel}</span>
            <span className="ml-2 text-gray-400">▾</span>
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-[1001] overflow-hidden">
              <div className="p-2 border-b border-gray-100">
                <input
                  type="text"
                  autoFocus
                  value={officeSearch}
                  onChange={(e) => setOfficeSearch(e.target.value)}
                  placeholder="Search centers..."
                  className="w-full px-3 py-2 rounded-md bg-gray-50 border border-gray-200 text-sm text-gray-700 outline-none focus:border-[#990000]"
                />
              </div>
              <div className="max-h-60 overflow-y-auto">
                {offices
                  .filter((office) =>
                    office.office_name
                      .toLowerCase()
                      .includes(officeSearch.trim().toLowerCase())
                  )
                  .map((office) => (
                    <button
                      key={office.office_id}
                      onClick={() => {
                        handleMarkerClick(office);
                        setSelectedLabel(office.office_name);
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-100 last:border-none"
                    >
                      {office.office_name}
                    </button>
                  ))}
                {offices.filter((office) =>
                  office.office_name
                    .toLowerCase()
                    .includes(officeSearch.trim().toLowerCase())
                ).length === 0 && (
                  <p className="px-4 py-3 text-sm text-gray-400 text-center">
                    No centers found.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={[14.8574, 120.8146]}
        zoom={17}
        minZoom={16}
        maxZoom={19}
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles © Esri"
          maxZoom={19}
        />
        <MapClickHandler onMapClick={handleClose} />
        <FlyToOffice office={flyToOffice} />

        {/* BulSU Label */}
        <Marker
          position={[14.8574, 120.8146]}
          icon={bulsuIcon}
          interactive={false}
        />

        {/* Office Markers */}
        {offices.map((office) => (
          <Marker
            key={office.office_id}
            position={[office.lat, office.lng]}
            icon={createMarkerIcon(office.office_name)}
            eventHandlers={{
              click: () => {
                handleMarkerClick(office);
                setSelectedLabel(office.office_name);
              },
            }}
          />
        ))}
      </MapContainer>

      {/* Bottom Sheet */}
      {selectedOffice && (
        <div className="absolute bottom-0 left-0 right-0 z-[500] bg-white rounded-t-2xl shadow-lg max-h-[75vh] overflow-y-auto pb-4">

          {/* Office Name + Close */}
          <div className="flex justify-between items-center px-4 pt-4 pb-2">
            <p className="font-semibold text-sm text-[#990000]">
              {selectedOffice.office_name} FoundNest Office
            </p>
            <button onClick={handleClose}>
              <span className="text-gray-500 text-lg font-bold">✕</span>
            </button>
          </div>

          {/* Image with overlaid text */}
          <div className="relative w-full h-44">
            {selectedOffice.image_url ? (
              <img
                src={selectedOffice.image_url}
                alt={selectedOffice.office_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                <p className="text-gray-500 text-sm">No image available</p>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black/30 px-4 py-2">
              <p className="text-white text-xs font-medium">{selectedOffice.floor || "—"}</p>
              <p className="text-white text-xs">
                Operating Hours: {selectedOffice.operating_hours || "—"}
              </p>
            </div>
          </div>

          {/* Rating Section */}
          <div className="px-4 pt-4 flex gap-4 items-start">
            <div className="flex flex-col items-start">
              <p className="text-4xl font-bold text-[#4B2D23]">
                {getAverageRating()}
              </p>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-lg ${
                      star <= Math.round(getAverageRating())
                        ? "text-[#FFD700]"
                        : "text-gray-300"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-400">({reviews.length})</p>
            </div>

            <div className="flex-1 flex flex-col gap-1.5 pt-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: getRatingBarWidth(star),
                        backgroundColor: star === 5 ? "#FFD700" : "#D9D9D9",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rate and Review */}
          <div className="px-4 pt-4">
            <p className="font-semibold text-sm mb-3">
              {myReview ? "Edit Your Review" : "Rate and Review"}
            </p>

            <div className="flex gap-2 mb-3 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-3xl cursor-pointer ${
                    star <= (hoverRating || rating)
                      ? "text-[#FFD700]"
                      : "text-gray-300"
                  }`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  ★
                </span>
              ))}
            </div>

            <textarea
              placeholder="Tell others about your experience."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-xs text-gray-600 outline-none resize-none h-24"
            />

            {myReview && !hasReviewChanges ? (
              <button
                onClick={() => setShowDeleteReviewModal(true)}
                className="w-full py-3 rounded-full text-sm font-semibold mt-2 border-2"
                style={{ borderColor: "#990000", color: "#990000", cursor: "pointer" }}
              >
                Delete Review
              </button>
            ) : (
              <button
                onClick={handlePostReview}
                disabled={rating === 0}
                className="w-full py-3 rounded-full text-sm font-semibold mt-2"
                style={{
                  backgroundColor: rating > 0 ? "#990000" : "rgba(75, 45, 35, 0.3)",
                  color: "white",
                  cursor: rating > 0 ? "pointer" : "default",
                }}
              >
                {myReview ? "Update Review" : "Post"}
              </button>
            )}
          </div>

          {/* Reviews List */}
          <div className="px-4 pt-4 pb-8">
            {loadingReviews ? (
              <div className="flex justify-center py-4">
                <div className="w-8 h-8 border-4 border-[#990000] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                No reviews yet. Be the first to review!
              </p>
            ) : (
              reviews.map((review) => (
                <div key={review.review_id} className="flex gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-[#990000] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {getUserLabel(review).slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-semibold">{getUserLabel(review)}</p>
                      <p className="text-xs text-gray-400">{formatTime(review.created_at)}</p>
                    </div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-xs ${
                            star <= review.rating
                              ? "text-[#FFD700]"
                              : "text-gray-300"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{review.review_text}</p>

                    {review.response_text && (
                      <div className="mt-2 ml-1 pl-3 border-l-2 border-[#990000] bg-[#FFF3E0] rounded-r-lg py-2 pr-2">
                        <p className="text-xs font-semibold text-[#990000]">
                          Reply from {selectedOffice.office_name}
                          {review.responded_by_name?.trim() ? ` · ${review.responded_by_name}` : ""}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">{review.response_text}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Delete Review Confirmation */}
      {showDeleteReviewModal && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/50 px-8">
          <div className="bg-white rounded-2xl overflow-hidden w-full max-w-sm">
            <div className="px-6 py-6">
              <p className="text-[#4B2D23] font-bold text-base text-center">
                Delete your review? This cannot be undone.
              </p>
            </div>
            <div className="flex border-t border-gray-200">
              <button
                onClick={() => setShowDeleteReviewModal(false)}
                disabled={deletingReview}
                className="flex-1 py-4 text-sm font-semibold text-[#4B2D23] border-r border-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReview}
                disabled={deletingReview}
                className="flex-1 py-4 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: "#990000" }}
              >
                {deletingReview ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

     {/* Toast */}
{toast && (
    <div className="fixed bottom-20 left-4 right-4 z-[2000] bg-[#990000] rounded-full px-4 py-3 flex items-center gap-3 shadow-lg ">
      <span className="text-white text-sm">ℹ️</span>
      <p className="text-xs text-white font-medium whitespace-nowrap overflow-hidden text-ellipsis">
        {toast}
      </p>
    </div>
)}
    </div>
  );
}