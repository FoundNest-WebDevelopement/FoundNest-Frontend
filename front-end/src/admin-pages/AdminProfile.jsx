import { useEffect, useRef, useState } from "react";
import { Pencil, X, Upload, Eye, EyeOff } from "lucide-react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { changePassword } from "../utils/authApi";
import PasswordChecklist from "../components/PasswordChecklist";
import { isPasswordStrong } from "../utils/passwordRules";

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

  // Change password modal
  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

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
      setProfile((prev) => ({
        ...prev,
        profile_image_url: data.profile_image_url,
      }));
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

  // ── Change password ──────────────────────────────────────────────────────
  const isPasswordFormValid =
    currentPassword !== "" &&
    isPasswordStrong(newPassword) &&
    confirmPassword !== "" &&
    newPassword === confirmPassword;

  const handleChangePassword = async () => {
    if (!isPasswordFormValid || changingPassword) return;
    setPasswordError("");
    setChangingPassword(true);
    try {
      await changePassword(userId, currentPassword, newPassword);
      setPasswordSuccess(true);
      setTimeout(() => {
        handleClosePasswordModal();
      }, 1500);
    } catch (err) {
      setPasswordError(err.message || "Something went wrong. Please try again.");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleClosePasswordModal = () => {
    setOpenChangePassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPasswordError("");
    setPasswordSuccess(false);
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
      {/* ── Page Wrapper ──────────────────────────────────────────────────── */}
      <div className="w-full bg-[#F5F5F5] px-5 py-5 xl:px-15 xl:py-10 min-h-[calc(100vh-5rem)]">
        <div className="flex flex-col xl:flex-row gap-5 h-full min-h-[calc(100vh-10rem)]">

          {/* ── Left Card ───────────────────────────────────────────────── */}
          <div className="w-full xl:w-72 bg-white rounded-2xl shadow-md p-8 flex flex-col items-center gap-5 flex-1 xl:flex-none">

            {/* Avatar */}
            <div className="w-28 h-28 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center border-4 border-gray-200">
              {profile.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <i className="fa-regular fa-circle-user text-gray-400 text-6xl"></i>
              )}
            </div>

            {/* Name + Badge */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-lg font-bold text-[#1A1208] text-center">
                {fullName || "--"}
              </p>
              <span className="text-xs px-4 py-1 rounded-full bg-purple-100 text-purple-600 font-medium">
                Administrator
              </span>
            </div>

            {/* Edit Profile Button — full width */}
            <button
              onClick={() => setOpenEditImage(true)}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-lg py-3 text-sm font-semibold hover:opacity-90 transition active:scale-95 cursor-pointer"
            >
              <Pencil size={15} />
              Edit Profile
            </button>

            {/* Security Section */}
            <div className="w-full flex flex-col gap-3 pt-2 border-t border-gray-100">
              <p className="text-sm font-semibold text-[#1A1208] pt-3">
                Security
              </p>
              <button
                onClick={() => setOpenChangePassword(true)}
                className="text-sm text-left text-gray-500 hover:text-primary transition-colors cursor-pointer"
              >
                Change Password
              </button>
            </div>

          </div>

          {/* ── Right Card ──────────────────────────────────────────────── */}
          <div className="flex-1 bg-white rounded-2xl shadow-md p-8 flex flex-col gap-6 min-h-full">

            <p className="text-lg font-semibold text-[#1A1208]">
              Account Information
            </p>

            {/* Grid of fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">

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

              {/* Department — full width */}
              <div className="flex flex-col gap-1 sm:col-span-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  Department
                </p>
                <p className="text-sm text-[#1A1208]">
                  {profile.college_name || "--"}
                </p>
              </div>

              {/* Divider */}
              <div className="sm:col-span-2 border-t border-gray-100" />

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
      </div>

      {/* ── Edit Profile Image Modal ───────────────────────────────────────── */}
      {openEditImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => !uploading && handleCloseModal()}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >

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
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100 flex items-center justify-center">
                {previewUrl || profile.profile_image_url ? (
                  <img
                    src={previewUrl || profile.profile_image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <i className="fa-regular fa-circle-user text-gray-400 text-5xl"></i>
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
              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-lg py-3 text-sm font-semibold hover:opacity-90 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Upload size={15} />
                {uploading ? "Uploading..." : "Save Photo"}
              </button>

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

      {/* ── Change Password Modal ─────────────────────────────────────────── */}
      {openChangePassword && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => !changingPassword && handleClosePasswordModal()}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#1A1208] text-base">
                Change Password
              </p>
              <button
                onClick={handleClosePasswordModal}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {passwordSuccess ? (
              <p className="text-sm text-green-600 text-center py-4">
                Password changed successfully.
              </p>
            ) : (
              <>
                {/* Current Password */}
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium text-gray-500">Current Password</p>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        setPasswordError("");
                      }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm outline-none focus:border-primary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium text-gray-500">New Password</p>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordError("");
                      }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm outline-none focus:border-primary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                  <PasswordChecklist password={newPassword} variant="light" />
                </div>

                {/* Confirm New Password */}
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium text-gray-500">Confirm New Password</p>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPasswordError("");
                      }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm outline-none focus:border-primary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword !== "" && confirmPassword !== newPassword && (
                    <p className="text-xs text-red-500">Passwords do not match.</p>
                  )}
                </div>

                {passwordError && (
                  <p className="text-xs text-red-500 text-center">{passwordError}</p>
                )}

                <button
                  onClick={handleChangePassword}
                  disabled={!isPasswordFormValid || changingPassword}
                  className="w-full bg-primary text-white rounded-lg py-3 text-sm font-semibold hover:opacity-90 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {changingPassword ? "Saving..." : "Save Changes"}
                </button>
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
}