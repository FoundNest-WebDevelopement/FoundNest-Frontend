import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Toast from "./Toast";
import InfoIcon from "../assets/info_icon.png";
import { fetchWithAuth } from "../utils/fetchWithAuth";

const API_URL = import.meta.env.VITE_API_URL;

const CANCEL_REASONS = [
  "I found it myself!",
  "I’m no longer looking for it.",
  "I duplicated a report.",
];

const BADGES = {
  cancelled: { label: "Cancelled", className: "bg-[#D9D2CC] text-[#5C5048]" },
  resolved: { label: "Resolved", className: "bg-[#C8E6C9] text-[#2E7D32]" },
  match: { label: "Potential Match Found!", className: "bg-(--color-quaternary) text-[#1a1a1a]" },
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const formatReportId = (id) => `RPT-${String(id).padStart(5, "0")}`;
const formatItemId = (id) => `SI-${String(id).padStart(5, "0")}`;

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

const showToast = (message) =>
  toast.custom(() => <Toast icon={InfoIcon} message={message} />);

/* -------------------------------------------------------------------------- */
/* Pieces                                                                     */
/* -------------------------------------------------------------------------- */

function ImageFallback({ className, iconClass }) {
  return (
    <div className={`bg-[#EDE0D4] flex items-center justify-center ${className}`}>
      <i className={`fa-regular fa-image text-[#B0A09A] ${iconClass}`} />
    </div>
  );
}

function StatusBadge({ kind }) {
  if (!kind) return null;
  const { label, className } = BADGES[kind];
  return (
    <span
      className={`self-start rounded-full px-2.5 py-0.5 mb-2 text-[11px] font-bold ${className}`}
    >
      {label}
    </span>
  );
}

function MatchCard({ match, label, onClick }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-extrabold mb-1.5">{label}</p>

      <button
        type="button"
        onClick={onClick}
        className="block w-full text-left bg-[#FAF6F2] rounded-xl overflow-hidden border border-black/[0.06]"
      >
        <div className="relative w-full aspect-square">
          {match.found_image_url ? (
            <img
              src={match.found_image_url}
              alt={match.found_item_name ?? "found item"}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageFallback className="w-full h-full" iconClass="text-3xl" />
          )}

          {match.found_category_name && (
            <span className="absolute bottom-2 right-2 max-w-[80%] truncate bg-white rounded-full px-2 py-0.5 text-[10px] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
              {match.found_category_name}
            </span>
          )}
        </div>

        <div className="p-2 flex flex-col gap-0.5">
          <p className="text-[11px] font-bold text-primary mb-0.5">
            {formatItemId(match.found_item_id)}
          </p>
          <p className="text-xs font-bold line-clamp-2">{match.found_item_name ?? "—"}</p>
          <div className="h-px bg-black/[0.08] my-1" />
          <div className="flex items-center gap-1 text-[10px] text-[#4B2D23]/80 min-w-0">
            <i className="fa-regular fa-calendar shrink-0" />
            <span className="truncate">{formatDate(match.found_date)}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[#4B2D23]/80 min-w-0">
            <i className="fa-solid fa-location-dot shrink-0" />
            <span className="truncate">{match.location_found ?? "—"}</span>
          </div>
        </div>
      </button>
    </div>
  );
}

function CancelReasonModal({ open, selectedReason, onSelect, onKeep, onConfirm, isCancelling }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/20 flex items-center justify-center z-2000 px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-70 max-w-full bg-white rounded-xl overflow-hidden">
        <div className="p-6">
          <p className="text-lg font-medium">Wait! May we know why you are cancelling?</p>
          <hr className="border-(--color-tertiary) opacity-30 my-2" />
          <div className="flex flex-col gap-2">
            {CANCEL_REASONS.map((reason) => (
              <label key={reason} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="cancel-reason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={() => onSelect(reason)}
                  className="accent-primary"
                />
                {reason}
              </label>
            ))}
          </div>
        </div>

        <hr className="border-(--color-tertiary) opacity-30" />
        <div className="flex h-11 w-full">
          <button
            type="button"
            onClick={onKeep}
            disabled={isCancelling}
            className="w-1/2 text-sm text-primary font-medium disabled:opacity-60"
          >
            No, keep it
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isCancelling}
            className="w-1/2 bg-primary text-white text-sm font-medium disabled:opacity-70"
          >
            {isCancelling ? "Cancelling..." : "Confirm Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Report card                                                                */
/* -------------------------------------------------------------------------- */

export default function ReportCard({
  imageSrc = "",
  reportId,
  itemName,
  dateReported,
  status, // "open" | "cancelled" | "resolved" (optional, see below)
  dateCancelled, // kept so existing callers keep working
  onCancel, // called with (reportId, reason) after a successful cancel
  navBack = null,
}) {
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);
  const [openMatches, setOpenMatches] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Callers that only pass dateCancelled still get the right status
  const reportStatus = status ?? (dateCancelled ? "cancelled" : "open");
  const isCancelled = reportStatus === "cancelled";
  const isResolved = reportStatus === "resolved";
  const hasMatches = matches.length > 0;

  const badgeKind = isCancelled ? "cancelled" : isResolved ? "resolved" : hasMatches ? "match" : null;

  // Routes (unchanged from the old card; navBack adds the extra path segment)
  const viewPath = navBack ? `/report/${reportId}/mode/view/${reportId}` : `/report/${reportId}/mode/view`;
  const editPath = navBack ? `/report/${reportId}/${reportId}` : `/report/${reportId}`;
  const matchPath = (matchId) =>
    navBack ? `/profile/match-details/${matchId}/${reportId}` : `/profile/match-details/${matchId}`;

  // Cancelled reports never show matches, so don't request them
  useEffect(() => {
    if (!reportId || isCancelled) return;

    let ignore = false;

    (async () => {
      try {
        const res = await fetchWithAuth(`${API_URL}/api/match-records/${reportId}/lost-report`);
        if (!res.ok) throw new Error(`Failed to fetch matches (${res.status})`);
        const data = await res.json();
        if (!ignore) setMatches(Array.isArray(data) ? data : []);
      } catch (err) {
        // No toast here: with many cards on screen one failure would spam the user
        console.error(err);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [reportId, isCancelled]);

  const closeModal = () => {
    setSelectedReason("");
    setOpenCancel(false);
  };

  const handleCancelReport = async () => {
    if (!selectedReason) {
      showToast("Please select a reason");
      return;
    }

    setIsCancelling(true);

    try {
      const res = await fetchWithAuth(`${API_URL}/api/lost-reports/${reportId}/cancel`, {
        method: "PUT",
        body: JSON.stringify({ reason: selectedReason }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to cancel report");

      closeModal();
      onCancel?.(reportId, selectedReason);
      showToast("Report successfully cancelled");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to cancel report");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      <div className="w-full bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
        {/* Top: image + details, tap to view */}
        <button
          type="button"
          onClick={() => navigate(viewPath)}
          className="w-full flex gap-3 p-3.5 text-left"
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={itemName ?? "lost item"}
              className="w-[90px] h-[90px] rounded-[10px] object-cover shrink-0"
            />
          ) : (
            <ImageFallback
              className="w-[90px] h-[90px] rounded-[10px] shrink-0"
              iconClass="text-3xl"
            />
          )}

          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <StatusBadge kind={badgeKind} />

            <p className="text-xs text-[#4B2D23]/80 mt-0.5">Report ID:</p>
            <p className="text-sm font-bold mb-1">{formatReportId(reportId)}</p>

            <p className="text-xs text-[#4B2D23]/80 mt-0.5">Lost Item Name:</p>
            <p className="text-sm font-bold mb-1 break-words">{itemName ?? "—"}</p>

            <p className="text-xs text-[#4B2D23]/80 mt-0.5">Date Reported:</p>
            <p className="text-sm font-semibold">{formatDate(dateReported)}</p>
          </div>
        </button>

        {/* Divider + View Matches toggle */}
        {hasMatches && !isCancelled && (
          <>
            <div className="h-px bg-black/[0.07] mx-3.5 mb-3" />
            <div className="px-3.5 pb-3">
              <button
                type="button"
                onClick={() => setOpenMatches((prev) => !prev)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-(--color-quaternary) text-sm font-bold text-primary"
              >
                {openMatches ? "Hide Matches" : `View Matches (${matches.length})`}
                <i className={`fa-solid fa-chevron-${openMatches ? "up" : "down"} text-xs`} />
              </button>
            </div>
          </>
        )}

        {/* Match cards */}
        {openMatches && hasMatches && !isCancelled && (
          <div className={`grid grid-cols-2 gap-2.5 px-3.5 ${isResolved ? "pb-[18px]" : "pb-1"}`}>
            {matches.map((match, index) => (
              <MatchCard
                key={match.match_id ?? match.found_report_id}
                match={match}
                label={`Potential Match ${index + 1}`}
                onClick={() => navigate(matchPath(match.match_id))}
              />
            ))}
          </div>
        )}

        {/* Footer actions */}
        {!isCancelled && !isResolved && (
          <div className="flex border-t border-black/[0.07] mt-3">
            <button
              type="button"
              onClick={() => navigate(editPath)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold text-primary"
            >
              <i className="fa-regular fa-pen-to-square" />
              Edit Report
            </button>
            <div className="w-px bg-black/[0.07]" />
            <button
              type="button"
              onClick={() => setOpenCancel(true)}
              className="flex-1 flex items-center justify-center py-3 text-sm font-semibold text-white bg-primary"
            >
              Cancel Report
            </button>
          </div>
        )}
      </div>

      <CancelReasonModal
        open={openCancel}
        selectedReason={selectedReason}
        onSelect={setSelectedReason}
        onKeep={closeModal}
        onConfirm={handleCancelReport}
        isCancelling={isCancelling}
      />
    </>
  );
}