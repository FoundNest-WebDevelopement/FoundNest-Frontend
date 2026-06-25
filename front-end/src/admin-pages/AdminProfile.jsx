import { useEffect, useRef, useState } from "react";
import { Pencil, X, Upload } from "lucide-react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import AdminButton from "../admin-components/AdminButton";

export default function AdminProfile() {
  const API_URL = import.meta.env.VITE_API_URL;
  const userId = localStorage.getItem("user_id");

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit image modal
  const [openEditImage, setOpenEditImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  // ── Fetch admin profile ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetchWithAuth(
          `${API_URL}/api/profile/${userId}/admin`
        );
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchProfile();
  }, [userId]);

  // ── Formatters ───────────────────────────────────────────────────────────
  const formatUserId = (id) =>
    id ? `USR-${String(id).padStart(5, "0")}` : "--";

  const formatDate = (dateStr) => {
    if (!dateStr) return "--";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatLastLogin = (dateStr) => {
    if (!dateStr) return "--";
    const d = new Date(dateStr);
    const date = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${date} | ${time}`;
  };

  // ── Image selection ──────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadError("");
  };

  // ── Upload to backend ────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("profile_image", selectedFile);

      const res = await fetchWithAuth(
        `${API_URL}/api/profile/${userId}/picture`,
        { method: "PUT", body: formData }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Upload failed.");
      }

      const data = await res.json();

      // Update local state so UI reflects new image immediately
      setProfile((prev) => ({
        ...prev,
        profile_image_url: data.profile_image_url,
      }));

      // Also update localStorage so the top bar updates
      localStorage.setItem("profile_image_url", data.profile_image_url);

      handleCloseModal();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // ── Remove profile picture ───────────────────────────────────────────────
  const handleRemovePicture = async () => {
    setUploading(true);
    setUploadError("");

    try {
      const res = await fetchWithAuth(
        `${API_URL}/api/profile/${userId}/picture`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Remove failed.");
      }

      setProfile((prev) => ({ ...prev, profile_image_url: null }));
      localStorage.removeItem("profile_image_url");
      handleCloseModal();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCloseModal = () => {
    setOpenEditImage(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError("");
  };

  // ── Loading / error states ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#F5F5F5] flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen w-full bg-[#F5F5F5] flex items-center justify-center">
        <p className="text-sm text-red-400">Failed to load profile.</p>
      </div>
    );
  }

  const fullName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();

  return (
    <>
      <div className="min-h-screen w-full bg-[#F5F5F5] px-5 pt-5 xl:px-10 xl:pt-7 flex flex-col xl:flex-row gap-5">

        {/* ── Left Card ─────────────────────────────────────────────────── */}
        <div className="w-full xl:w-72 bg-white rounded-xl border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.1)] p-6 flex flex-col items-center gap-4">

          {/* Avatar */}
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#DDD9CF] flex-shrink-0 bg-gray-100 flex items-center justify-center">
            {profile.profile_image_url ? (
              <img
                src={profile.profile_image_url}
                alt={fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <i className="fa-regular fa-circle-user text-gray-300 text-5xl"></i>
            )}
          </div>

          {/* Name */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-base font-bold text-[#1A1208] text-center">
              {fullName || "--"}
            </p>
            {/* Role badge */}
            <span className="text-xs px-3 py-0.5 rounded-full bg-[#F3E8FF] text-[#7C3AED] font-medium">
              Administrator
            </span>
          </div>

          {/* Edit Profile Button */}
          <AdminButton
            icon={Pencil}
            label="Edit Profile"
            isSolid={true}
            isIcon={true}
            isBorder={true}
            isShadow={false}
            onClick={() => setOpenEditImage(true)}
          />

          {/* full-width style override so button spans the card */}
          <style>{`.edit-profile-btn { width: 100%; justify-content: center; }`}</style>

        </div>

        {/* ── Right Card ────────────────────────────────────────────────── */}
        <div className="flex-1 bg-white rounded-xl border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.1)] p-6 flex flex-col gap-6">

          <p className="text-base font-semibold text-[#1A1208]">
            Account Information
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* User ID */}
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                User ID
              </p>
              <p className="text-sm text-[#1A1208]">
                {formatUserId(profile.user_id)}
              </p>
            </div>

            {/* Student Number */}
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Student Number
              </p>
              <p className="text-sm text-[#1A1208]">
                {profile.student_number || "--"}
              </p>
            </div>

            {/* Full Name */}
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Full Name
              </p>
              <p className="text-sm text-[#1A1208]">{fullName || "--"}</p>
            </div>

            {/* BulSU Email */}
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                BulSU Email
              </p>
              <p className="text-sm text-[#1A1208]">
                {profile.email || "--"}
              </p>
            </div>

            {/* Department */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Department
              </p>
              <p className="text-sm text-[#1A1208]">
                {profile.college_name || "--"}
              </p>
            </div>

            {/* Divider */}
            <div className="sm:col-span-2 border-t border-[#DDD9CF]" />

            {/* Date Assigned */}
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Date Assigned
              </p>
              <p className="text-sm text-[#1A1208]">
                {formatDate(profile.date_assigned)}
              </p>
            </div>

            {/* Last Login */}
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Last Login
              </p>
              <p className="text-sm text-[#1A1208]">
                {formatLastLogin(profile.last_login)}
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* ── Edit Profile Image Modal ───────────────────────────────────────── */}
      {openEditImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border border-[#DDD9CF] shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-5">

            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#1A1208] text-base">
                Edit Profile Picture
              </p>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Preview */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-[#DDD9CF] bg-gray-100 flex items-center justify-center">
                {previewUrl || profile.profile_image_url ? (
                  <img
                    src={previewUrl || profile.profile_image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <i className="fa-regular fa-circle-user text-gray-300 text-5xl"></i>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-sm text-primary font-medium border border-primary rounded-md px-4 py-1.5 hover:bg-primary/5 transition-colors"
              >
                <Upload size={15} />
                Choose Photo
              </button>

              {selectedFile && (
                <p className="text-xs text-gray-400 text-center truncate max-w-[200px]">
                  {selectedFile.name}
                </p>
              )}
            </div>

            {/* Error */}
            {uploadError && (
              <p className="text-xs text-red-500 text-center">{uploadError}</p>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <AdminButton
                icon={Upload}
                label={uploading ? "Uploading..." : "Save Photo"}
                isSolid={true}
                isIcon={false}
                isBorder={true}
                isShadow={false}
                onClick={handleUpload}
              />

              {profile.profile_image_url && (
                <button
                  onClick={handleRemovePicture}
                  disabled={uploading}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors text-center disabled:opacity-50"
                >
                  Remove current photo
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}