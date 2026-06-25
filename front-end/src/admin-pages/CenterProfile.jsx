import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { fetchWithAuth } from "../utils/fetchWithAuth";

export default function CenterProfile() {
  const API_URL = import.meta.env.VITE_API_URL;
  const officeId = localStorage.getItem("office_location");

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetchWithAuth(
          `${API_URL}/api/offices/${officeId}/profile`
        );
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (officeId) fetchProfile();
  }, [officeId]);

  // Generate Center ID like "CTR-001"
  const centerId = profile
    ? `CTR-${String(profile.office_id).padStart(3, "0")}`
    : "--";

  // Format date for Responsible Admins table
  const formatDate = (dateStr) => {
    if (!dateStr) return "--";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#F5F5F5] px-5 pt-5 xl:px-10 xl:pt-7 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading center profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen w-full bg-[#F5F5F5] px-5 pt-5 xl:px-10 xl:pt-7 flex items-center justify-center">
        <p className="text-sm text-red-400">Failed to load center profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] px-5 pt-5 xl:px-10 xl:pt-7 flex flex-col xl:flex-row gap-5">

      {/* ── Left Card: Center Identity & Stats ─────────────────────────────── */}
      <div className="w-full xl:w-72 bg-white rounded-xl border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.1)] p-6 flex flex-col items-center gap-4">

        {/* Office Image */}
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#DDD9CF] flex-shrink-0">
          {profile.image_url ? (
            <img
              src={profile.image_url}
              alt={profile.office_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <i className="fa-regular fa-building text-gray-300 text-3xl"></i>
            </div>
          )}
        </div>

        {/* Office Name */}
        <p className="text-base font-bold text-[#1A1208] text-center leading-snug">
          {profile.office_name}
        </p>

        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-[#FDC502]">
          <MapPin size={13} />
          <span className="text-[#1A1208]">{profile.floor || "—"}</span>
        </div>

        {/* Divider */}
        <div className="w-full border-t border-[#DDD9CF]" />

        {/* Stats Row */}
        <div className="w-full flex justify-around pt-1">
          <div className="flex flex-col items-center gap-0.5">
            <p className="text-2xl font-bold text-[#1A1208]">
              {profile.stats.total_items}
            </p>
            <p className="text-[11px] text-gray-400 text-center">Total Items</p>
          </div>

          <div className="w-px bg-[#DDD9CF]" />

          <div className="flex flex-col items-center gap-0.5">
            <p className="text-2xl font-bold text-green-500">
              {profile.stats.claimed}
            </p>
            <p className="text-[11px] text-gray-400 text-center">Claimed</p>
          </div>

          <div className="w-px bg-[#DDD9CF]" />

          <div className="flex flex-col items-center gap-0.5">
            <p className="text-2xl font-bold text-blue-400">
              {profile.stats.pending_claims}
            </p>
            <p className="text-[11px] text-gray-400 text-center">Pending Claims</p>
          </div>
        </div>
      </div>

      {/* ── Right Card: Details & Responsible Admins ────────────────────────── */}
      <div className="flex-1 bg-white rounded-xl border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.1)] p-6 flex flex-col gap-6">

        {/* Center Details Section */}
        <div>
          <p className="text-base font-semibold text-[#1A1208] mb-4">
            Center Details
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Center ID */}
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Center ID
              </p>
              <p className="text-sm text-[#1A1208]">{centerId}</p>
            </div>

            {/* Operating Hours */}
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Operating Hours
              </p>
              <p className="text-sm text-[#1A1208]">
                {profile.operating_hours || "—"}
              </p>
            </div>

            {/* Location Description */}
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Location Description
              </p>
              <p className="text-sm text-[#1A1208]">{profile.floor || "—"}</p>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Notes
              </p>
              <p className="text-sm text-[#1A1208]">
                {profile.description || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full border-t border-[#DDD9CF]" />

        {/* Responsible Admins Section */}
        <div>
          <p className="text-base font-semibold text-[#1A1208] mb-4">
            Responsible Admins
          </p>

          <div className="rounded-lg overflow-hidden border border-[#DDD9CF]">
            {/* Table Header */}
            <div className="grid grid-cols-2 bg-primary px-5 py-3">
              <p className="text-xs font-semibold text-white">Admin Name</p>
              <p className="text-xs font-semibold text-white">Date Assigned</p>
            </div>

            {/* Table Rows */}
            {profile.admins.length === 0 ? (
              <div className="px-5 py-4">
                <p className="text-sm text-gray-400">No admins assigned.</p>
              </div>
            ) : (
              profile.admins.map((admin, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-2 px-5 py-3 border-b border-[#DDD9CF] last:border-b-0 ${
                    i % 2 === 0 ? "bg-white" : "bg-[#FAFAF9]"
                  }`}
                >
                  <p className="text-sm text-[#1A1208]">
                    {admin.first_name} {admin.last_name}
                  </p>
                  <p className="text-sm text-gray-400">
                    {formatDate(admin.date_assigned)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}