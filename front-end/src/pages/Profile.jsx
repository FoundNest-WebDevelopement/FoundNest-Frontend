import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import QRItem from "./QRItem";

const EditIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#990000"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const AccountDetailsIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#4B2D23"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const ReportHistoryIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#4B2D23"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 3v5h5" />
    <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
  </svg>
);

const ChangePasswordIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#4B2D23"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const QRIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#4B2D23"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="3" height="3" />
    <line x1="21" y1="14" x2="21" y2="14" />
    <line x1="21" y1="21" x2="21" y2="21" />
    <line x1="17" y1="21" x2="21" y2="21" />
  </svg>
);

const LogoutIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#990000"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function Profile() {
  const navigate = useNavigate();
  const [page, setPage] = useState("main");
  const [contactNumber, setContactNumber] = useState("");
  const [editingContact, setEditingContact] = useState(false);
  const [contactError, setContactError] = useState("");
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [originalContact, setOriginalContact] = useState("");

  const [user, setUser] = useState({
    name: "",
    studentId: "",
    firstName: "",
    lastName: "",
    email: "",
  });

  useEffect(() => {
    const firstName = localStorage.getItem("first_name") || "";
    const lastName = localStorage.getItem("last_name") || "";
    const email = localStorage.getItem("email") || "";
    const studentNumber = localStorage.getItem("student_number") || "";

    setUser({
      name: `${firstName} ${lastName}`.trim() || "User",
      studentId: studentNumber,
      firstName,
      lastName,
      email,
    });
  }, []);

  const validateContact = (value) => {
    const phoneRegex = /^9\d{9}$/;
    return phoneRegex.test(value);
  };

  const isContactValid = validateContact(contactNumber);

  const handleEditContact = () => {
    setOriginalContact(contactNumber);
    setEditingContact(true);
  };

  const handleSaveChanges = () => {
    if (!validateContact(contactNumber)) {
      setContactError("Please enter a valid contact number.");
      return;
    }
    setContactError("");
    setEditingContact(false);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleBackFromDetails = () => {
    if (editingContact && contactNumber !== originalContact) {
      setShowDiscardModal(true);
    } else {
      setPage("main");
      setEditingContact(false);
      setContactError("");
    }
  };

  const handleDiscard = () => {
    setContactNumber(originalContact);
    setEditingContact(false);
    setContactError("");
    setShowDiscardModal(false);
    setPage("main");
  };

  // =====================
  // MAIN PROFILE PAGE
  // =====================
  if (page === "main") {
    return (
      <div
        className="flex flex-col min-h-screen mt-13 mb-16"
        style={{ backgroundColor: "#FFF3E0" }}
      >
        {/* Header */}
        <div className="bg-[#990000] px-5 py-4 rounded-b-xl">
          <p className="text-white font-bold text-lg">Profile</p>
        </div>

        <div className="px-5 py-5 flex flex-col gap-5">
          {/* User Card */}
          <div className="bg-white rounded-2xl px-4 py-4 flex items-center gap-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <AccountDetailsIcon />
            </div>
            <div className="flex-1">
              <p className="font-bold text-[#4B2D23] text-base">{user.name}</p>
              <div className="w-full h-[1.5px] bg-gray-200 my-1"></div>
              <p className="text-xs text-gray-500">
                Student ID: {user.studentId}
              </p>
            </div>
          </div>

          {/* Account Settings */}
          <div>
            <p className="font-bold text-[#4B2D23] text-base mb-3">
              Account Settings
            </p>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              {/* Account Details */}
              <button
                onClick={() => setPage("accountDetails")}
                className="flex items-center gap-4 px-4 py-4 w-full border-b border-gray-100"
              >
                <AccountDetailsIcon />
                <p className="flex-1 text-sm text-left text-[#4B2D23]">
                  Account Details
                </p>
                <ChevronRight size={16} color="#4B2D23" />
              </button>

              {/* Report History */}
              <button
                onClick={() => navigate("/report")}
                className="flex items-center gap-4 px-4 py-4 w-full border-b border-gray-100"
              >
                <ReportHistoryIcon />
                <p className="flex-1 text-sm text-left text-[#4B2D23]">
                  Report History
                </p>
                <ChevronRight size={16} color="#4B2D23" />
              </button>

              {/* Change Password */}
              <button className="flex items-center gap-4 px-4 py-4 w-full border-b border-gray-100">
                <ChangePasswordIcon />
                <p className="flex-1 text-sm text-left text-[#4B2D23]">
                  Change Password
                </p>
                <ChevronRight size={16} color="#4B2D23" />
              </button>

              {/* QR an Item */}
              <button
                onClick={() => setPage("qrItem")}
                className="flex items-center gap-4 px-4 py-4 w-full border-b border-gray-100"
              >
                <QRIcon />
                <p className="flex-1 text-sm text-left text-[#4B2D23]">
                  QR an Item
                </p>
                <ChevronRight size={16} color="#4B2D23" />
              </button>

              {/* Log out */}
              <button
                onClick={() => {
                  localStorage.clear();
                  navigate("/");
                }}
                className="flex items-center gap-4 px-4 py-4 w-full"
              >
                <LogoutIcon />
                <p className="flex-1 text-sm text-left text-[#990000] font-semibold">
                  Log out
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================
  // ACCOUNT DETAILS PAGE
  // =====================
  if (page === "accountDetails") {
    return (
      <div
        className="flex flex-col min-h-screen mt-13 mb-16"
        style={{ backgroundColor: "#FFF3E0" }}
      >
        {/* Header */}
        <div className="bg-[#990000] px-5 py-4 rounded-b-xl flex items-center gap-3">
          <button onClick={handleBackFromDetails}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <p className="text-white font-bold text-lg">Account Details</p>
        </div>

        <div className="px-5 py-5 flex flex-col gap-4">
          {/* Avatar */}
          <div className="flex justify-center mb-2">
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
              <AccountDetailsIcon />
            </div>
          </div>

          {/* Student Number */}
          <div>
            <p className="text-xs text-[#4B2D23] font-medium mb-1">
              Student Number
            </p>
            <div className="bg-white rounded-lg px-4 py-3 opacity-60">
              <p className="text-sm text-[#4B2D23]">{user.studentId}</p>
            </div>
          </div>

          {/* First Name */}
          <div>
            <p className="text-xs text-[#4B2D23] font-medium mb-1">
              First Name
            </p>
            <div className="bg-white rounded-lg px-4 py-3 opacity-60">
              <p className="text-sm text-[#4B2D23]">{user.firstName}</p>
            </div>
          </div>

          {/* Last Name */}
          <div>
            <p className="text-xs text-[#4B2D23] font-medium mb-1">Last Name</p>
            <div className="bg-white rounded-lg px-4 py-3 opacity-60">
              <p className="text-sm text-[#4B2D23]">{user.lastName}</p>
            </div>
          </div>

          {/* Contact Number */}
          <div>
            <p className="text-xs text-[#4B2D23] font-medium mb-1">
              Contact Number
            </p>
            <div
              className="bg-white rounded-lg px-4 py-3 flex items-center gap-2"
              style={{
                border: contactError
                  ? "1.5px solid #990000"
                  : editingContact
                    ? "1.5px solid #990000"
                    : "1.5px solid transparent",
              }}
            >
              {editingContact && (
                <span className="text-sm text-[#4B2D23] font-medium">+63</span>
              )}
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => {
                  setContactNumber(e.target.value);
                  setContactError("");
                }}
                disabled={!editingContact}
                placeholder="9XXXXXXXXX"
                maxLength={10}
                className="flex-1 text-sm text-[#4B2D23] outline-none bg-transparent"
              />
              <button onClick={handleEditContact}>
                <EditIcon />
              </button>
            </div>
            {contactError && (
              <p className="text-[#990000] text-xs mt-1">{contactError}</p>
            )}
          </div>

          {/* Email Address */}
          <div>
            <p className="text-xs text-[#4B2D23] font-medium mb-1">
              Email Address
            </p>
            <div className="bg-white rounded-lg px-4 py-3 opacity-60">
              <p className="text-sm text-[#4B2D23]">{user.email}</p>
            </div>
          </div>

          {/* Save Changes Button */}
          <button
            onClick={handleSaveChanges}
            disabled={!editingContact || !isContactValid}
            className="w-full py-3 rounded-lg text-sm font-semibold mt-2"
            style={{
              backgroundColor:
                editingContact && isContactValid
                  ? "#990000"
                  : "rgba(153, 0, 0, 0.3)",
              color: "white",
              cursor: editingContact && isContactValid ? "pointer" : "default",
            }}
          >
            Save Changes
          </button>
        </div>

        {/* Discard Modal */}
        {showDiscardModal && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50 px-8">
            <div className="bg-white rounded-2xl overflow-hidden w-full max-w-sm">
              <div className="px-6 py-6">
                <p className="text-[#4B2D23] font-bold text-base text-center">
                  Discard changes? Unsaved edits will be lost.
                </p>
              </div>
              <div className="flex border-t border-gray-200">
                <button
                  onClick={() => setShowDiscardModal(false)}
                  className="flex-1 py-4 text-sm font-semibold text-[#990000] border-r border-gray-200"
                >
                  Keep Editing
                </button>
                <button
                  onClick={handleDiscard}
                  className="flex-1 py-4 text-sm font-semibold text-white"
                  style={{ backgroundColor: "#990000" }}
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Toast */}
        {showSuccessToast && (
          <div className="fixed bottom-20 left-4 right-4 z-[2000] bg-[#990000] rounded-full px-4 py-3 flex items-center gap-3 shadow-lg">
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#990000"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-xs text-white font-medium whitespace-nowrap overflow-hidden text-ellipsis">
              Changes saved successfully.
            </p>
          </div>
        )}
      </div>
    );
  }

  // =====================
  // QR ITEM PAGE
  // =====================
  if (page === "qrItem") {
    return <QRItem onBack={() => setPage("main")} />;
  }
}