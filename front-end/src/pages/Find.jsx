import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageLabel from "../components/PageLabel";
import Loading from "../components/Loading";
import formatDateTime from "../utils/formatDateTime";
import { fetchWithAuth } from "../utils/fetchWithAuth";

const API_URL = import.meta.env.VITE_API_URL;

// Which location tabs share a row (mirrors the RN layout: 2 tabs, then 1)
const LOCATION_ROWS = [["college", "shared"], ["gates"]];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* UI pieces                                                                  */
/* -------------------------------------------------------------------------- */

// White pill used inside dropdowns (categories / locations)
function Chip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3.5 py-2.5 text-[13px] bg-white border ${
        active
          ? "border-primary text-primary font-bold"
          : "border-[#eee] text-[#333] font-semibold"
      }`}
    >
      {label}
    </button>
  );
}

// The three buttons at the top of the filter card
function FilterTrigger({ label, open = false, active = false, showArrow = true, onClick }) {
  const highlighted = open || active;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 bg-white rounded-2xl border px-2 py-2 text-xs ${
        highlighted ? "border-primary text-primary font-bold" : "border-[#ddd] text-[#333]"
      }`}
    >
      <span className="truncate">{label}</span>
      {showArrow && (
        <i className={`fa-solid fa-chevron-${open ? "up" : "down"} text-[10px] text-primary`} />
      )}
    </button>
  );
}

// Folder-style tab; the active one visually joins the content box below it
function LocationTab({ title, open, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        open
          ? "flex items-center gap-1.5 bg-[#F3F3F3] border border-[#ddd] border-b-0 rounded-t-lg px-3.5 pt-2.5 pb-5 text-[13px] font-bold text-black"
          : "flex items-center gap-1.5 bg-[#FAFAFA] rounded-lg px-3.5 py-2.5 mb-2.5 text-[13px] font-medium text-[#333]"
      }
    >
      {title}
      <i className={`fa-solid fa-chevron-${open ? "up" : "down"} text-[10px] text-primary`} />
    </button>
  );
}

function ItemCard({ report, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(report.found_report_id)}
      className="min-w-0 flex flex-col text-left bg-white rounded-2xl overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
    >
      <div className="relative w-full">
        <img
          src={report.image_url}
          alt={report.item_name}
          loading="lazy"
          className="w-full h-30 object-cover bg-[#ccc]"
        />
        {report.category_name && (
          <span className="absolute bottom-2 right-2.5 bg-white border border-[#ddd] rounded-[10px] px-2 py-1 text-[10px] font-bold text-[#333]">
            {report.category_name}
          </span>
        )}
      </div>

      <div className="p-2.5 flex flex-col gap-1 w-full min-w-0">
        <p className="text-sm font-bold text-[#333] truncate">{report.item_name}</p>
        <div className="flex items-center gap-1.5 text-[11px] text-[#666] min-w-0">
          <i className="fa-regular fa-calendar text-xs shrink-0" />
          <span className="truncate">{formatDateTime(report.found_date)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#666] min-w-0">
          <i className="fa-solid fa-location-dot text-xs shrink-0" />
          <span className="truncate">{report.location_found}</span>
        </div>
      </div>
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
        title: "Shared Spaces",
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
    if (isLoadingReports) return <Loading />;

    if (error) {
      return (
        <div className="flex flex-col items-center gap-3 py-10">
          <p className="text-sm text-red-500 text-center">{error}</p>
          <button
            type="button"
            onClick={fetchReports}
            className="border border-primary rounded-lg h-10 px-6 text-primary bg-white text-xs"
          >
            Try again
          </button>
        </div>
      );
    }

    if (filteredReports.length === 0) {
      return (
        <p className="text-center text-base text-[#666] mt-5">
          No items found matching your filter.
        </p>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 pb-4">
        {filteredReports.map((report) => (
          <ItemCard key={report.found_report_id} report={report} onClick={onFoundItemClick} />
        ))}
      </div>
    );
  };

  return (
    <>
      <PageLabel label="Found Item Gallery" />
      <div className="bg-(--color-secondary) min-h-screen w-full px-2.5 flex flex-col pb-25">
        {/* Search */}
        <div className="flex items-center gap-2.5 bg-white border border-[#ddd] rounded-full h-11 px-4 my-3.5">
          <i className="fa-solid fa-magnifying-glass text-primary" />
          <input
            type="text"
            placeholder="Search Item"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-0 bg-transparent outline-none text-base placeholder:text-[#999]"
          />
        </div>

        {/* Filter card */}
        <div className="bg-[#F0E4DE] rounded-2xl py-2.5 mb-3">
          <div className="flex gap-2 px-2.5">
            <FilterTrigger
              label={categoryLabel}
              open={activeMenu === "categories"}
              onClick={() => toggleMenu("categories")}
            />
            <FilterTrigger
              label={locationLabel}
              open={activeMenu === "locations"}
              onClick={() => toggleMenu("locations")}
            />
            <FilterTrigger
              label="Claimed"
              active={showClaimed}
              showArrow={false}
              onClick={toggleClaimed}
            />
          </div>

          {/* Category dropdown */}
          {activeMenu === "categories" && (
            <div className="bg-white mt-3 mx-2.5 rounded-xl p-4 border border-[#eee]">
              <div className="flex flex-wrap gap-2">
                <Chip
                  label="All Categories"
                  active={selectedCategories.length === 0}
                  onClick={() => {
                    setSelectedCategories([]);
                    setActiveMenu(null);
                  }}
                />
                {categories.map((cat) => (
                  <Chip
                    key={cat.category_id}
                    label={cat.category_name}
                    active={selectedCategories.includes(cat.category_id)}
                    onClick={() =>
                      setSelectedCategories((prev) => toggleInList(prev, cat.category_id))
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Location dropdown */}
          {activeMenu === "locations" && (
            <div className="bg-white mt-3 mx-2.5 rounded-xl p-4 border border-[#eee] max-h-80 overflow-y-auto">
              <div className="flex flex-wrap gap-2 pb-2.5 mb-3 border-b border-[#eee]">
                <Chip
                  label="All Locations"
                  active={selectedLocations.length === 0}
                  onClick={() => {
                    setSelectedLocations([]);
                    setActiveMenu(null);
                  }}
                />
              </div>

              {LOCATION_ROWS.map((rowIds, rowIndex) => {
                const openId = rowIds.find((id) => id === activeLocationGroup);
                const openGroup = openId ? locationGroups[openId] : null;

                return (
                  <div key={rowIndex} className={rowIndex > 0 ? "mt-2.5" : ""}>
                    <div className="relative z-10 flex items-end gap-2">
                      {rowIds.map((id) => (
                        <LocationTab
                          key={id}
                          title={locationGroups[id].title}
                          open={activeLocationGroup === id}
                          onClick={() =>
                            setActiveLocationGroup(activeLocationGroup === id ? null : id)
                          }
                        />
                      ))}
                    </div>

                    {openGroup && (
                      <div
                        className={`-mt-px bg-[#F3F3F3] border border-[#ddd] rounded-lg p-1.5 pt-2.5 ${
                          openId === rowIds[0] ? "rounded-tl-none" : ""
                        }`}
                      >
                        <div className="flex flex-wrap gap-2">
                          {openGroup.items.map((item) => (
                            <Chip
                              key={item.key}
                              label={item.name}
                              active={selectedLocations.includes(item.name)}
                              onClick={() =>
                                setSelectedLocations((prev) => toggleInList(prev, item.name))
                              }
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Results */}
        {renderResults()}
      </div>
    </>
  );
}