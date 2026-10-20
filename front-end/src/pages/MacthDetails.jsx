import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import StackHeader from "../user-native/StackHeader";
import Icon from "../user-native/Icon";
import ImageViewer from "../user-native/ImageViewer";
import HowToClaimSheet from "../user-native/HowToClaimSheet";
import SafeImage from "../user-native/SafeImage";

const API_URL = import.meta.env.VITE_API_URL;

const formatItemId = (id) => `SI-${String(id).padStart(5, "0")}`;
const formatReportId = (id) => `RPT-${String(id).padStart(5, "0")}`;

// "—"-safe date/time formatting (long date, 12-hour time) like the mobile app
const formatDate = (value) => {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};
const formatTime = (value) => {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
};

// Location values may be stored as a JSON array; show them as a readable list
const parseValue = (value) => {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    const looksLikeJson =
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"'));

    if (looksLikeJson) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.filter(Boolean).join(", ");
        return parsed;
      } catch {
        return value;
      }
    }
  }

  return value;
};

const orNA = (val) => (!val || String(val).trim() === "" || val === "N/A" ? null : val);

function CompareImage({ uri, label, alt, onOpen }) {
  return (
    <div className="flex-1 min-w-0 flex flex-col items-center gap-2">
      <p className="text-[13px] font-semibold text-[#1a1a1a]">{label}</p>
      <button
        type="button"
        disabled={!uri}
        onClick={() => uri && onOpen(uri)}
        className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#EDE0D4] border border-black/20"
      >
        {uri ? (
          <>
            <SafeImage src={uri} alt={alt || label} className="w-full h-full object-cover" />
            <span className="absolute bottom-2 right-2 bg-black/45 rounded-md p-1 flex">
              <Icon name="expand-outline" size={18} color="#FFFFFF" />
            </span>
          </>
        ) : (
          <span className="w-full h-full flex items-center justify-center">
            <Icon name="image-outline" size={32} color="#B0A09A" />
          </span>
        )}
      </button>
    </div>
  );
}

function SectionDivider({ children }) {
  return (
    <div className="flex items-center my-4 gap-2.5">
      <div className="flex-1 h-px bg-black/15" />
      <p className="text-[15px] font-bold text-[#1a1a1a] text-center">{children}</p>
      <div className="flex-1 h-px bg-black/15" />
    </div>
  );
}

export default function MatchDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const userId = localStorage.getItem("user_id");

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [howToClaim, setHowToClaim] = useState(false);
  const [viewerUri, setViewerUri] = useState(null);

  const fetchMatchDetails = async () => {
    try {
      setError(null);
      const response = await fetchWithAuth(`${API_URL}/api/match-records/${id}/match`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch match");
      }

      setMatch(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to fetch match");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      window.scrollTo(0, 0);
      fetchMatchDetails();
    }
  }, [id]);

  // The native match screen always returns to the report history
  const handleBack = () => navigate(`/profile/report-history/${userId}`);

  if (loading) {
    return (
      <div className="narrow-body bg-[#FFF1E0] min-h-[calc(100vh-70px)] lg:min-h-screen">
        <StackHeader title="Potential Match" onBack={handleBack} />
        <div className="flex justify-center py-24">
          <div className="w-9 h-9 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="narrow-body bg-[#FFF1E0] min-h-[calc(100vh-70px)] lg:min-h-screen">
        <StackHeader title="Potential Match" onBack={handleBack} />
        <div className="flex flex-col items-center gap-3 p-4">
          <p className="text-sm text-red-500 text-center pt-10">{error || "We couldn't load this match."}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              fetchMatchDetails();
            }}
            className="border border-primary rounded-lg h-10 px-6 text-primary bg-white text-xs"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const foundId = match.found_item_id ?? match.found_report_id;
  const officeDisplay = orNA(match.office_name)
    ? `${match.office_name}${orNA(match.office_location) ? `\n${match.office_location}` : ""}`
    : null;

  const rows = [
    { label: "ID", your: formatReportId(match.lost_report_id), theirs: foundId != null ? formatItemId(foundId) : null },
    { label: "Category", your: match.lost_category_name, theirs: match.found_category_name },
    { label: "Item Name", your: match.lost_item_name, theirs: match.found_item_name },
    { label: "Description", your: match.lost_description, theirs: match.found_description },
    { label: "Contents", your: match.lost_contents, theirs: match.found_contents },
    { label: "Date Lost/Found", your: formatDate(match.lost_date), theirs: formatDate(match.found_date) },
    { label: "Time Lost/Found", your: formatTime(match.lost_date), theirs: formatTime(match.found_date) },
    { label: "Lost/Found At", your: parseValue(match.location_lost), theirs: parseValue(match.location_found) },
    { label: "Specific Location", your: match.lost_specific_location, theirs: match.found_specific_location },
    { label: "Currently At", your: match.lost_office_name, theirs: officeDisplay },
  ];

  const valueCell = (value, extra = "") => {
    const shown = orNA(value);
    return (
      <div className={`flex-1 min-w-0 py-2.5 px-2 flex items-center justify-center border-r border-black/[0.06] ${extra}`}>
        <p className={`text-[12px] text-center whitespace-pre-line break-words ${shown ? "text-[#1a1a1a]" : "text-black/65 italic"}`}>
          {shown ?? "Not specified"}
        </p>
      </div>
    );
  };

  return (
    <div className="narrow-body bg-[#FFF1E0] min-h-[calc(100vh-70px)] lg:min-h-screen">
      <StackHeader title={`Potential Match (${foundId != null ? formatItemId(foundId) : "—"})`} onBack={handleBack} />

      <div className="px-4 pt-1.5 pb-12 lg:pt-6 flex flex-col">
        <SectionDivider>Image Comparison</SectionDivider>

        <div className="bg-white rounded-2xl p-3 mb-2" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
          <div className="flex gap-3">
            <CompareImage uri={match.lost_image_url} label="Your Image" alt={match.lost_item_name} onOpen={setViewerUri} />
            <CompareImage uri={match.found_image_url} label="Potential Match" alt={match.found_item_name} onOpen={setViewerUri} />
          </div>
        </div>

        <SectionDivider>Item Description Comparison</SectionDivider>

        <div className="bg-white rounded-xl overflow-hidden border border-black/[0.08] mb-2">
          <div className="flex border-b border-black/[0.08]">
            <div className="w-[100px] shrink-0 py-2.5 px-2.5 border-r border-black/[0.06] bg-[#FAF6F2]" />
            <div className="flex-1 min-w-0 py-2.5 px-2 border-r border-black/[0.06] bg-[#fcde7d] flex items-center justify-center">
              <p className="text-[12px] font-bold text-[#1a1a1a] text-center">Your Report</p>
            </div>
            <div className="flex-1 min-w-0 py-2.5 px-2 bg-[#fcde7d] flex items-center justify-center">
              <p className="text-[12px] font-bold text-[#1a1a1a] text-center">Potential Match</p>
            </div>
          </div>

          {rows.map((row, idx) => (
            <div key={row.label} className={`flex ${idx === rows.length - 1 ? "" : "border-b border-black/[0.06]"}`}>
              <div className="w-[100px] shrink-0 py-2.5 px-2.5 flex items-center border-r border-black/[0.06] bg-[#FAF6F2]">
                <p className="text-[12px] font-semibold text-[#1a1a1a]">{row.label}</p>
              </div>
              {valueCell(row.your)}
              {valueCell(row.theirs, "border-r-0")}
            </div>
          ))}
        </div>

        <div className="h-px bg-black/10 my-5" />

        <button
          type="button"
          onClick={() => setHowToClaim(true)}
          className="bg-primary rounded-xl py-4 mb-3 text-[15px] font-bold text-white active:opacity-80"
        >
          How to Claim?
        </button>

        <button
          type="button"
          disabled={!match.office_id}
          onClick={() => navigate(`/map?officeId=${match.office_id}`)}
          className="rounded-xl py-[15px] border-2 border-primary text-[15px] font-bold text-primary active:opacity-80 disabled:opacity-50"
        >
          View Office Location
        </button>
      </div>

      <HowToClaimSheet visible={howToClaim} onClose={() => setHowToClaim(false)} />
      <ImageViewer uri={viewerUri} visible={!!viewerUri} onClose={() => setViewerUri(null)} />
    </div>
  );
}
