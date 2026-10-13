import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import AppHeader from "../user-native/AppHeader";
import Icon from "../user-native/Icon";
import SafeImage from "../user-native/SafeImage";

const API_URL = import.meta.env.VITE_API_URL;

const RED = "#A31D1D"; // active filter / chip accent in the native Find screen

async function fetchJson(url, fetcher = fetch) {
  const res = await fetcher(url);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
  }
  return data;
}

const toggleInList = (list, value) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

const summaryLabel = (base, count, singleName) => {
  if (count === 0) return base;
  if (count === 1 && singleName) return singleName;
  return `${count} Selected`;
};

// "10/13/2026 | 02:40 PM"
function formatDateTime(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${mm}/${dd}/${date.getFullYear()} | ${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
}

/* -------------------------------------------------------------------------- */
/* UI pieces (FilterChip / LocationTab / card of the native FindScreen)        */
/* -------------------------------------------------------------------------- */

function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`self-start mx-[5px] my-[5px] py-2.5 px-3.5 rounded-lg bg-white border flex items-center justify-center active:opacity-70 ${
        active ? "border-[#A31D1D]" : "border-[#eee]"
      }`}
    >
      <span className={`text-[13px] ${active ? "text-[#A31D1D] font-bold" : "text-[#333] font-semibold"}`}>{label}</span>
    </button>
  );
}

function FilterTrigger({ label, open = false, active = false, showArrow = true, onClick }) {
  const highlighted = open || active;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 min-w-0 mx-1 flex items-center justify-center bg-white px-2 py-2 rounded-[15px] border active:opacity-70 ${
        highlighted ? "border-[#A31D1D]" : "border-[#ddd]"
      }`}
    >
      <span className={`text-[12px] truncate mr-[5px] ${highlighted ? "text-[#A31D1D] font-bold" : "text-[#333]"}`}>
        {label}
      </span>
      {showArrow && <Icon name={open ? "chevron-up" : "chevron-down"} size={14} color={open ? RED : "#8B0000"} />}
    </button>
  );
}

function LocationTab({ title, open, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center py-2.5 px-3.5 rounded-lg ${
        open
          ? "bg-[#F3F3F3] border border-[#ddd] border-b-0 rounded-b-none pb-5 mb-0"
          : "bg-[#FAFAFA] mb-2.5"
      }`}
    >
      <span className={`text-[13px] max-w-[101px] text-left ${open ? "text-black font-bold" : "text-[#333] font-medium"}`}>
        {title}
      </span>
      <span className="ml-1.5 flex">
        <Icon name={open ? "chevron-up" : "chevron-down"} size={16} color={RED} />
      </span>
    </button>
  );
}

function ItemCard({ report, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(report.found_report_id)}
      className="relative bg-white rounded-[15px] mb-[15px] overflow-hidden text-left min-w-0 active:opacity-90"
      style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
    >
      <SafeImage src={report.image_url} alt={report.item_name} loading="lazy" className="block w-full h-[120px] lg:h-[160px] object-cover bg-[#ccc]" />
      {report.category_name && (
        <span className="absolute top-[90px] lg:top-[130px] right-2.5 bg-white px-2 py-1 rounded-[10px] border border-[#ddd] text-[10px] font-bold text-[#333]">
          {report.category_name}
        </span>
      )}

      <span className="block p-2.5">
        <span className="block truncate text-[14px] font-bold text-[#333] mb-[5px]">{report.item_name}</span>
        <span className="flex items-center mb-[3px]">
          <Icon name="calendar-outline" size={12} color="#666" />
          <span className="ml-[5px] text-[11px] text-[#666] truncate">{formatDateTime(report.found_date)}</span>
        </span>
        <span className="flex items-center mb-[3px]">
          <Icon name="location-outline" size={12} color="#666" />
          <span className="ml-[5px] text-[11px] text-[#666] truncate">{report.location_found}</span>
        </span>
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Find() {
  const navigate = useNavigate();

  // ---- server data ----
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [gates, setGates] = useState([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [error, setError] = useState(null);

  // ---- filters ----
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedCategories, setSelectedCategories] = useState([]); // category ids
  const [selectedLocations, setSelectedLocations] = useState([]); // location names
  const [showClaimed, setShowClaimed] = useState(false);

  // ---- ui ----
  const [activeMenu, setActiveMenu] = useState(null); // "categories" | "locations" | null
  const [activeLocationGroup, setActiveLocationGroup] = useState(null);

  /* ------------------------------ data loading ----------------------------- */

  const fetchReports = async () => {
    try {
      setIsLoadingReports(true);
      setError(null);
      const data = await fetchJson(`${API_URL}/api/found-reports/public`, fetchWithAuth);
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const loadDropdownData = async () => {
    const results = await Promise.allSettled([
      fetchJson(`${API_URL}/api/categories`),
      fetchJson(`${API_URL}/api/offices`),
      fetchJson(`${API_URL}/api/shared-spaces`),
      fetchJson(`${API_URL}/api/gates`),
    ]);

    const listOrEmpty = (r) =>
      r.status === "fulfilled" && Array.isArray(r.value) ? r.value : [];

    results.forEach((r) => r.status === "rejected" && console.error(r.reason));

    setCategories(listOrEmpty(results[0]));
    setBuildings(listOrEmpty(results[1]));
    setSpaces(listOrEmpty(results[2]));
    setGates(listOrEmpty(results[3]));
  };

  useEffect(() => {
    fetchReports();
    loadDropdownData();
  }, []);

  /* ------------------------------ derived data ----------------------------- */

  const locationGroups = useMemo(
    () => ({
      college: {
        title: "College Buildings",
        items: buildings.map((b) => ({ key: b.office_id, name: b.office_name })),
      },
      shared: {
        title: "Shared Student Spaces",
        items: spaces.map((s) => ({ key: s.shared_space_id, name: s.shared_space_name })),
      },
      gates: {
        title: "Gates",
        items: gates.map((g) => ({ key: g.gate_id, name: g.gate_name })),
      },
    }),
    [buildings, spaces, gates]
  );

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();
    const locations = selectedLocations.map((l) => l.toLowerCase());
    const wantedStatus = showClaimed ? "claimed" : "unclaimed";

    return reports.filter((report) => {
      const matchesSearch =
        !query ||
        [
          report.item_name,
          report.description,
          report.contents,
          report.category_name,
          report.location_found,
        ].some((field) => field?.toLowerCase().includes(query));

      const locationText = report.location_found?.toLowerCase() || "";
      const matchesLocation =
        locations.length === 0 || locations.some((loc) => locationText.includes(loc));

      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(report.category_id);

      const matchesStatus = report.status?.toLowerCase() === wantedStatus;

      return matchesSearch && matchesLocation && matchesCategory && matchesStatus;
    });
  }, [reports, search, selectedLocations, selectedCategories, showClaimed]);

  const categoryLabel = summaryLabel(
    "All Categories",
    selectedCategories.length,
    categories.find((c) => c.category_id === selectedCategories[0])?.category_name
  );
  const locationLabel = summaryLabel("All Locations", selectedLocations.length, selectedLocations[0]);

  /* -------------------------------- handlers ------------------------------- */

  const toggleMenu = (menu) => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
    setActiveLocationGroup(menu === "locations" ? "college" : null);
  };

  const toggleClaimed = () => {
    setShowClaimed((prev) => !prev);
    setActiveMenu(null);
    setActiveLocationGroup(null);
  };

  const onFoundItemClick = (id) => navigate(`/find/${id}`);

  /* --------------------------------- render -------------------------------- */

  const renderResults = () => {
    if (isLoadingReports) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-9 h-9 border-[3px] border-[#A31D1D] border-t-transparent rounded-full animate-spin" />
          <p className="mt-2.5 text-[#666]">Loading found items...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center gap-3 py-10">
          <p className="text-sm text-red-500 text-center">{error}</p>
          <button
            type="button"
            onClick={fetchReports}
            className="border border-[#A31D1D] rounded-lg h-10 px-6 text-[#A31D1D] bg-white text-xs"
          >
            Try again
          </button>
        </div>
      );
    }

    if (filteredReports.length === 0) {
      return <p className="text-center mt-5 text-[#666] text-[16px]">No items found matching your filter.</p>;
    }

    return (
      <div className="grid grid-cols-2 gap-x-[4%] sm:grid-cols-3 sm:gap-x-[2%] lg:grid-cols-4 lg:gap-x-5 xl:grid-cols-5 px-2.5 lg:px-10 pb-20">
        {filteredReports.map((report) => (
          <ItemCard key={report.found_report_id} report={report} onClick={onFoundItemClick} />
        ))}
      </div>
    );
  };

  useEffect(() => {
    const query = searchParams.get("q");

    if (query) {
      sessionStorage.setItem("searchTerm", query);
      setSearch(query);
    } else {
      const savedSearch = sessionStorage.getItem("searchTerm");

      if (savedSearch) {
        setSearch(savedSearch);
      }
    }
  }, [searchParams]);

  const renderLocationGroup = (id) => {
    const group = locationGroups[id];
    return (
      <div
        className={`bg-[#F3F3F3] border border-[#ddd] rounded-lg p-[5px] pt-2.5 -mt-px ${
          id === "college" ? "rounded-tl-none" : id === "shared" ? "rounded-tr-none" : "rounded-tl-none"
        }`}
      >
        <div className="flex flex-wrap justify-start">
          {group.items.map((item) => (
            <FilterChip
              key={item.key}
              label={item.name}
              active={selectedLocations.includes(item.name)}
              onClick={() => setSelectedLocations((prev) => toggleInList(prev, item.name))}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#FAF5F0] min-h-[calc(100vh-70px)] lg:min-h-screen">
      <AppHeader title="Find" desktopTitle="Found Item Gallery" redDesktop />

      <p className="bg-primary text-[22px] font-bold text-white p-5 lg:hidden">Found Item Gallery</p>

      {/* Search */}
      <div className="flex items-center bg-white m-[15px] lg:mx-10 lg:my-5 px-[15px] rounded-[25px] border border-[#ddd] h-[45px]">
        <span className="mr-2.5 flex">
          <Icon name="search-outline" size={20} color="#8B0000" />
        </span>
        <input
          type="text"
          placeholder="Search Item"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            sessionStorage.setItem("searchTerm", e.target.value);
          }}
          className="flex-1 min-w-0 bg-transparent outline-none text-[16px] placeholder:text-[#999]"
        />
      </div>

      {/* Filter card */}
      <div className="bg-white py-2.5 mx-2.5 lg:mx-10 mb-2.5 lg:mb-6 rounded-[15px] lg:border lg:border-black/[0.06]">
        <div className="flex justify-between px-2.5">
          <FilterTrigger label={categoryLabel} open={activeMenu === "categories"} onClick={() => toggleMenu("categories")} />
          <FilterTrigger label={locationLabel} open={activeMenu === "locations"} onClick={() => toggleMenu("locations")} />
          <FilterTrigger label="Claimed" active={showClaimed} showArrow={false} onClick={toggleClaimed} />
        </div>

        {/* Category dropdown */}
        {activeMenu === "categories" && (
          <div className="bg-white mt-3 mx-2.5 rounded-xl p-[15px] border border-[#eee]">
            <div className="flex flex-wrap justify-start">
              <FilterChip
                label="All Categories"
                active={selectedCategories.length === 0}
                onClick={() => {
                  setSelectedCategories([]);
                  setActiveMenu(null);
                }}
              />
              {categories.map((cat) => (
                <FilterChip
                  key={cat.category_id}
                  label={cat.category_name}
                  active={selectedCategories.includes(cat.category_id)}
                  onClick={() => setSelectedCategories((prev) => toggleInList(prev, cat.category_id))}
                />
              ))}
            </div>
          </div>
        )}

        {/* Location dropdown */}
        {activeMenu === "locations" && (
          <div className="bg-white mt-3 mx-2.5 rounded-xl p-[15px] border border-[#eee]">
            <div className="max-h-80 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex flex-wrap justify-start mb-3 border-b border-[#eee] pb-2.5">
                <FilterChip
                  label="All Locations"
                  active={selectedLocations.length === 0}
                  onClick={() => {
                    setSelectedLocations([]);
                    setActiveMenu(null);
                  }}
                />
              </div>

              <div className="flex gap-2 relative z-[2]">
                {["college", "shared"].map((id) => (
                  <LocationTab
                    key={id}
                    title={locationGroups[id].title}
                    open={activeLocationGroup === id}
                    onClick={() => setActiveLocationGroup(activeLocationGroup === id ? null : id)}
                  />
                ))}
              </div>
              {(activeLocationGroup === "college" || activeLocationGroup === "shared") &&
                renderLocationGroup(activeLocationGroup)}

              <div className="flex gap-2 mt-2.5 relative z-[2]">
                <LocationTab
                  title={locationGroups.gates.title}
                  open={activeLocationGroup === "gates"}
                  onClick={() => setActiveLocationGroup(activeLocationGroup === "gates" ? null : "gates")}
                />
              </div>
              {activeLocationGroup === "gates" && renderLocationGroup("gates")}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {renderResults()}
    </div>
  );
}
