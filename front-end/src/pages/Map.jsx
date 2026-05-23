import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import alvarado from "../assets/Alvarado.png";
import pimentel from "../assets/pimentel.png";

const offices = [
  {
    id: 1,
    name: "Alvarado Hall FoundNest Office",
    floor: "2nd Floor, Room A",
    hours: "10 AM - 5 PM",
    image: alvarado,
    lat: 14.857737666695048,
    lng: 120.81587817292802,
  },
  {
    id: 2,
    name: "Pimentel Hall FoundNest Office",
    floor: "3rd Floor, Room B",
    hours: "10 AM - 5 PM",
    image: pimentel,
    lat: 14.857156697428334,
    lng: 120.81330699766315,
  },
];

const createMarkerIcon = (label) =>
  new L.DivIcon({
    className: "",
    html: `
    <div style="display:flex; flex-direction:column; align-items:center;">
      <div style="background:#990000; color:white; font-size:10px; font-weight:600; padding:3px 8px; border-radius:20px; white-space:nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
        ${label}
      </div>
      <div style="width:0; height:0; border-left:8px solid transparent; border-right:8px solid transparent; border-top:10px solid #990000; margin-top:-1px;"></div>
    </div>
  `,
    iconAnchor: [50, 42],
  });

const bulsuIcon = new L.DivIcon({
  className: "",
  html: `
    <div style="background:white; color:#990000; font-size:11px; font-weight:700; padding:4px 10px; border-radius:20px; white-space:nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 1.5px solid #990000;">
      Bulacan State University Main Campus
    </div>
  `,
  iconAnchor: [130, 10],
});

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: () => onMapClick(),
  });
  return null;
}

export default function Map() {
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [toast, setToast] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(
    "Search for a Drop-off location...",
  );
  const [reviews, setReviews] = useState([
    {
      id: 1,
      officeId: 1,
      user: "2023100450",
      rating: 5,
      text: "Office was easy to find, the map pins in the...",
      time: "1 hour ago",
    },
    {
      id: 2,
      officeId: 2,
      user: "2023100464",
      rating: 5,
      text: "The process was very smooth. No long lines.",
      time: "1 hour ago",
    },
  ]);

  const handleMarkerClick = (office) => {
    setSelectedOffice(office);
    setRating(0);
    setReviewText("");
  };

  const handleClose = () => {
    setSelectedOffice(null);
  };

  const handlePostReview = () => {
    if (rating === 0 || reviewText.trim() === "") return;
    const newReview = {
      id: reviews.length + 1,
      officeId: selectedOffice.id,
      user: "2023100464",
      rating,
      text: reviewText,
      time: "1 sec ago",
    };
    setReviews([...reviews, newReview]);
    setRating(0);
    setReviewText("");
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  const getAverageRating = (officeId) => {
    const officeReviews = reviews.filter((r) => r.officeId === officeId);
    if (officeReviews.length === 0) return "0.0";
    const sum = officeReviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / officeReviews.length).toFixed(1);
  };

  const getOfficeReviews = (officeId) =>
    reviews.filter((r) => r.officeId === officeId);

  const getRatingBarWidth = (officeId, star) => {
    const officeReviews = getOfficeReviews(officeId);
    if (officeReviews.length === 0) return "0%";
    const count = officeReviews.filter((r) => r.rating === star).length;
    return `${(count / officeReviews.length) * 100}%`;
  };

  return (
    <div className="relative w-full" style={{ height: "calc(100vh - 3.5rem)" }}>

      {/* Custom Dropdown */}
      <div className="absolute top-14 left-0 right-0 z-[1000] px-3">
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full px-4 py-2 rounded-lg bg-white shadow-md text-sm text-gray-600 border border-gray-200 outline-none flex justify-between items-center"
          >
            <span className="truncate">{selectedLabel}</span>
            <span className="ml-2 text-gray-400">▾</span>
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-[1001]">
              {offices.map((office) => (
                <button
                  key={office.id}
                  onClick={() => {
                    handleMarkerClick(office);
                    setSelectedLabel(office.name);
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-100 last:border-none"
                >
                  {office.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={[14.8574, 120.8146]}
        zoom={17}
        className="h-full w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles © Esri"
        />
        <MapClickHandler onMapClick={handleClose} />

        {/* BulSU Label */}
        <Marker
          position={[14.8574, 120.8146]}
          icon={bulsuIcon}
          interactive={false}
        />

        {/* Office Markers with labels */}
        {offices.map((office) => (
          <Marker
            key={office.id}
            position={[office.lat, office.lng]}
            icon={createMarkerIcon(
              office.name.replace(" FoundNest Office", "")
            )}
            eventHandlers={{
              click: () => handleMarkerClick(office),
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
              {selectedOffice.name}
            </p>
            <button onClick={handleClose}>
              <span className="text-gray-500 text-lg font-bold">✕</span>
            </button>
          </div>

          {/* Image with overlaid text */}
          <div className="relative w-full h-44">
            <img
              src={selectedOffice.image}
              alt={selectedOffice.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/30 px-4 py-2">
              <p className="text-white text-xs font-medium">
                {selectedOffice.floor}
              </p>
              <p className="text-white text-xs">
                Operating Hours: {selectedOffice.hours}
              </p>
            </div>
          </div>

          {/* Rating Section */}
          <div className="px-4 pt-4 flex gap-4 items-start">
            <div className="flex flex-col items-start">
              <p className="text-4xl font-bold text-[#4B2D23]">
                {getAverageRating(selectedOffice.id)}
              </p>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-lg ${
                      star <= Math.round(getAverageRating(selectedOffice.id))
                        ? "text-[#FFD700]"
                        : "text-gray-300"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-400">
                ({getOfficeReviews(selectedOffice.id).length})
              </p>
            </div>

            <div className="flex-1 flex flex-col gap-1.5 pt-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: getRatingBarWidth(selectedOffice.id, star),
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
            <p className="font-semibold text-sm mb-3">Rate and Review</p>

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

            <button
              onClick={handlePostReview}
              className="w-full py-3 rounded-full text-sm font-semibold mt-2"
              style={{
                backgroundColor:
                  rating > 0 && reviewText.trim() !== ""
                    ? "#990000"
                    : "rgba(75, 45, 35, 0.3)",
                color: "white",
                cursor:
                  rating > 0 && reviewText.trim() !== ""
                    ? "pointer"
                    : "default",
              }}
            >
              Post
            </button>
          </div>

          {/* Reviews List */}
          <div className="px-4 pt-4">
            {getOfficeReviews(selectedOffice.id).map((review) => (
              <div key={review.id} className="flex gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-[#990000] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">
                    {review.user.slice(-2)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-semibold">{review.user}</p>
                    <p className="text-xs text-gray-400">{review.time}</p>
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
                  <p className="text-xs text-gray-500 mt-1">{review.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-4 right-4 z-[2000] bg-[#990000] rounded-full px-4 py-3 flex items-center gap-3 shadow-lg">
          <span className="text-white text-sm">ℹ️</span>
          <p className="text-xs text-white font-medium whitespace-nowrap overflow-hidden text-ellipsis">
            Review posted. Thank you for the feedback!
          </p>
        </div>
      )}
    </div>
  );
}