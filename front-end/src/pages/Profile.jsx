import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import QRItem from "./QRItem";
import ChangePassword from "./ChangePassword";
import AlertDialog from "../components/AlertDialog";
import Toast from "../user-native/Toast";
import PhotoSheet from "../components/report_components/PhotoSheet";
import WebcamCaptureModal from "../components/report_components/WebcamCaptureModal";
import AppHeader from "../user-native/AppHeader";
import StackHeader from "../user-native/StackHeader";
import Icon from "../user-native/Icon";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { isMobileDevice } from "../utils/isMobileDevice";
import { useUnsavedChangesGuard } from "../context/UnsavedChangesContext";
import SafeImage from "../user-native/SafeImage";

const API_URL = import.meta.env.VITE_API_URL;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

const showToast = (message, type = "success") =>
  toast.custom(() => <Toast message={message} solid type={type} />, { duration: 2000 });

// The contact number can be stored as +639XXXXXXXXX (web) or 09XXXXXXXXX (mobile).
// The form shows it the way the native app does (09XXXXXXXXX) and saves +63XXXXXXXXXX.
const toLocalNumber = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.startsWith("63") && digits.length === 12) return `0${digits.slice(2)}`;
  if (digits.startsWith("9") && digits.length === 10) return `0${digits}`;
  return digits;
};

const SETTINGS_ITEMS = [
  { key: "account", label: "Account Details", icon: "person-outline" },
  { key: "history", label: "Report History", icon: "time-outline" },
  { key: "password", label: "Change Password", icon: "lock-closed-outline" },
  { key: "qr", label: "QR an Item", icon: "qr-code-outline" },
];

function SettingsRow({ icon, label, onClick, isLogout = false, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center py-[15px] px-3 text-left active:opacity-60 ${disabled ? "opacity-50" : ""}`}
    >
      <span className="mr-3.5 w-6 flex justify-center">
        <Icon name={icon} size={22} color={isLogout ? "#C0392B" : "#1a1a1a"} />
      </span>
      <span className={`flex-1 text-[15px] ${isLogout ? "text-[#C0392B] font-semibold" : "text-[#1a1a1a]"}`}>{label}</span>
      {!isLogout && <Icon name="chevron-forward" size={20} color="#8B0000" />}
    </button>
  );
}

function Avatar({ url, size, iconSize, name }) {
  return url ? (
    <SafeImage src={url} alt={name} className="rounded-full object-cover" style={{ width: size, height: size }} iconSize={Math.round(size / 3)} />
  ) : (
    <span
      className="rounded-full bg-[#E0E0E0] flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Icon name="person" size={iconSize} color={size > 80 ? "#A8A8A8" : "#AAAAAA"} />
    </span>
  );
}

function ReadOnlyBox({ label, value }) {
  return (
    <div className="mb-[18px]">
      <p className="text-[15px] font-bold text-[#1a1a1a] mb-2">{label}</p>
      <div className="flex items-center bg-white rounded-xl px-3.5 h-14 border border-[#D6D6D6]">
        <p className="flex-1 min-w-0 text-[16px] text-[#1a1a1a] truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const [page, setPage] = useState("main");
  const [contactNumber, setContactNumber] = useState("");
  const [originalContact, setOriginalContact] = useState("");
  const [editingContact, setEditingContact] = useState(false);
  const [contactError, setContactError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [discardMode, setDiscardMode] = useState("leave"); // "leave" = back arrow, "cancel" = Cancel button
  const user_id = localStorage.getItem("user_id");

  const isActingAsUser =
    localStorage.getItem("acting_as_admin") === "true" ||
    localStorage.getItem("acting_as_super_admin") === "true";

  const [user, setUser] = useState({
    name: "",
    studentId: "",
    facultyId: "",
    firstName: "",
    lastName: "",
    email: "",
  });

  const [profileImageUrl, setProfileImageUrl] = useState(localStorage.getItem("profile_image_url") || null);

  // profile picture
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [confirmRemovePhoto, setConfirmRemovePhoto] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // logout
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const firstName = localStorage.getItem("first_name") || "";
    const lastName = localStorage.getItem("last_name") || "";
    const email = localStorage.getItem("email") || "";
    const studentNumber = localStorage.getItem("student_number") || "";
    const facultyId = localStorage.getItem("faculty_id") || "";

    setUser({
      name: `${firstName} ${lastName}`.trim() || email || "—",
      studentId: studentNumber,
      facultyId,
      firstName,
      lastName,
      email,
    });
  }, []);

  // Load the saved profile (names, ID, e-mail, contact number, photo) from the
  // server so this page never shows stale or empty values; localStorage is
  // only the instant first paint.
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetchWithAuth(`${API_URL}/api/profile/${user_id}`);
        const data = await res.json();
        if (!res.ok) return;

        const firstName = data.first_name ?? "";
        const lastName = data.last_name ?? "";
        setUser((prev) => ({
          name: `${firstName} ${lastName}`.trim() || data.email || prev.name,
          studentId: data.student_number ?? prev.studentId,
          facultyId: data.faculty_id ?? prev.facultyId,
          firstName: firstName || prev.firstName,
          lastName: lastName || prev.lastName,
          email: data.email ?? prev.email,
        }));
        const local = toLocalNumber(data.contact_number);
        setContactNumber(local);
        setOriginalContact(local);

        setProfileImageUrl(data.profile_image_url || null);
        if (data.profile_image_url) {
          localStorage.setItem("profile_image_url", data.profile_image_url);
        } else {
          localStorage.removeItem("profile_image_url");
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (user_id) fetchProfile();
  }, [user_id]);

  /* ----------------------------- profile picture ----------------------------- */

  const uploadProfileImage = async (file) => {
    if (file.size > MAX_FILE_SIZE) {
      showToast("File size exceeds 10MB limit", "info");
      return;
    }
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      showToast("Invalid file type", "info");
      return;
    }

    setUploadingPicture(true);
    try {
      const formData = new FormData();
      formData.append("profile_image", file);
      const res = await fetchWithAuth(`${API_URL}/api/profile/${user_id}/picture`, {
        method: "PUT",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.message || "Failed to update profile picture.", "info");
        return;
      }
      setProfileImageUrl(data.profile_image_url);
      localStorage.setItem("profile_image_url", data.profile_image_url);
      showToast("Profile picture updated.");
    } catch (err) {
      console.error(err);
      showToast("Could not connect to server.", "info");
    } finally {
      setUploadingPicture(false);
    }
  };

  const removeProfileImage = async () => {
    setConfirmRemovePhoto(false);
    setUploadingPicture(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/api/profile/${user_id}/picture`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.message || "Failed to remove profile picture.", "info");
        return;
      }
      setProfileImageUrl(null);
      localStorage.removeItem("profile_image_url");
      showToast("Profile picture removed.");
    } catch (err) {
      console.error(err);
      showToast("Could not connect to server.", "info");
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) uploadProfileImage(file);
  };

  /* ------------------------------ contact number ------------------------------ */

  // Same rule as the native app: 09 followed by 9 digits
  const validateContact = (value) => /^09\d{9}$/.test(value.trim());
  const hasChanges = contactNumber !== originalContact;

  // An unsaved contact-number edit also guards the side navigation / tab bar (not just the back arrow)
  const { setDirty } = useUnsavedChangesGuard();
  useEffect(() => {
    if (page !== "accountDetails") return;
    setDirty(hasChanges);
    return () => setDirty(false);
  }, [page, hasChanges, setDirty]);

  const handleSavePress = () => {
    if (!validateContact(contactNumber)) {
      setContactError("Please enter a valid contact number.");
      return;
    }
    setContactError("");
    setConfirmSave(true);
  };

  const executeSave = async () => {
    setConfirmSave(false);
    setIsSaving(true);
    try {
      // The web stores numbers in +63 format
      const res = await fetchWithAuth(`${API_URL}/api/profile/${user_id}`, {
        method: "PUT",
        body: JSON.stringify({ contact_number: `+63${contactNumber.trim().slice(1)}` }),
      });

      if (res.ok) {
        setContactError("");
        setOriginalContact(contactNumber);
        setEditingContact(false);
        showToast("Changes saved successfully.");
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.message || "Failed to save changes.", "info");
      }
    } catch (err) {
      console.error(err);
      showToast("Could not connect to server.", "info");
    } finally {
      setIsSaving(false);
    }
  };

  const resetContact = () => {
    setContactNumber(originalContact);
    setContactError("");
    setEditingContact(false);
  };

  const handleBackFromDetails = () => {
    if (hasChanges) {
      setDiscardMode("leave");
      setShowDiscardModal(true);
    } else {
      resetContact();
      setPage("main");
    }
  };

  const handleCancel = () => {
    if (!hasChanges) {
      setEditingContact(false);
      return;
    }
    setDiscardMode("cancel");
    setShowDiscardModal(true);
  };

  /* --------------------------------- logout ---------------------------------- */

  const handleLogout = async () => {
    setShowLogoutModal(false);
    try {
      setIsLoggingOut(true);
      const refreshToken = localStorage.getItem("refreshToken");

      await fetchWithAuth(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoggingOut(false);
      const rememberedEmail = localStorage.getItem("remembered_email");
      localStorage.clear();
      if (rememberedEmail) {
        localStorage.setItem("remembered_email", rememberedEmail);
      }
      navigate("/");
    }
  };

  const handleSetting = (key) => {
    if (key === "account") setPage("accountDetails");
    else if (key === "history") navigate(`/profile/report-history/${user_id}`);
    else if (key === "password") setPage("changePassword");
    else if (key === "qr") setPage("qrItem");
  };

  /* ================================ MAIN PAGE ================================ */
  if (page === "main") {
    return (
      <div className="narrow-body bg-[#FFF1E0] min-h-[calc(100vh-70px)] lg:min-h-screen">
        <AppHeader title="Profile" redDesktop />

        <div className="px-4 pt-5 lg:px-6 lg:pt-8 lg:pb-10">
          {/* User card */}
          <div
            className="bg-white rounded-2xl p-4 flex items-center mb-7"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
          >
            <div className="mr-4">
              <Avatar url={profileImageUrl} size={70} iconSize={40} name={user.name} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[18px] font-bold text-[#1a1a1a] mb-2 break-words">{user.name}</p>
              <div className="h-px bg-black/[0.12] mb-2" />
              <p className="text-[14px] text-black/65">
                {user.studentId || !user.facultyId ? `Student ID: ${user.studentId || "—"}` : `Faculty ID: ${user.facultyId}`}
              </p>
            </div>
          </div>

          <div className="min-w-0">
          <p className="text-[20px] font-extrabold text-[#1a1a1a] mb-3.5 pl-1">Account Settings</p>

          <div className="bg-white rounded-2xl py-1 px-1" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
            {SETTINGS_ITEMS.map((item, index) => (
              <div key={item.key}>
                <SettingsRow
                  icon={item.icon}
                  label={item.label}
                  disabled={item.key === "password" && isActingAsUser}
                  onClick={() => handleSetting(item.key)}
                />
                {index < SETTINGS_ITEMS.length - 1 && <div className="h-px bg-black/[0.06] mx-3" />}
              </div>
            ))}

            {/* desktop: Log out lives at the bottom of the side navigation */}
            <div className="lg:hidden">
              <div className="h-px bg-black/[0.06] mx-3" />
              <SettingsRow icon="log-out-outline" label="Log out" isLogout onClick={() => setShowLogoutModal(true)} />
            </div>
          </div>
          </div>
        </div>

        {showLogoutModal && (
          <AlertDialog
            message="Are you sure you want to sign out of your account?"
            b1Label="Cancel"
            b2Label={isLoggingOut ? "Logging out..." : "Log out"}
            b1OnClick={() => setShowLogoutModal(false)}
            b2OnClick={handleLogout}
          />
        )}
      </div>
    );
  }

  /* ============================ ACCOUNT DETAILS ============================ */
  if (page === "accountDetails") {
    return (
      <div className="narrow-body bg-[#FFF1E0] min-h-[calc(100vh-70px)] lg:min-h-screen">
        <StackHeader title="Account Details" onBack={handleBackFromDetails} />

        <div className="pb-10">
          {/* Avatar */}
          <div className="flex flex-col items-center py-5">
            <div className="relative">
              <Avatar url={profileImageUrl} size={100} iconSize={46} name={user.name} />

              {uploadingPicture && (
                <div className="absolute inset-0 rounded-full bg-black/35 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowPhotoSheet(true)}
                disabled={uploadingPicture}
                aria-label="Change profile picture"
                className="absolute -bottom-0.5 -right-0.5 w-[30px] h-[30px] rounded-full bg-white border border-[#DDDDDD] flex items-center justify-center active:opacity-70"
              >
                <Icon name="create-outline" size={16} color="#8B0000" />
              </button>
            </div>
          </div>

          {/* Fields */}
          <div className="bg-white mx-4 rounded-3xl px-[18px] py-5 flex flex-col">
            <ReadOnlyBox label={user.studentId || !user.facultyId ? "Student Number" : "Faculty ID"} value={user.studentId || user.facultyId} />
            <ReadOnlyBox label="First Name" value={user.firstName} />
            <ReadOnlyBox label="Last Name" value={user.lastName} />

            {/* Contact number */}
            <div className="mb-[18px]">
              <p className="text-[15px] font-bold text-[#1a1a1a] mb-2">Contact Number</p>
              <div
                className={`flex items-center bg-white rounded-xl px-3.5 h-14 border ${
                  contactError
                    ? "border-[1.5px] border-[#C0392B]"
                    : editingContact
                      ? "border-[1.5px] border-primary"
                      : "border-[#D6D6D6]"
                }`}
              >
                <input
                  type="tel"
                  inputMode="tel"
                  value={contactNumber}
                  onChange={(e) => {
                    setContactNumber(e.target.value.replace(/\D/g, "").slice(0, 11));
                    if (contactError) setContactError("");
                  }}
                  disabled={!editingContact}
                  placeholder="e.g. 09171234567"
                  className="flex-1 min-w-0 text-[16px] text-[#1a1a1a] bg-transparent outline-none p-0 placeholder:text-[#B0B0B0]"
                />
                {!editingContact && (
                  <button
                    type="button"
                    onClick={() => {
                      setContactError("");
                      setEditingContact(true);
                    }}
                    aria-label="Edit contact number"
                    className="flex"
                  >
                    <Icon name="create-outline" size={20} color="#8B0000" />
                  </button>
                )}
              </div>
              {contactError ? <p className="text-[13px] text-[#C0392B] mt-1.5 ml-1">{contactError}</p> : null}
            </div>

            <ReadOnlyBox label="Email Address" value={user.email} />

            {/* Buttons */}
            <div className="mt-3 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSavePress}
                disabled={!hasChanges || isSaving}
                className={`bg-[#990000] rounded-xl h-[52px] flex items-center justify-center text-[16px] font-bold text-white active:opacity-80 ${
                  !hasChanges ? "opacity-45" : ""
                }`}
              >
                {isSaving ? (
                  <span className="inline-block w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  "Save Changes"
                )}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={!editingContact}
                className={`rounded-xl h-[52px] border border-primary flex items-center justify-center text-[16px] font-semibold active:opacity-80 ${
                  editingContact ? "text-primary" : "text-primary/30 opacity-45"
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFileChange} />
        <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        {showPhotoSheet && (
          <PhotoSheet
            title="Change Profile Picture"
            hasPhoto={!!profileImageUrl}
            onClose={() => setShowPhotoSheet(false)}
            onTake={() => {
              setShowPhotoSheet(false);
              if (isMobileDevice()) cameraInputRef.current?.click();
              else setShowWebcam(true);
            }}
            onChoose={() => {
              setShowPhotoSheet(false);
              galleryInputRef.current?.click();
            }}
            onRemove={() => {
              setShowPhotoSheet(false);
              setConfirmRemovePhoto(true);
            }}
          />
        )}

        {showWebcam && (
          <WebcamCaptureModal
            onClose={() => setShowWebcam(false)}
            onCapture={(file) => {
              setShowWebcam(false);
              uploadProfileImage(file);
            }}
          />
        )}

        {confirmRemovePhoto && (
          <AlertDialog
            message="Are you sure you want to remove your profile picture?"
            b1Label="Cancel"
            b2Label="Remove"
            b1OnClick={() => setConfirmRemovePhoto(false)}
            b2OnClick={removeProfileImage}
          />
        )}

        {confirmSave && (
          <AlertDialog
            message="Save changes to your contact number?"
            b1Label="Cancel"
            b2Label="Save"
            b1OnClick={() => setConfirmSave(false)}
            b2OnClick={executeSave}
          />
        )}

        {showDiscardModal && (
          <AlertDialog
            message="Discard changes? Unsaved edits will be lost."
            b1Label="Keep Editing"
            b2Label="Discard"
            b1OnClick={() => setShowDiscardModal(false)}
            b2OnClick={() => {
              setShowDiscardModal(false);
              resetContact();
              if (discardMode === "leave") setPage("main");
            }}
          />
        )}
      </div>
    );
  }

  /* ================================== QR ITEM ================================= */
  if (page === "qrItem") {
    return <QRItem onBack={() => setPage("main")} />;
  }

  /* ============================== CHANGE PASSWORD ============================== */
  if (page === "changePassword") {
    return <ChangePassword onBack={() => setPage("main")} />;
  }
}
