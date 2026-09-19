import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageLabelWithReturn from "../components/PageLabelWithReturn";
import ReportCard from "../components/ReportCard";
import Loading from "../components/Loading";
import emptyImage from "../assets/empty_image.png";
import { fetchWithAuth } from "../utils/fetchWithAuth";

const API_URL = import.meta.env.VITE_API_URL;
const STATUS_OPTIONS = ["open", "cancelled", "resolved"];
const FILTERS_KEY = "reportHistoryFilters";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Use the server's status if it sends one, otherwise infer it from date_cancelled
const getStatus = (report) => report.status ?? (report.date_cancelled ? "cancelled" : "open");

const toggleInList = (list, value) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

const summaryLabel = (base, selected, format = (v) => v) => {
  if (selected.length === 0) return base;
  if (selected.length === 1) return format(selected[0]);
  return `${selected.length} Selected`;
};

// Keeps filters when the user opens a report and comes back (RN does the same)
const loadSavedFilters = () => {
  try {
    return JSON.parse(sessionStorage.getItem(FILTERS_KEY)) ?? {};
  } catch {
    return {};
  }
};

/* -------------------------------------------------------------------------- */
/* UI pieces                                                                  */
/* -------------------------------------------------------------------------- */

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

function FilterTrigger({ label, open, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 bg-white rounded-2xl border px-2 py-2 text-xs ${
        open || active ? "border-primary" : "border-[#ddd]"
      } ${active ? "text-primary font-bold" : "text-[#333]"}`}
    >
      <span className="truncate">{label}</span>
      <i className={`fa-solid fa-chevron-${open ? "up" : "down"} text-[10px] text-primary`} />
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function ReportHistory() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [saved] = useState(loadSavedFilters);

  // ---- data ----
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---- filters ----
  const [search, setSearch] = useState(saved.search ?? "");
  const [selectedCategories, setSelectedCategories] = useState(saved.selectedCategories ?? []);
  const [selectedStatuses, setSelectedStatuses] = useState(saved.selectedStatuses ?? []);
  const [activeMenu, setActiveMenu] = useState(null); // "category" | "status" | null

  /* ------------------------------ data loading ----------------------------- */

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetchWithAuth(`${API_URL}/api/lost-reports/user/${id}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data?.message || data?.error || "Cannot fetch reports");

      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [id]);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        FILTERS_KEY,
        JSON.stringify({ search, selectedCategories, selectedStatuses })
      );
    } catch {
      // storage unavailable (private mode etc.); filters just won't persist
    }
  }, [search, selectedCategories, selectedStatuses]);

  /* ------------------------------ derived data ----------------------------- */

  // Only offer categories that actually appear in this user's reports.
  // If the API doesn't return category_name, this stays empty and the trigger hides.
  const categoryOptions = useMemo(
    () => [...new Set(reports.map((r) => r.category_name).filter(Boolean))].sort(),
    [reports]
  );

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reports.filter((r) => {
      const matchesSearch = !query || (r.item_name ?? "").toLowerCase().includes(query);
      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(r.category_name);
      const matchesStatus =
        selectedStatuses.length === 0 || selectedStatuses.includes(getStatus(r));
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [reports, search, selectedCategories, selectedStatuses]);

  const hasActiveFilters =
    search.length > 0 || selectedCategories.length > 0 || selectedStatuses.length > 0;

  /* -------------------------------- handlers ------------------------------- */

  const toggleMenu = (menu) => setActiveMenu((prev) => (prev === menu ? null : menu));

  const clearFilters = () => {
    setSearch("");
    setSelectedCategories([]);
    setSelectedStatuses([]);
    setActiveMenu(null);
  };

  // Update the one card locally instead of refetching, so the list doesn't
  // flash to a spinner and lose the user's scroll position
  const handleCancelled = (reportId) => {
    setReports((prev) =>
      prev.map((r) =>
        r.lost_report_id === reportId
          ? { ...r, status: "cancelled", date_cancelled: new Date().toISOString() }
          : r
      )
    );
  };

  /* --------------------------------- render -------------------------------- */

  const renderBody = () => {
    if (isLoading) return <Loading />;

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

    if (reports.length === 0) {
      return (
        <div className="flex flex-col items-center text-center pt-16 px-6">
          <img src={emptyImage} alt="nothing here yet" className="h-70" />
          <p className="text-xl font-extrabold mt-4 mb-2.5">Nothing here yet!</p>
          <p className="text-sm text-[#4B2D23]/80 leading-[22px]">
            Your report history is currently empty.
            <br />
            Any new report you make will appear here.
          </p>
        </div>
      );
    }

    if (filteredReports.length === 0) {
      return (
        <div className="flex flex-col items-center text-center pt-16">
          <i className="fa-solid fa-magnifying-glass text-5xl text-[#C5AFA7]" />
          <p className="text-xl font-extrabold mt-4 mb-2.5">No reports found</p>
          <p className="text-sm text-[#4B2D23]/80">Try adjusting your filters.</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        {filteredReports.map((report) => (
          <ReportCard
            key={report.lost_report_id}
            imageSrc={report.image_url}
            reportId={report.lost_report_id}
            itemName={report.item_name}
            dateReported={report.date_reported}
            status={getStatus(report)}
            dateCancelled={report.date_cancelled}
            onCancel={handleCancelled}
          />
        ))}
      </div>
    );
  };

  const showControls = !isLoading && !error && reports.length > 0;

  return (
    <>
      <PageLabelWithReturn label="Report History" onClick={() => navigate("/profile")} />

      <div className="bg-(--color-secondary) min-h-screen px-4 pt-3.5 pb-25">
        {showControls && (
          <>
            {/* Search */}
            <div className="flex items-center gap-2.5 bg-white border border-[#ddd] rounded-full h-11 px-4 mb-2.5">
              <i className="fa-solid fa-magnifying-glass text-primary" />
              <input
                type="text"
                placeholder="Search Item"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 min-w-0 bg-transparent outline-none text-base text-[#333] placeholder:text-[#999]"
              />
              {search.length > 0 && (
                <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
                  <i className="fa-solid fa-circle-xmark text-[#B0A09A]" />
                </button>
              )}
            </div>

            {/* Filter bar */}
            <div className="bg-[#F0E4DE] rounded-2xl py-2.5 mb-2.5">
              <div className="flex gap-2 px-2.5">
                {categoryOptions.length > 0 && (
                  <FilterTrigger
                    label={summaryLabel("Category", selectedCategories)}
                    open={activeMenu === "category"}
                    active={selectedCategories.length > 0}
                    onClick={() => toggleMenu("category")}
                  />
                )}
                <FilterTrigger
                  label={summaryLabel("Status", selectedStatuses, capitalize)}
                  open={activeMenu === "status"}
                  active={selectedStatuses.length > 0}
                  onClick={() => toggleMenu("status")}
                />
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="shrink-0 flex items-center gap-1 rounded-2xl border border-[#ddd] px-2 py-2 text-xs font-semibold text-primary"
                  >
                    <i className="fa-solid fa-xmark text-[11px]" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Dropdowns */}
            {activeMenu === "category" && (
              <div className="bg-white rounded-xl p-4 mb-2.5 border border-[#eee]">
                <div className="flex flex-wrap gap-2">
                  <Chip
                    label="All"
                    active={selectedCategories.length === 0}
                    onClick={() => {
                      setSelectedCategories([]);
                      setActiveMenu(null);
                    }}
                  />
                  {categoryOptions.map((cat) => (
                    <Chip
                      key={cat}
                      label={cat}
                      active={selectedCategories.includes(cat)}
                      onClick={() => setSelectedCategories((prev) => toggleInList(prev, cat))}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeMenu === "status" && (
              <div className="bg-white rounded-xl p-4 mb-2.5 border border-[#eee]">
                <div className="flex flex-wrap gap-2">
                  <Chip
                    label="All"
                    active={selectedStatuses.length === 0}
                    onClick={() => {
                      setSelectedStatuses([]);
                      setActiveMenu(null);
                    }}
                  />
                  {STATUS_OPTIONS.map((s) => (
                    <Chip
                      key={s}
                      label={capitalize(s)}
                      active={selectedStatuses.includes(s)}
                      onClick={() => setSelectedStatuses((prev) => toggleInList(prev, s))}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {renderBody()}
      </div>
    </>
  );
}