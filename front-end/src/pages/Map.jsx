import { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { useSearchParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import AppHeader from "../user-native/AppHeader";
import Icon from "../user-native/Icon";
import AlertDialog from "../components/AlertDialog";
import useSheetDrag from "../user-native/useSheetDrag";

const API_URL = import.meta.env.VITE_API_URL;

// Same tiles and campus centre as the native app (features/map/mapStyle.js)
const GOOGLE_HYBRID_TILE_URL = "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";
const BULSU_CENTER = [14.8582, 120.8142];
const MARKER_COLOR = "#D32F2F";
// The map can't be panned or zoomed out beyond the BulSU main campus (+ a small margin)
const CAMPUS_BOUNDS = [
  [14.8535, 120.8085], // south-west
  [14.863, 120.82], // north-east
];

const escapeHtml = (text) =>
  String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// OfficeMarkerPin of the native app as a Leaflet DivIcon, anchored at the bottom centre
const createMarkerIcon = (label) =>
  new L.DivIcon({
    className: "",
    html: `
    <div style="position:absolute; transform:translate(-50%, -100%); display:flex; flex-direction:column; align-items:center; cursor:pointer; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));">
      <div style="padding:5px 8px; border-radius:8px; border:1.5px solid #FFFFFF; background-color:${MARKER_COLOR}; color:#FFFFFF; font-size:11px; font-weight:900; white-space:nowrap; text-shadow:0 1px 1px rgba(0,0,0,0.3);">
        ${escapeHtml(label)}
      </div>
      <div style="width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-top:8px solid ${MARKER_COLOR}; margin-top:-1.5px;"></div>
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

// Keeps the view inside CAMPUS_BOUNDS: the minimum zoom is the smallest one at which the
// current map size still fits inside the bounds, so wide desktop maps can't show outside it.
function CampusLimit() {
  const map = useMap();

  useEffect(() => {
    const apply = () => map.setMinZoom(map.getBoundsZoom(CAMPUS_BOUNDS, true));
    apply();
    map.on("resize", apply);
    return () => map.off("resize", apply);
  }, [map]);

  return null;
}

function FlyToOffice({ office }) {
  const map = useMap();

  useEffect(() => {
    if (office) {
      map.flyTo([office.lat, office.lng], 19, { duration: 1.5 });
    }
  }, [office, map]);

  return null;
}

function OfficeBanner({ office }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUri = typeof office.image_url === "string" ? office.image_url.trim() : "";

  useEffect(() => {
    setImageFailed(false);
  }, [office.office_id, imageUri]);

  return (
    <div className="relative w-full h-[180px] overflow-hidden bg-black/[0.08]">
      {imageUri && !imageFailed ? (
        <>
          <img
            src={imageUri}
            alt={office.office_name}
            onError={() => setImageFailed(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex flex-col justify-end bg-black/45 p-3 z-[2]">
            <p className="text-white font-bold text-[16px]">{office.floor}</p>
            <p className="text-white font-medium text-sm mt-1">Hours: {office.operating_hours}</p>
          </div>
        </>
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: office.color || "#8B0000" }}
        >
          <p className="text-[22px] font-extrabold text-white">No Image Available</p>
        </div>
      )}
    </div>
  );
}

const formatReviewDate = (dateString) => {
  if (!dateString) return "Recently";
  return new Date(dateString).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

export default function Map() {
  const user_id = localStorage.getItem("user_id");
  const [searchParams, setSearchParams] = useSearchParams();
  const focusOfficeId = searchParams.get("officeId");

  // From lg up the office details open as a side panel (like Google Maps) instead of a bottom sheet
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const [offices, setOffices] = useState([]);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [flyToOffice, setFlyToOffice] = useState(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [myReview, setMyReview] = useState(null);
  const [initialRating, setInitialRating] = useState(0);
  const [initialText, setInitialText] = useState("");
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmUpdate, setConfirmUpdate] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [sheetShown, setSheetShown] = useState(false);
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);

  // search bar state (useOfficeSearch of the native app)
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredOffices, setFilteredOffices] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const scrollRef = useRef(null);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

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
              lat: office.latitude ? Number(office.latitude) : BULSU_CENTER[0],
              lng: office.longitude ? Number(office.longitude) : BULSU_CENTER[1],
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
        const list = Array.isArray(data) ? data : data.reviews || [];
        setReviews(list.filter((r) => !r.is_archived));
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
        setInitialRating(data.rating || 0);
        setInitialText(data.review_text || "");
      } else {
        setMyReview(null);
        setRating(0);
        setReviewText("");
        setInitialRating(0);
        setInitialText("");
      }
    } catch (err) {
      console.error(err);
      setMyReview(null);
    }
  }, [user_id]);

  const openOffice = (office) => {
    setSelectedOffice(office);
    setSheetShown(false);
    requestAnimationFrame(() => setSheetShown(true));
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
      openOffice(office);
      setFlyToOffice(office);
    }

    searchParams.delete("officeId");
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offices, focusOfficeId]);

  const handleClose = useCallback(() => {
    setSelectedOffice(null);
    setReviews([]);
    setMyReview(null);
    setRating(0);
    setReviewText("");
  }, []);

  const closeSheet = () => {
    setSheetShown(false);
    setTimeout(handleClose, 200);
  };

  const { dragY, dragging, handlers } = useSheetDrag(closeSheet);

  // Reads the server's message from a failed response so the user sees why
  const failureMessage = async (res, fallback) => {
    const data = await res.json().catch(() => ({}));
    return data.message || fallback;
  };

  const isEditing = !!myReview;
  const isChanged = rating !== initialRating || reviewText.trim() !== initialText.trim();
  const canSubmit = isEditing ? isChanged && rating > 0 : rating > 0;

  // A new review posts straight away; changing an existing one asks first
  const handleSubmitPress = () => {
    if (!online) {
      setAlertMessage("You are currently offline. Cannot post review.");
      return;
    }
    if (!canSubmit) return;
    if (myReview) setConfirmUpdate(true);
    else handlePostReview();
  };

  const handlePostReview = async () => {
    setConfirmUpdate(false);
    if (!online) {
      setAlertMessage("You are currently offline. Cannot post review.");
      return;
    }
    // A star rating is enough; the comment is optional (same as the mobile app)
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      if (myReview) {
        const res = await fetchWithAuth(`${API_URL}/api/reviews/${myReview.review_id}`, {
          method: "PUT",
          body: JSON.stringify({ rating, review_text: reviewText.trim() }),
        });
        if (res.ok) {
          setAlertMessage("Your review has been updated!");
          fetchMyReview(selectedOffice.office_id);
          fetchReviews(selectedOffice.office_id);
        } else {
          setAlertMessage(await failureMessage(res, "Failed to submit review."));
        }
      } else {
        const res = await fetchWithAuth(`${API_URL}/api/offices/${selectedOffice.office_id}/reviews`, {
          method: "POST",
          body: JSON.stringify({ user_id, rating, review_text: reviewText.trim() }),
        });
        if (res.ok) {
          setAlertMessage("Your review has been posted!");
          fetchMyReview(selectedOffice.office_id);
          fetchReviews(selectedOffice.office_id);
        } else {
          setAlertMessage(await failureMessage(res, "Failed to submit review."));
        }
      }
    } catch (err) {
      console.error(err);
      setAlertMessage("Could not connect to the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    setConfirmDelete(false);
    if (!myReview) return;
    if (!online) {
      setAlertMessage("You are currently offline. Cannot delete review.");
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/api/reviews/${myReview.review_id}`, {
        method: "DELETE",
        body: JSON.stringify({ user_id }),
      });
      if (res.ok) {
        setAlertMessage("Your review has been deleted.");
        setMyReview(null);
        setRating(0);
        setReviewText("");
        setInitialRating(0);
        setInitialText("");
        fetchReviews(selectedOffice.office_id);
      } else {
        setAlertMessage(await failureMessage(res, "Failed to delete review."));
      }
    } catch (err) {
      console.error(err);
      setAlertMessage("Could not connect to the server. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews).toFixed(1) : "0.0";
  const barWidth = (star) => (totalReviews === 0 ? "0%" : `${(reviews.filter((r) => r.rating === star).length / totalReviews) * 100}%`);

  /* ------------------------------ search bar ------------------------------ */

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text) {
      setFilteredOffices(offices.filter((o) => o.office_name.toLowerCase().includes(text.toLowerCase())));
      setDropdownVisible(true);
    } else {
      setFilteredOffices([]);
      setDropdownVisible(false);
    }
  };

  const toggleDropdown = () => {
    if (dropdownVisible) {
      setDropdownVisible(false);
      return;
    }
    setFilteredOffices(
      searchQuery.trim() === ""
        ? offices
        : offices.filter((o) => o.office_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setDropdownVisible(true);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setFilteredOffices([]);
    setDropdownVisible(false);
  };

  const selectFromDropdown = (office) => {
    setFlyToOffice({ ...office });
    setSearchQuery(office.office_name);
    setDropdownVisible(false);
    openOffice(office);
  };

  return (
    <div>
      <AppHeader title="Map" />

      <div data-fullbleed className="relative w-full h-[calc(100dvh-57px-70px)] lg:h-[calc(100dvh-57px)]">
        {/* Search overlay */}
        <div className={`absolute top-10 inset-x-5 z-[1000] lg:top-6 lg:right-auto lg:w-[440px] ${selectedOffice ? "lg:left-[452px]" : "lg:left-6"}`}>
          <div
            className="flex items-center bg-white rounded-lg pl-3"
            style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.15)" }}
          >
            <input
              type="text"
              placeholder="Search for a Drop-off location..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => {
                if (searchQuery) setDropdownVisible(true);
              }}
              className="flex-1 min-w-0 py-3 text-[15px] text-black bg-transparent outline-none placeholder:text-[#888]"
            />

            {searchQuery.length > 0 && (
              <button type="button" onClick={clearSearch} aria-label="Clear search" className="p-2.5 flex items-center justify-center">
                <Icon name="close-circle" size={20} color="#888" />
              </button>
            )}

            <button type="button" onClick={toggleDropdown} aria-label="Toggle list" className="p-2.5 flex items-center justify-center">
              <Icon name={dropdownVisible ? "chevron-up" : "chevron-down"} size={22} color="#888" />
            </button>
          </div>

          {dropdownVisible && filteredOffices.length > 0 && (
            <div
              className="bg-white rounded-lg mt-2 max-h-[220px] overflow-y-auto"
              style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.15)" }}
            >
              {filteredOffices.map((office) => (
                <button
                  key={office.office_id}
                  type="button"
                  onClick={() => selectFromDropdown(office)}
                  className="block w-full text-left p-[15px] text-[14px] text-[#333]"
                >
                  {office.office_name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <MapContainer
          center={BULSU_CENTER}
          zoom={17}
          minZoom={15}
          maxZoom={20}
          maxBounds={CAMPUS_BOUNDS}
          maxBoundsViscosity={1.0}
          className="h-full w-full z-0"
          zoomControl={false}
        >
          <TileLayer url={GOOGLE_HYBRID_TILE_URL} maxZoom={20} />
          <CampusLimit />
          <MapClickHandler onMapClick={() => setDropdownVisible(false)} />
          <FlyToOffice office={flyToOffice} />

          {/* Office Markers */}
          {offices.map((office) => (
            <Marker
              key={office.office_id}
              position={[office.lat, office.lng]}
              icon={createMarkerIcon(office.office_name)}
              eventHandlers={{
                click: () => openOffice(office),
              }}
            />
          ))}
        </MapContainer>
      </div>

      {/* Office details sheet (OfficeModal of the native app) */}
      {selectedOffice && (
        <div className="fixed inset-0 z-[4500] lg:pointer-events-none">
          <div
            onClick={closeSheet}
            className="absolute inset-0 bg-black/40 transition-opacity duration-200 lg:hidden"
            style={{ opacity: sheetShown ? 1 : 0 }}
          />

          <div className="absolute inset-x-0 bottom-0 max-w-3xl mx-auto lg:inset-x-auto lg:left-[256px] lg:top-[73px] lg:bottom-4 lg:w-[420px] lg:max-w-none lg:mx-0 lg:pointer-events-auto">
            <div
              className="bg-white rounded-t-[24px] lg:rounded-2xl lg:shadow-[0_2px_14px_rgba(0,0,0,0.3)] overflow-hidden h-[85vh] lg:h-full flex flex-col"
              style={{
                transform: isDesktop
                  ? sheetShown
                    ? "translateX(0)"
                    : "translateX(calc(-100% - 280px))"
                  : sheetShown
                    ? `translateY(${dragY}px)`
                    : "translateY(100%)",
                transition: dragging ? "none" : "transform 260ms ease-out",
              }}
            >
              <div {...(isDesktop ? {} : handlers)} className="w-full bg-white shrink-0 touch-none cursor-grab lg:cursor-default lg:touch-auto">
                <div className="w-10 h-1 bg-[#DDDDDD] rounded-sm mx-auto mt-2.5 lg:hidden" />
                <div className="flex items-center px-4 py-3 gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-bold text-primary line-clamp-2">{selectedOffice.office_name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeSheet}
                    onPointerDown={(e) => e.stopPropagation()}
                    aria-label="Close"
                    className="p-1"
                  >
                    <span className="text-[18px] text-primary font-bold">✕</span>
                  </button>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto pb-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <OfficeBanner office={selectedOffice} />

                <div className="p-4 flex flex-col">
                  <p className="text-[14px] leading-5 text-[#1a1a1a]">{selectedOffice.description}</p>

                  <div className="h-px bg-black/[0.08] my-5" />

                  <div className="flex items-center">
                    <div className="flex flex-col items-center mr-5">
                      <p className="text-[48px] font-bold">{averageRating}</p>
                      <p className="text-[12px]">⭐⭐⭐⭐⭐</p>
                      <p className="text-[12px] text-[#666]">({totalReviews})</p>
                    </div>
                    <div className="flex-1 h-[60px] flex flex-col justify-between">
                      {[5, 4, 3, 2, 1].map((star) => (
                        <div key={star} className="h-1.5 bg-[#EEEEEE] rounded-[3px] overflow-hidden">
                          <div className="h-full bg-[#FFD700]" style={{ width: barWidth(star) }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-black/[0.08] my-5" />

                  {/* Rate and review */}
                  <div style={{ pointerEvents: online ? "auto" : "none" }}>
                    <div className="flex items-center justify-between mb-2.5">
                      <p className={`text-[16px] font-bold ${online ? "" : "text-[#888888]"}`}>
                        {isEditing ? "Edit Your Review" : "Rate and Review"}
                      </p>

                      {isEditing &&
                        (isDeleting ? (
                          <div className="p-1">
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(true)}
                            disabled={isSubmitting || loadingReviews || !online}
                            aria-label="Delete your review"
                            className="p-1"
                          >
                            <Icon name="trash-outline" size={22} color={online ? "#8B0000" : "#A0A0A0"} />
                          </button>
                        ))}
                    </div>

                    <div className={`flex justify-around mb-4 px-5 ${online ? "" : "opacity-50"}`}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          disabled={loadingReviews || !online}
                          aria-label={`${star} star${star > 1 ? "s" : ""}`}
                        >
                          <span
                            className="text-[32px] leading-[38px]"
                            style={{ color: rating >= star ? "#FFD700" : online ? "#CCCCCC" : "#D0D0D0" }}
                          >
                            ★
                          </span>
                        </button>
                      ))}
                    </div>

                    <textarea
                      placeholder="Tell others about your experience at this office."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      disabled={loadingReviews || !online}
                      className={`w-full h-[100px] border rounded-lg p-3 text-[14px] resize-none outline-none block ${
                        loadingReviews || !online
                          ? "bg-[#EFEFEF] border-[#E0E0E0] text-[#888888] placeholder:text-[#A0A0A0]"
                          : "bg-[#FAFAFA] border-[#DDDDDD] placeholder:text-[#999]"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={handleSubmitPress}
                      disabled={isSubmitting || isDeleting || loadingReviews || !online || !canSubmit}
                      className={`w-full p-3 rounded-lg flex items-center justify-center mt-3 ${
                        !online || !canSubmit
                          ? "bg-[#D6D6D6] opacity-70"
                          : "bg-primary"
                      }`}
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className={`text-[14px] font-bold ${!canSubmit ? "text-[#7A7A7A]" : "text-white"}`}>
                          {isEditing ? "Update Review" : "Post Review"}
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="h-px bg-black/[0.08] my-5" />

                  <p className="text-[16px] font-bold mb-2.5">Reviews</p>

                  {loadingReviews ? (
                    <div className="flex justify-center mt-5">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : reviews.length > 0 ? (
                    reviews.map((review) => {
                      const reviewerName = review.first_name
                        ? `${review.first_name} ${review.last_name}`
                        : review.email || "Anonymous";

                      return (
                        <div key={review.review_id} className="mt-2.5">
                          <div className="flex items-center mb-2">
                            <div className="w-9 h-9 rounded-full bg-[#A0A0FF] mr-2.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[14px]">{reviewerName}</p>
                              <p className="text-[10px]">{"⭐".repeat(review.rating || 0)}</p>
                            </div>
                            <p className="text-[10px] text-[#888]">{formatReviewDate(review.created_at)}</p>
                          </div>
                          <p className="text-[14px] text-[#333] leading-5">{review.review_text || "No comment provided."}</p>

                          {review.response_text ? (
                            <div className="mt-2 ml-4 p-2.5 rounded-lg bg-[#F2F2F2]">
                              <p className="text-[12px] font-bold text-primary mb-1">Response from {selectedOffice.office_name}</p>
                              <p className="text-[13px] text-[#333] leading-[18px]">{review.response_text}</p>
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-[#888] mt-5 italic">No reviews yet. Be the first to review!</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmUpdate && (
        <AlertDialog
          message="Update your review with these changes?"
          b1Label="Cancel"
          b2Label="Update"
          b1OnClick={() => setConfirmUpdate(false)}
          b2OnClick={handlePostReview}
        />
      )}

      {confirmDelete && (
        <AlertDialog
          message="Delete your review? This cannot be undone."
          b1Label="Cancel"
          b2Label="Delete"
          b1OnClick={() => setConfirmDelete(false)}
          b2OnClick={handleDeleteReview}
        />
      )}

      {alertMessage && (
        <AlertDialog message={alertMessage} b1Label="OK" b1OnClick={() => setAlertMessage(null)} />
      )}
    </div>
  );
}
