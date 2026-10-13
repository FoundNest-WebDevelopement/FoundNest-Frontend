import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Toast from "../user-native/Toast";
import Icon from "../user-native/Icon";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import SafeImage from "../user-native/SafeImage";

const API_URL = import.meta.env.VITE_API_URL;

// Same wording as CancelReasonModal in the native app
const CANCEL_REASONS = ["I found it myself.", "I'm no longer looking for it.", "I duplicated a report."];

const formatReportId = (id) => `RPT-${String(id).padStart(5, "0")}`;
const formatItemId = (id) => `SI-${String(id).padStart(5, "0")}`;

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

// The read state of a match lives on its notification (is_read). Every card on the history
// page needs it, so the list is fetched once and shared for a few seconds.
let notificationsCache = { at: 0, promise: null };
function loadNotifications() {
  const userId = localStorage.getItem("user_id");
  if (!userId) return Promise.resolve([]);
  if (notificationsCache.promise && Date.now() - notificationsCache.at < 4000) return notificationsCache.promise;

  const promise = fetchWithAuth(`${API_URL}/api/notifications/user/${userId}`)
    .then((res) => (res.ok ? res.json() : []))
    .then((data) => (Array.isArray(data) ? data : []))
    .catch(() => []);
  notificationsCache = { at: Date.now(), promise };
  return promise;
}

const showToast = (message) => toast.custom(() => <Toast message={message} solid={true} />, { duration: 1500 });

function ImageFallback({ className, size }) {
  return (
    <div className={`bg-[#EDE0D4] flex items-center justify-center ${className}`}>
      <Icon family="mci" name="image-off-outline" size={size} color="#B0A09A" />
    </div>
  );
}

function StatusBadge({ kind, reason }) {
  if (!kind) return null;
  const looks = {
    cancelled: "bg-[#D9D2CC] text-[#5C5048]",
    resolved: "bg-[#C8E6C9] text-[#2E7D32]",
    match: "bg-[#F5C518] text-[#1a1a1a]",
  };
  const label = { cancelled: "Cancelled", resolved: "Resolved", match: "Potential Match Found!" }[kind];
  return (
    <span className={`self-start rounded-[20px] px-2.5 py-[3px] mb-2 text-[11px] font-bold ${looks[kind]}`}>
      {label}
      {kind === "cancelled" && reason ? <span className="font-normal">{`: ${reason}`}</span> : null}
    </span>
  );
}

// "New" (red) for an unread match notification, "Viewed" (grey) once it has been read
function ReadMarker({ state }) {
  if (!state) return null;
  const unread = state === "unread";
  return (
    <span
      className={`absolute top-2 left-2 z-[1] flex items-center gap-1 rounded-[20px] px-2 py-[3px] text-[10px] font-bold ${
        unread ? "bg-[#EF4444] text-white" : "bg-white/90 text-[#6B5A52]"
      }`}
      style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
    >
      {unread ? (
        <span className="w-1.5 h-1.5 rounded-full bg-white" />
      ) : (
        <Icon name="checkmark-done" size={12} color="#6B5A52" />
      )}
      {unread ? "New" : "Viewed"}
    </span>
  );
}

function MatchCard({ match, label, readState, onClick }) {
  return (
    <div className="w-[47%]">
      <p className="text-[12px] font-extrabold text-[#1a1a1a] mb-1.5">{label}</p>

      <button
        type="button"
        onClick={onClick}
        className="block w-full text-left bg-[#FAF6F2] rounded-xl overflow-hidden border border-black/6 active:opacity-75"
      >
        <div className="relative w-full aspect-square">
          <ReadMarker state={readState} />
          {match.found_image_url ? (
            <SafeImage
              src={match.found_image_url}
              alt={match.found_item_name ?? "found item"}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageFallback className="w-full h-full" size={28} />
          )}

          {match.found_category_name && (
            <span
              className="absolute bottom-2 right-2 max-w-[calc(100%-16px)] truncate bg-white rounded-[20px] px-2 py-[3px] text-[10px] font-bold text-[#1a1a1a]"
              style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.15)" }}
            >
              {match.found_category_name}
            </span>
          )}
        </div>

        <div className="p-2 flex flex-col gap-[3px]">
          <p className="text-[11px] font-bold text-primary mb-0.5">{formatItemId(match.found_item_id)}</p>
          <p className="text-[12px] font-bold text-[#1a1a1a] line-clamp-2">{match.found_item_name ?? "—"}</p>
          <div className="h-px bg-black/[0.08] my-1" />
          <div className="flex items-center gap-[3px] min-w-0">
            <Icon name="calendar-outline" size={11} color="rgba(0,0,0,0.65)" />
            <span className="text-[10px] text-black/65 truncate">{formatDate(match.found_date)}</span>
          </div>
          <div className="flex items-center gap-[3px] min-w-0">
            <Icon name="location-outline" size={11} color="rgba(0,0,0,0.65)" />
            <span className="text-[10px] text-black/65 truncate">{match.location_found ?? "—"}</span>
          </div>
        </div>
      </button>
    </div>
  );
}

function CancelReasonModal({ open, selectedReason, onSelect, onKeep, onConfirm, isCancelling }) {
  if (!open) return null;
  const canConfirm = !!selectedReason && !isCancelling;

  return (
    <div
      className="fixed inset-0 z-[5000] bg-black/45 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      onClick={() => !isCancelling && onKeep()}
    >
      <div className="w-[82%] max-w-sm bg-white rounded-[14px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <p className="text-[17px] font-extrabold text-[#1a1a1a] px-5 pt-[22px] pb-[18px] leading-6">
          Wait! May we know why
          <br />
          you are cancelling?
        </p>
        <div className="h-px bg-black/10" />

        <div className="py-2.5 px-5">
          {CANCEL_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => onSelect(reason)}
              className="w-full flex items-center py-[11px] gap-3 text-left active:opacity-70"
            >
              <span
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedReason === reason ? "border-primary" : "border-[#BBBBBB]"
                }`}
              >
                {selectedReason === reason && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </span>
              <span className="text-[14px] text-[#1a1a1a]">{reason}</span>
            </button>
          ))}
        </div>

        <div className="h-px bg-black/10" />

        <div className="flex h-[50px]">
          <button
            type="button"
            onClick={onKeep}
            disabled={isCancelling}
            className="flex-1 flex items-center justify-center bg-[#F0EEEE] text-[15px] font-semibold text-[#1a1a1a] active:opacity-70"
          >
            No, keep it
          </button>
          <div className="w-px bg-black/10" />
          <button
            type="button"
            onClick={() => canConfirm && onConfirm()}
            className={`flex-1 flex items-center justify-center text-[15px] font-semibold ${
              canConfirm ? "bg-primary text-white active:opacity-70" : "bg-[#C0A0A0] text-white/60"
            }`}
          >
            {isCancelling ? "Cancelling..." : "Confirm Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Report card (ReportCard of the native Report History screen)                */
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
  cancelReason = null,
  // The history page loads every report's matches itself (for its Matched filter) and hands
  // them down; when `matchesManaged` is set the card does not fetch them again.
  matchesProp,
  matchesManaged = false,
}) {
  const navigate = useNavigate();

  const [fetchedMatches, setMatches] = useState([]);
  const matches = matchesManaged ? (matchesProp ?? []) : fetchedMatches;
  const [openMatches, setOpenMatches] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [readByMatch, setReadByMatch] = useState({});

  // Callers that only pass dateCancelled still get the right status
  const reportStatus = status ?? (dateCancelled ? "cancelled" : "open");
  const isCancelled = reportStatus === "cancelled";
  const isResolved = reportStatus === "resolved";
  const hasMatches = matches.length > 0;

  const badgeKind = isCancelled ? "cancelled" : isResolved ? "resolved" : hasMatches ? "match" : null;

  const viewPath = navBack ? `/report/${reportId}/mode/view/${reportId}` : `/profile/report/${reportId}/mode/view`;
  const editPath = navBack ? `/report/${reportId}/${reportId}` : `/report/${reportId}`;
  const matchPath = (matchId) =>
    navBack ? `/profile/match-details/${matchId}/${reportId}` : `/profile/match-details/${matchId}`;

  // Cancelled reports never show matches, so don't request them
  useEffect(() => {
    if (!reportId || isCancelled || matchesManaged) return;

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
  }, [reportId, isCancelled, matchesManaged]);

  // Which of this report's matches have been read (from the notifications)
  useEffect(() => {
    if (!reportId || isCancelled) return;
    let ignore = false;
    loadNotifications().then((list) => {
      if (ignore) return;
      const map = {};
      list.forEach((n) => {
        if (n.match_id == null || String(n.lost_report_id) !== String(reportId)) return;
        // several notifications can point at one match: it counts as unread if any is
        map[n.match_id] = map[n.match_id] === "unread" || !n.is_read ? "unread" : "read";
      });
      setReadByMatch(map);
    });
    return () => {
      ignore = true;
    };
  }, [reportId, isCancelled]);

  const readStateOf = (match) => {
    if (typeof match.is_read === "boolean") return match.is_read ? "read" : "unread";
    return readByMatch[match.match_id] ?? null;
  };
  const unreadCount = matches.filter((m) => readStateOf(m) === "unread").length;

  const closeModal = () => {
    setSelectedReason("");
    setOpenCancel(false);
  };

  const handleCancelReport = async () => {
    if (!selectedReason) return;

    setIsCancelling(true);

    try {
      const res = await fetchWithAuth(`${API_URL}/api/lost-reports/${reportId}/cancel`, {
        method: "PUT",
        body: JSON.stringify({ reason: selectedReason }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data.message || data.error || "Failed to cancel report");

      closeModal();
      onCancel?.(reportId, selectedReason);
      showToast("Report Cancelled. Thank you for your feedback!");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to cancel report");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <>
      <div
        className="w-full bg-white rounded-2xl overflow-hidden flex flex-col"
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
      >
        <button type="button" onClick={() => navigate(viewPath)} className="w-full flex gap-3 p-3.5 text-left">
          {imageSrc ? (
            <SafeImage src={imageSrc} alt={itemName ?? "lost item"} className="w-[90px] h-[90px] rounded-[10px] object-cover shrink-0" />
          ) : (
            <ImageFallback className="w-[90px] h-[90px] rounded-[10px] shrink-0" size={32} />
          )}

          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <StatusBadge kind={badgeKind} reason={cancelReason} />

            <p className="text-[12px] text-black/65 mt-0.5">Report ID:</p>
            <p className="text-[14px] font-bold text-[#1a1a1a] mb-1">{formatReportId(reportId)}</p>

            <p className="text-[12px] text-black/65 mt-0.5">Lost Item Name:</p>
            <p className="text-[14px] font-bold text-[#1a1a1a] mb-1 break-words">{itemName ?? "—"}</p>

            <p className="text-[12px] text-black/65 mt-0.5">Date Reported:</p>
            <p className="text-[14px] font-semibold text-[#1a1a1a]">{formatDate(dateReported)}</p>
          </div>
        </button>

        {/* Divider + View Matches toggle */}
        {hasMatches && !isCancelled && (
          <>
            <div className="h-px bg-black/[0.07] mx-3.5 mb-3" />
            <button
              type="button"
              onClick={() => setOpenMatches((prev) => !prev)}
              className="flex items-center justify-center gap-1.5 mx-3.5 mb-3 py-[11px] rounded-[10px] bg-[#F5C518] active:opacity-80"
            >
              <span className="text-[14px] font-bold text-primary">{openMatches ? "Hide Matches" : "View Matches"}</span>
              {!openMatches && unreadCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
              <Icon name={openMatches ? "chevron-up" : "chevron-down"} size={18} color="#8B0000" />
            </button>
          </>
        )}

        {openMatches && hasMatches && !isCancelled && (
          <div className={`flex flex-wrap gap-2.5 px-3.5 ${isResolved ? "pb-[18px]" : "pb-1"}`}>
            {matches.map((match, index) => (
              <MatchCard
                key={match.match_id ?? match.found_report_id}
                match={match}
                label={`Potential Match ${index + 1}`}
                readState={readStateOf(match)}
                onClick={() => navigate(matchPath(match.match_id))}
              />
            ))}
          </div>
        )}

        {!isCancelled && !isResolved && (
          <div className="flex border-t border-black/[0.07] mt-3">
            <button
              type="button"
              onClick={() => navigate(editPath)}
              className="flex-1 flex items-center justify-center gap-1.5 py-[13px] active:opacity-70"
            >
              <Icon family="mci" name="pencil-outline" size={16} color="#8B0000" />
              <span className="text-[14px] font-semibold text-primary">Edit Report</span>
            </button>
            <div className="w-px bg-black/[0.07]" />
            <button
              type="button"
              onClick={() => setOpenCancel(true)}
              className="flex-1 flex items-center justify-center py-[13px] bg-primary active:opacity-80"
            >
              <span className="text-[14px] font-semibold text-white">Cancel Report</span>
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
