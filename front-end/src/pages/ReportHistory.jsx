import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReportCard from "../components/ReportCard";
import StackHeader from "../user-native/StackHeader";
import Icon from "../user-native/Icon";
import EmptyNest from "../user-native/EmptyNest";
import { fetchWithAuth } from "../utils/fetchWithAuth";

const API_URL = import.meta.env.VITE_API_URL;
const STATUS_OPTIONS = ["open", "cancelled", "resolved"];
const FILTERS_KEY = "reportHistoryFilters";

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const getStatus = (report) => report.status ?? (report.date_cancelled ? "cancelled" : "open");

const toggleInList = (list, value) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

const summaryLabel = (base, selected, format = (v) => v) => {
  if (selected.length === 0) return base;
  if (selected.length === 1) return format(selected[0]);
  return `${selected.length} Selected`;
};

const loadSavedFilters = () => {
  try {
    return JSON.parse(sessionStorage.getItem(FILTERS_KEY)) ?? {};
  } catch {
    return {};
  }
};

function Chip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`self-start mx-[5px] my-[5px] py-2.5 px-3.5 rounded-lg bg-white border flex items-center justify-center active:opacity-70 ${
        active ? "border-primary" : "border-[#eee]"
      }`}
    >
      <span className={`text-[13px] ${active ? "text-primary font-bold" : "text-[#333] font-semibold"}`}>{label}</span>
    </button>
  );
}

function FilterTrigger({ label, open, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 min-w-0 mx-1 flex items-center justify-center bg-white px-2 py-2 rounded-[15px] border active:opacity-70 ${
        open || active ? "border-primary" : "border-[#ddd]"
      }`}
    >
      <span className={`text-[12px] truncate mr-[5px] shrink ${active ? "text-primary font-bold" : "text-[#333]"}`}>{label}</span>
      <Icon name={open ? "chevron-up" : "chevron-down"} size={13} color="#8B0000" />
    </button>
  );
}

export default function ReportHistory() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [saved] = useState(loadSavedFilters);

  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState(saved.search ?? "");
  const [selectedCategories, setSelectedCategories] = useState(saved.selectedCategories ?? []);
  const [selectedStatuses, setSelectedStatuses] = useState(saved.selectedStatuses ?? []);
  const [activeMenu, setActiveMenu] = useState(null); // "category" | "status" | null

  // "Matched" toggle, cycled on every click: all reports -> only matched -> only unmatched -> all
  const [matchMode, setMatchMode] = useState(saved.matchMode ?? "all");
  const [matchesByReport, setMatchesByReport] = useState({});
  const [matchesLoaded, setMatchesLoaded] = useState(false);

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

  // Matches of every report that can have any (cancelled ones never show matches)
  useEffect(() => {
    let ignore = false;
    const candidates = reports.filter((r) => getStatus(r) !== "cancelled");

    Promise.all(
      candidates.map((r) =>
        fetchWithAuth(`${API_URL}/api/match-records/${r.lost_report_id}/lost-report`)
          .then((res) => (res.ok ? res.json() : []))
          .then((data) => [r.lost_report_id, Array.isArray(data) ? data : []])
          .catch(() => [r.lost_report_id, []])
      )
    ).then((entries) => {
      if (ignore) return;
      setMatchesByReport(Object.fromEntries(entries));
      setMatchesLoaded(true);
    });

    return () => {
      ignore = true;
    };
  }, [reports]);

  useEffect(() => {
    try {
      sessionStorage.setItem(FILTERS_KEY, JSON.stringify({ search, selectedCategories, selectedStatuses, matchMode }));
    } catch {
      // storage unavailable: filters just aren't remembered
    }
  }, [search, selectedCategories, selectedStatuses, matchMode]);

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
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(getStatus(r));
      const hasMatches = (matchesByReport[r.lost_report_id]?.length ?? 0) > 0;
      const matchesMode =
        matchMode === "all" || !matchesLoaded || (matchMode === "matched" ? hasMatches : !hasMatches);
      return matchesSearch && matchesCategory && matchesStatus && matchesMode;
    });
  }, [reports, search, selectedCategories, selectedStatuses, matchMode, matchesByReport, matchesLoaded]);

  const hasActiveFilters =
    search.length > 0 || selectedCategories.length > 0 || selectedStatuses.length > 0 || matchMode !== "all";

  const cycleMatchMode = () => {
    setActiveMenu(null);
    setMatchMode((prev) => (prev === "all" ? "matched" : prev === "matched" ? "unmatched" : "all"));
  };

  const toggleMenu = (menu) => setActiveMenu((prev) => (prev === menu ? null : menu));

  const clearFilters = () => {
    setSearch("");
    setSelectedCategories([]);
    setSelectedStatuses([]);
    setMatchMode("all");
    setActiveMenu(null);
  };

  const handleCancelled = (reportId, reason) => {
    setReports((prev) =>
      prev.map((r) =>
        r.lost_report_id === reportId
          ? { ...r, status: "cancelled", cancel_reason: reason, date_cancelled: new Date().toISOString() }
          : r
      )
    );
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="w-9 h-9 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
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
            className="border border-primary rounded-lg h-10 px-6 text-primary bg-white text-xs"
          >
            Try again
          </button>
        </div>
      );
    }

    if (reports.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-[120px] pt-10">
          <EmptyNest />
          <p className="text-[20px] font-extrabold text-[#1a1a1a] mt-4 mb-2.5">Nothing here yet!</p>
          <p className="text-[14px] text-black/65 text-center leading-[22px]">
            Your report history is currently empty.
            <br />
            Any new report you make will appear here.
          </p>
        </div>
      );
    }

    if (filteredReports.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center py-24">
          <Icon name="search-outline" size={48} color="#C5AFA7" />
          <p className="text-[20px] font-extrabold text-[#1a1a1a] mt-4 mb-2.5">No reports found</p>
          <p className="text-[14px] text-black/65 text-center leading-[22px]">Try adjusting your filters.</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4 px-4 pt-0.5 pb-10 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5 lg:px-10 lg:pt-3">
        {filteredReports.map((report) => (
          <ReportCard
            key={report.lost_report_id}
            imageSrc={report.image_url}
            reportId={report.lost_report_id}
            itemName={report.item_name}
            dateReported={report.date_reported}
            status={getStatus(report)}
            dateCancelled={report.date_cancelled}
            cancelReason={report.cancel_reason}
            onCancel={handleCancelled}
            matchesManaged
            matchesProp={matchesByReport[report.lost_report_id]}
          />
        ))}
      </div>
    );
  };

  const showControls = !isLoading && !error && reports.length > 0;

  return (
    <div className="bg-[#FFF1E0] min-h-[calc(100vh-70px)] lg:min-h-screen flex flex-col">
      <StackHeader title="Report History" onBack={() => navigate("/profile")} />

      {showControls && (
        <>
          {/* Search */}
          <div className="flex items-center bg-white mx-[15px] lg:mx-10 mt-3.5 lg:mt-6 mb-2.5 px-[15px] rounded-[25px] border border-[#ddd] h-[45px]">
            <span className="mr-2.5 flex">
              <Icon name="search-outline" size={20} color="#8B0000" />
            </span>
            <input
              type="text"
              placeholder="Search Item"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-0 bg-transparent outline-none text-[16px] text-[#333] placeholder:text-[#999]"
            />
            {search.length > 0 && (
              <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="flex">
                <Icon name="close-circle" size={18} color="#B0A09A" />
              </button>
            )}
          </div>

          {/* Filter bar */}
          <div className="bg-white py-2.5 mx-2.5 lg:mx-10 mb-2.5 rounded-[15px] lg:border lg:border-black/[0.06]">
            <div className="flex justify-between px-2.5">
              <FilterTrigger
                label={summaryLabel("Category", selectedCategories)}
                open={activeMenu === "category"}
                active={selectedCategories.length > 0}
                onClick={() => toggleMenu("category")}
              />
              <FilterTrigger
                label={summaryLabel("Status", selectedStatuses, capitalize)}
                open={activeMenu === "status"}
                active={selectedStatuses.length > 0}
                onClick={() => toggleMenu("status")}
              />
              <button
                type="button"
                onClick={cycleMatchMode}
                className={`flex-1 min-w-0 mx-1 flex items-center justify-center bg-white px-2 py-2 rounded-[15px] border active:opacity-70 ${
                  matchMode === "all" ? "border-[#ddd]" : "border-primary"
                }`}
              >
                <span className={`text-[12px] truncate ${matchMode === "all" ? "text-[#333]" : "text-primary font-bold"}`}>
                  {matchMode === "unmatched" ? "Unmatched" : "Matched"}
                </span>
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="shrink-0 flex items-center justify-center gap-[3px] mx-1 px-2 py-2 rounded-[15px] border border-[#ddd] active:opacity-70"
                >
                  <Icon name="close" size={14} color="#8B0000" />
                  <span className="text-[12px] font-semibold text-primary">Clear</span>
                </button>
              )}
            </div>
          </div>

          {activeMenu === "category" && (
            <div className="bg-white mx-2.5 lg:mx-10 mb-2.5 rounded-xl p-[15px] border border-[#eee]">
              <div className="flex flex-wrap justify-start">
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
            <div className="bg-white mx-2.5 lg:mx-10 mb-2.5 rounded-xl p-[15px] border border-[#eee]">
              <div className="flex flex-wrap justify-start">
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
  );
}
