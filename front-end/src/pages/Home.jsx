import { useNavigate } from "react-router-dom";
import { Search, ChevronRight, Calendar, MapPin } from "lucide-react";

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

const recentFinds = [
  {
    id: 1,
    name: "Aquaflask Tumbler",
    date: "March 10, 2026",
    time: "3:00 pm",
    location: "Mendoza Hall",
    image: null,
  },
  {
    id: 2,
    name: "iPhone 15 Pro Max",
    date: "March 12, 2026",
    time: "12:30 pm",
    location: "Pimentel Hall",
    image: null,
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div
      className="flex flex-col min-h-screen overflow-y-auto mt-13 mb-16"
      style={{ backgroundColor: "#990000" }}
    >
      {/* Greeting + Search */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-white text-2xl font-bold leading-tight">
          Hello, Manuel!
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
        {/* Divider */}
        <div className="w-full h-px bg-white opacity-40 mb-4"></div>

        {/* Action Cards */}
        <div className="flex flex-col gap-3">
          {/* Report an Item */}
          <button
            onClick={() => navigate("/report")}
            className="flex items-center gap-4 rounded-2xl px-4 py-4 w-full text-left"
            style={{ backgroundColor: "#FFF3E0" }}
          >
            <LostItemIcon />
            <div className="flex-1">
              <p className="text-sm font-bold text-[#4B2D23]">Lost an Item</p>
              <p className="text-xs text-[#4B2D23] opacity-70 mt-0.5">
                File a detailed report to start the search.
              </p>
            </div>
            <ChevronRight size={18} color="#4B2D23" />
          </button>

          {/* Browse the Nest */}
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

          {/* Drop-off Locations */}
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
        {/* Divider */}
        <div className="w-full h-px bg-white opacity-40 mb-3"></div>

        {/* Report Card */}
        <div className="bg-white rounded-2xl px-4 py-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs text-gray-500">Lost Item Name:</p>
              <p className="text-sm font-bold text-[#4B2D23]">Black Umbrella</p>
            </div>
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: "#FFD700", color: "#4B2D23" }}
            >
              Potential Match Found!
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
        {/* Divider */}
        <div className="w-full h-px bg-white opacity-40 mb-3"></div>

        {/* Recent Finds Cards */}
        <div className="flex flex-col gap-3">
          {recentFinds.map((item) => (
            <div
              key={item.id}
              className="relative rounded-2xl overflow-hidden h-52"
              style={{ backgroundColor: "#7B1F1F", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#7B1F1F]" />
              )}

              {/* Overlay */}
              <div className="absolute bottom-0 left-0 right-0 px-4 py-3">
                <p className="text-white font-bold text-base mb-2">{item.name}</p>
                {/* White divider line */}
                <div className="w-full h-px bg-white opacity-60 mb-2"></div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar size={12} color="white" />
                  <p className="text-white text-xs">
                    {item.date} | {item.time}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={12} color="white" />
                  <p className="text-white text-xs">{item.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}