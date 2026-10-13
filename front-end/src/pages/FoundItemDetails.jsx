import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import StackHeader from "../user-native/StackHeader";
import Icon from "../user-native/Icon";
import ImageViewer from "../user-native/ImageViewer";
import HowToClaimSheet from "../user-native/HowToClaimSheet";
import SafeImage from "../user-native/SafeImage";

const API_URL = import.meta.env.VITE_API_URL;

// "10/13/2026 | 02:40 PM" (same format the Find gallery passes to the native details screen)
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

const formatItemId = (id) => `SI-${String(id).padStart(5, "0")}`;

function InfoBlock({ label, children, normalWeight = false }) {
  return (
    <div className="mb-[15px]">
      <p className="text-[13px] text-[#555] mb-1">{label}</p>
      <p className={`text-[15px] text-black ${normalWeight ? "font-normal leading-5" : "font-semibold"}`}>{children}</p>
    </div>
  );
}

export default function FoundItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState();
  const [error, setError] = useState(null);
  const [howToClaim, setHowToClaim] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  const fetchReport = async (reportId) => {
    try {
      setError(null);
      const res = await fetchWithAuth(`${API_URL}/api/found-reports/public/${reportId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || `Request failed (${res.status})`);
      }
      setReport(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  useEffect(() => {
    if (id) {
      fetchReport(id);
    }
  }, [id]);

  return (
    <div className="bg-[#FAF5F0] min-h-[calc(100vh-70px)] lg:min-h-screen">
      <StackHeader title="Item Details" height={56} onBack={() => navigate("/find")} />

      {report ? (
        <div className="p-[15px] pb-10 lg:p-10 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-8 lg:items-start">
          <button
            type="button"
            onClick={() => setImageOpen(true)}
            className="relative block w-full h-[300px] md:h-[420px] lg:h-auto lg:sticky lg:top-6 rounded-[15px] overflow-hidden mb-5 lg:mb-0 bg-[#ccc] md:bg-[#EFE9E3]"
          >
            <SafeImage src={report.image_url} alt={report.item_name} className="w-full h-full object-cover md:object-contain lg:h-auto lg:max-h-[600px]" placeholderClassName="lg:min-h-[360px]" iconSize={48} />
            <span className="absolute bottom-[15px] right-[15px] bg-black/60 p-2 rounded-full flex">
              <Icon name="expand-outline" size={20} color="#FFFFFF" />
            </span>
          </button>

          <div className="bg-white rounded-[15px] p-5 flex flex-col" style={{ boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
            <p className="text-[22px] font-bold text-black mb-2">{report.item_name}</p>

            <div className="h-px bg-[#EBEBEB] mb-[15px]" />

            <InfoBlock label="ITEM ID">{formatItemId(report.item_id)}</InfoBlock>
            <InfoBlock label="Category">{report.category_name}</InfoBlock>
            {report.description ? (
              <InfoBlock label="Description" normalWeight>
                {report.description}
              </InfoBlock>
            ) : null}
            <InfoBlock label="Location Found">{report.location_found}</InfoBlock>
            <InfoBlock label="Date & Time Found">{formatDateTime(report.found_date)}</InfoBlock>
            <InfoBlock label="Current Location">{report.office_name}</InfoBlock>

            <div className="h-px bg-[#EBEBEB] mb-[15px]" />

            <button
              type="button"
              onClick={() => setHowToClaim(true)}
              className="w-full bg-[#A31D1D] rounded-[10px] py-[15px] mt-2.5 mb-3 text-white font-bold text-[15px] active:opacity-80"
            >
              How to claim?
            </button>
            <button
              type="button"
              disabled={!report.office_id}
              onClick={() => navigate(`/map?officeId=${report.office_id}`)}
              className="w-full bg-white rounded-[10px] border-[1.5px] border-[#A31D1D] py-3.5 text-[#A31D1D] font-bold text-[15px] active:opacity-80 disabled:opacity-50"
            >
              View Office Location
            </button>
          </div>
        </div>
      ) : error ? (
        <p className="text-center py-10 text-red-500">{error}</p>
      ) : (
        <div className="flex items-center justify-center py-[40vh]">
          <p className="text-[#666]">Loading item details...</p>
        </div>
      )}

      <HowToClaimSheet visible={howToClaim} onClose={() => setHowToClaim(false)} />
      <ImageViewer uri={report?.image_url} visible={imageOpen} onClose={() => setImageOpen(false)} withClose />
    </div>
  );
}
