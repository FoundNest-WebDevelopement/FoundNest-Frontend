import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Search, ChevronRight, Calendar, MapPin } from "lucide-react";

const API_URL = "http://localhost:5000/api";

const LostItemIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4B2D23" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="12" y1="18" x2="12" y2="12"/>
    <line x1="9" y1="15" x2="15" y2="15"/>
  </svg>
);

const BrowseIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4B2D23" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const DropoffIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4B2D23" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

export default function Home() {
  const navigate = useNavigate();
  const firstName = localStorage.getItem("first_name") || "User";
  const user_id = localStorage.getItem("user_id");
  const token = localStorage.getItem("token");

  const [recentFinds, setRecentFinds] = useState([]);
  const [latestReport, setLatestReport] = useState(null);
  const [loadingFinds, setLoadingFinds] = useState(true);
  const [loadingReport, setLoadingReport] = useState(true);

  // Fetch recent found items
  useEffect(() => {
    const fetchRecentFinds = async () => {
      try {
        const res = await fetch(`${API_URL}/found-reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setRecentFinds(data.slice(0, 3));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingFinds(false);
      }
    };
    fetchRecentFinds();
  }, []);

  // Fetch user's latest lost report
  useEffect(() => {
    const fetchLatestReport = async () => {
      try {
        const res = await fetch(`${API_URL}/lost-reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          // Filter by user and get latest
          const userReports = data.filter(
            (r) => String(r.user_id) === String(user_id)
          );
          if (userReports.length > 0) {
            setLatestReport(userReports[0]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingReport(false);
      }
    };
    fetchLatestReport();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "—";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div
      className="flex flex-col min-h-screen overflow-y-auto mt-13 mb-16"
      style={{ backgroundColor: "#990000" }}
    >
      {/* Greeting + Search */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-white text-2xl font-bold leading-tight">
          Hello, {firstName}!
        </h1>
        <p className="text-white text-2xl font-bold leading-tight mb-4">
          Searching for something?
        </p>

        {/* Search Bar */}
        <div className="flex items-center bg-white rounded-xl px-4 py-3 gap-3">
          <Search size={16} color="#990000" />
          <input
            type="text"
            placeholder="Search the Nest (e.g., Wallet, Bag...)"
            className="flex-1 text-sm text-gray-400 outline-none bg-transparent"
          />
        </div>
      </div>

      {/* How can the Nest help you */}
      <div className="px-5 pb-4">
        <p className="text-white text-base font-bold mb-2">
          How can the Nest help you today?
        </p>
        <div className="w-full h-px bg-white opacity-40 mb-4"></div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate("/report")}
            className="flex items-center gap-4 rounded-2xl px-4 py-4 w-full text-left"
            style={{ backgroundColor: "#FFF3E0" }}
          >
            <LostItemIcon />
            <div className="flex-1">
              <p className="text-sm font-bold text-[#4B2D23]">Lost an Item?</p>
              <p className="text-xs text-[#4B2D23] opacity-70 mt-0.5">
                File a detailed report to start the search.
              </p>
            </div>
            <ChevronRight size={18} color="#4B2D23" />
          </button>

          <button
            onClick={() => navigate("/find")}
            className="flex items-center gap-4 rounded-2xl px-4 py-4 w-full text-left"
            style={{ backgroundColor: "#FFF3E0" }}
          >
            <BrowseIcon />
            <div className="flex-1">
              <p className="text-sm font-bold text-[#4B2D23]">Looking for an Item?</p>
              <p className="text-xs text-[#4B2D23] opacity-70 mt-0.5">
                Check for your lost item here!
              </p>
            </div>
            <ChevronRight size={18} color="#4B2D23" />
          </button>

          <button
            onClick={() => navigate("/map")}
            className="flex items-center gap-4 rounded-2xl px-4 py-4 w-full text-left"
            style={{ backgroundColor: "#FFF3E0" }}
          >
            <DropoffIcon />
            <div className="flex-1">
              <p className="text-sm font-bold text-[#4B2D23]">Found an Item?</p>
              <p className="text-xs text-[#4B2D23] opacity-70 mt-0.5">
                Find authorized offices to surrender or claim an item.
              </p>
            </div>
            <ChevronRight size={18} color="#4B2D23" />
          </button>
        </div>
      </div>

      {/* Lost Item Report Section */}
      <div className="px-5 pb-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-white font-bold text-base">Lost Item Report</p>
          <button
            onClick={() => navigate("/report")}
            className="text-xs flex items-center gap-1 font-semibold"
            style={{ color: "#F9E055" }}
          >
            Go to My Reports <ChevronRight size={14} color="#F9E055" />
          </button>
        </div>
        <div className="w-full h-px bg-white opacity-40 mb-3"></div>

        {loadingReport ? (
          <div className="flex justify-center py-4">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : latestReport ? (
          <div className="bg-white rounded-2xl px-4 py-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs text-gray-500">Lost Item Name:</p>
                <p className="text-sm font-bold text-[#4B2D23]">
                  {latestReport.item_name}
                </p>
              </div>
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{
                  backgroundColor:
                    latestReport.status === "matched" ? "#FFD700" : "#E0E0E0",
                  color: "#4B2D23",
                }}
              >
                {latestReport.status === "matched"
                  ? "Potential Match Found!"
                  : latestReport.status === "open"
                  ? "Searching..."
                  : latestReport.status}
              </span>
            </div>
            <div className="w-full h-px bg-gray-200 mb-3"></div>
            <div className="flex justify-between items-center">
              <button className="flex items-center gap-1 text-xs text-[#4B2D23]">
                <i className="fa-regular fa-pen-to-square text-xs"></i>
                Edit Report
              </button>
              <button
                onClick={() => navigate("/report")}
                className="flex items-center gap-1 text-xs text-[#4B2D23] font-semibold"
              >
                View Matches →
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl px-4 py-4 text-center">
            <p className="text-xs text-gray-400">No reports yet.</p>
            <button
              onClick={() => navigate("/report")}
              className="text-xs text-[#990000] font-semibold mt-1"
            >
              File a report →
            </button>
          </div>
        )}
      </div>

      {/* Recent Finds Section */}
      <div className="px-5 pb-6">
        <div className="flex justify-between items-center mb-2">
          <p className="text-white font-bold text-base">Recent Finds</p>
          <button
            onClick={() => navigate("/find")}
            className="text-xs flex items-center gap-1 font-semibold"
            style={{ color: "#F9E055" }}
          >
            Go to Found Items <ChevronRight size={14} color="#F9E055" />
          </button>
        </div>
        <div className="w-full h-px bg-white opacity-40 mb-3"></div>

        {loadingFinds ? (
          <div className="flex justify-center py-4">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : recentFinds.length === 0 ? (
          <div className="bg-white/20 rounded-2xl px-4 py-6 text-center">
            <p className="text-white text-xs opacity-70">No recent finds yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {recentFinds.map((item) => (
              <div
                key={item.found_report_id}
                className="relative rounded-2xl overflow-hidden h-52"
                style={{ backgroundColor: "#7B1F1F", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.item_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#7B1F1F]" />
                )}

                <div className="absolute bottom-0 left-0 right-0 px-4 py-3">
                  <p className="text-white font-bold text-base mb-2">
                    {item.item_name}
                  </p>
                  <div className="w-full h-px bg-white opacity-60 mb-2"></div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar size={12} color="white" />
                    <p className="text-white text-xs">
                      {formatDate(item.found_date)} | {formatTime(item.found_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={12} color="white" />
                    <p className="text-white text-xs">
                      {item.location_found || "—"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}