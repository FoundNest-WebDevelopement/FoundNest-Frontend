import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronRight } from "lucide-react";
import QRCode from "qrcode";
import { Html5Qrcode } from "html5-qrcode";
import { fetchWithAuth } from "../utils/fetchWithAuth";

const API_URL = import.meta.env.VITE_API_URL;

function disposeScanner(instance) {
  const clearScannerUi = () => {
    instance.clear().catch(() => {});
  };

  try {
    instance.stop().then(clearScannerUi).catch(clearScannerUi);
  } catch {
    clearScannerUi();
  }
}

// Icons
const RegisterIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4B2D23" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
    <rect x="14" y="14" width="3" height="3"/>
  </svg>
);

const ViewItemsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4B2D23" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="4" rx="1"/>
    <rect x="3" y="10" width="18" height="4" rx="1"/>
    <rect x="3" y="17" width="18" height="4" rx="1"/>
  </svg>
);

const ScanIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4B2D23" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
    <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
    <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
    <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4B2D23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/>
    <path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const BackHeader = ({ title, onBackPress }) => (
  <div className="bg-[#990000] px-5 py-4 rounded-b-xl flex items-center gap-3">
    <button onClick={onBackPress}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5"/>
        <polyline points="12 19 5 12 12 5"/>
      </svg>
    </button>
    <p className="text-white font-bold text-lg">{title}</p>
  </div>
);

const categories = [
  "Personal Items",
  "Electronics",
  "Academic Materials",
  "Clothing",
  "Accessories",
  "Others",
];

const emptyForm = {
  ownerName: `${localStorage.getItem("first_name") || ""} ${localStorage.getItem("last_name") || ""}`.trim(),
  studentNumber: localStorage.getItem("student_number") || "",
  courseSection: localStorage.getItem("course_section") || "",
  contactNumber: "",
  itemName: "",
  category: "",
  image: null,
  imagePreview: null,
};

export default function QRItem({ onBack }) {
  const user_id = localStorage.getItem("user_id");

  const [page, setPage] = useState("main");
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [registeredItems, setRegisteredItems] = useState([]);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [generatedItemName, setGeneratedItemName] = useState("");
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editTargetId, setEditTargetId] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  const isFormValid =
    form.ownerName.trim() !== "" &&
    form.studentNumber.trim() !== "" &&
    form.courseSection.trim() !== "" &&
    form.category !== "";

  const isEditFormValid =
    editForm.ownerName.trim() !== "" &&
    editForm.studentNumber.trim() !== "" &&
    editForm.courseSection.trim() !== "" &&
    editForm.category !== "";

  const fetchUserItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/api/qr-items/${user_id}`);
      const data = await res.json();
      if (res.ok) {
        const mapped = data.map((item) => ({
          id: item.qr_code_id,
          itemName: item.item_name,
          description: item.description,
          imagePreview: item.image_url,
          qrData: item.qr_data,
          category: item.category_name,
          ownerName: "",
          studentNumber: "",
          courseSection: "",
          contactNumber: "",
        }));
        setRegisteredItems(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user_id]);

  useEffect(() => {
    if (page === "viewItems") {
      fetchUserItems();
    }
  }, [page, fetchUserItems]);

  const handleImageUpload = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (isEdit) {
      setEditForm({ ...editForm, image: file, imagePreview: preview });
    } else {
      setForm({ ...form, image: file, imagePreview: preview });
      setAnalyzing(true);
      setTimeout(() => setAnalyzing(false), 2000);
    }
  };

  const handleRegister = async () => {
    if (!isFormValid) return;
    setLoading(true);
    try {
      const qrData = JSON.stringify({
        ownerName: form.ownerName,
        studentNumber: form.studentNumber,
        courseSection: form.courseSection,
        contactNumber: form.contactNumber,
        itemName: form.itemName,
        category: form.category,
      });

      const url = await QRCode.toDataURL(qrData, { width: 200, margin: 2 });
      setQrCodeUrl(url);
      setGeneratedItemName(form.itemName || "Item");

      const res = await fetchWithAuth(`${API_URL}/api/qr-items/register`, {
        method: "POST",
        body: JSON.stringify({
          user_id,
          item_name: form.itemName,
          category_id: categories.indexOf(form.category) + 1,
          description: form.courseSection,
          qr_data: qrData,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPage("qrSuccess");
        setForm(emptyForm);
      } else {
        console.error(data.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `${generatedItemName}-QR.png`;
    link.click();
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/api/qr-items/${deleteTargetId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRegisteredItems(registeredItems.filter((i) => i.id !== deleteTargetId));
      }
    } catch (err) {
      console.error(err);
    }
    setShowDeleteModal(false);
    setDeleteTargetId(null);
  };

  const handleEditSave = async () => {
    try {
      const res = await fetchWithAuth(`${API_URL}/api/qr-items/${editTargetId}`, {
        method: "PUT",
        body: JSON.stringify({
          item_name: editForm.itemName,
          description: editForm.courseSection,
          category_id: categories.indexOf(editForm.category) + 1,
        }),
      });
      if (res.ok) {
        setRegisteredItems(
          registeredItems.map((i) =>
            i.id === editTargetId ? { ...i, ...editForm } : i
          )
        );
        setPage("viewItems");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // QR Scanner
  useEffect(() => {
    if (page !== "scan" || !scannerRef.current) return;

    let cancelled = false;
    scannerRef.current.replaceChildren();
    const html5Qrcode = new Html5Qrcode("qr-reader");
    html5QrRef.current = html5Qrcode;

    html5Qrcode
      .start(
        { facingMode: "environment" },
        { fps: 10 },
        (decodedText) => {
          disposeScanner(html5Qrcode);
          html5QrRef.current = null;
          try {
            setScanResult(JSON.parse(decodedText));
          } catch {
            setScanResult({ raw: decodedText });
          }
          setPage("scanResult");
        },
        () => {}
      )
      .then(() => {
        // Effect was cleaned up while the camera was still starting up.
        if (cancelled) {
          disposeScanner(html5Qrcode);
          html5QrRef.current = null;
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      disposeScanner(html5Qrcode);
      html5QrRef.current = null;
    };
  }, [page]);

  // =====================
  // MAIN PAGE
  // =====================
  if (page === "main") {
    return (
      <div className="flex flex-col min-h-screen mt-13 mb-16" style={{ backgroundColor: "#FFF3E0" }}>
        <BackHeader title="QR Item" onBackPress={() => onBack()} />
        <div className="px-5 py-5">
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setPage("register")}
              className="flex items-center gap-4 px-4 py-4 w-full border-b border-gray-100"
            >
              <RegisterIcon />
              <p className="flex-1 text-sm text-left text-[#4B2D23]">Register an Item</p>
              <ChevronRight size={16} color="#4B2D23" />
            </button>
            <button
              onClick={() => setPage("viewItems")}
              className="flex items-center gap-4 px-4 py-4 w-full border-b border-gray-100"
            >
              <ViewItemsIcon />
              <p className="flex-1 text-sm text-left text-[#4B2D23]">View Registered Items</p>
              <ChevronRight size={16} color="#4B2D23" />
            </button>
            <button
              onClick={() => setPage("scan")}
              className="flex items-center gap-4 px-4 py-4 w-full"
            >
              <ScanIcon />
              <p className="flex-1 text-sm text-left text-[#4B2D23]">Scan An Item</p>
              <ChevronRight size={16} color="#4B2D23" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =====================
  // REGISTER AN ITEM
  // =====================
  if (page === "register") {
    return (
      <div className="flex flex-col min-h-screen mt-13 mb-16" style={{ backgroundColor: "#FFF3E0" }}>
        <BackHeader
          title="Register An Item"
          onBackPress={() => {
            if (form.ownerName || form.studentNumber || form.courseSection || form.itemName) {
              setShowDiscardModal(true);
            } else {
              setPage("main");
            }
          }}
        />
        <div className="px-5 py-5 flex flex-col gap-4">

          <div>
            <p className="text-xs text-[#4B2D23] font-medium mb-1">Owner Name*</p>
            <input
              type="text"
              placeholder="Enter your full name"
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
              className="w-full bg-white rounded-lg px-4 py-3 text-sm text-[#4B2D23] outline-none border border-transparent focus:border-[#990000]"
            />
          </div>

          <div>
            <p className="text-xs text-[#4B2D23] font-medium mb-1">Student Number*</p>
            <input
              type="text"
              placeholder="e.g. 2023100464"
              value={form.studentNumber}
              onChange={(e) => setForm({ ...form, studentNumber: e.target.value })}
              className="w-full bg-white rounded-lg px-4 py-3 text-sm text-[#4B2D23] outline-none border border-transparent focus:border-[#990000]"
            />
          </div>

          <div>
            <p className="text-xs text-[#4B2D23] font-medium mb-1">Course and Section*</p>
            <input
              type="text"
              placeholder="e.g. BSIT 3G-G1"
              value={form.courseSection}
              onChange={(e) => setForm({ ...form, courseSection: e.target.value })}
              className="w-full bg-white rounded-lg px-4 py-3 text-sm text-[#4B2D23] outline-none border border-transparent focus:border-[#990000]"
            />
          </div>

          <div>
            <p className="text-xs text-[#4B2D23] font-medium mb-1">Contact Number</p>
            <input
              type="text"
              placeholder="e.g. 09695394881"
              value={form.contactNumber}
              onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
              className="w-full bg-white rounded-lg px-4 py-3 text-sm text-[#4B2D23] outline-none border border-transparent focus:border-[#990000]"
            />
          </div>

          <div>
            <p className="text-xs text-[#4B2D23] font-medium mb-1">Item Description</p>
            <div className="bg-white rounded-xl p-4 flex flex-col items-center gap-2 border border-dashed border-gray-300 relative">
              {analyzing && (
                <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center z-10">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 border-4 border-[#990000] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-[#990000] font-medium">Analyzing Image</p>
                  </div>
                </div>
              )}
              {form.imagePreview ? (
                <img src={form.imagePreview} alt="Item" className="w-full h-32 object-cover rounded-lg" />
              ) : (
                <>
                  <label className="w-12 h-12 rounded-full bg-[#990000] flex items-center justify-center cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e)}
                    />
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </label>
                  <p className="text-xs text-gray-400">Upload Item Photo (Optional)</p>
                  <p className="text-xs text-gray-400 text-center">*FoundNest AI will help auto-fill details based on your photo.</p>
                </>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs text-[#4B2D23] font-medium mb-1">Item Name</p>
            <input
              type="text"
              placeholder="e.g. Black Umbrella"
              value={form.itemName}
              onChange={(e) => setForm({ ...form, itemName: e.target.value })}
              className="w-full bg-white rounded-lg px-4 py-3 text-sm text-[#4B2D23] outline-none border border-transparent focus:border-[#990000]"
            />
          </div>

          <div>
            <p className="text-xs text-[#4B2D23] font-medium mb-1">Category*</p>
            <div className="bg-white rounded-lg px-4 py-3">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full text-sm text-[#4B2D23] outline-none bg-transparent"
              >
                <option value="" disabled>Select Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleRegister}
            disabled={!isFormValid || loading}
            className="w-full py-3 rounded-lg text-sm font-semibold mt-2"
            style={{
              backgroundColor: isFormValid && !loading ? "#990000" : "rgba(153, 0, 0, 0.3)",
              color: "white",
              cursor: isFormValid && !loading ? "pointer" : "default",
            }}
          >
            {loading ? "Registering..." : "Register Item"}
          </button>
        </div>

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
                  onClick={() => {
                    setShowDiscardModal(false);
                    setForm(emptyForm);
                    setPage("main");
                  }}
                  className="flex-1 py-4 text-sm font-semibold text-white"
                  style={{ backgroundColor: "#990000" }}
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =====================
  // QR SUCCESS
  // =====================
  if (page === "qrSuccess") {
    return (
      <div
        className="flex flex-col min-h-screen mt-13 mb-16 items-center justify-center px-5"
        style={{ backgroundColor: "#990000" }}
      >
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#990000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p className="text-white font-bold text-lg">Item Successfully Registered!</p>
        </div>

        <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3 w-full max-w-xs">
          <p className="font-bold text-[#4B2D23] text-base">{generatedItemName}</p>
          {qrCodeUrl && (
            <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
          )}
          <p className="text-xs font-bold text-[#990000]">FoundNest</p>
        </div>

        <button
          onClick={handleDownload}
          className="flex items-center gap-2 mt-6 text-white text-sm font-medium"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download Image For Printing
        </button>

        <button
          onClick={() => {
            setQrCodeUrl("");
            setPage("register");
          }}
          className="mt-3 w-full max-w-xs py-3 rounded-lg text-sm font-semibold"
          style={{ backgroundColor: "#FFF3E0", color: "#990000" }}
        >
          Register Another Item
        </button>
      </div>
    );
  }

  // =====================
  // VIEW REGISTERED ITEMS
  // =====================
  if (page === "viewItems") {
    return (
      <div className="flex flex-col min-h-screen mt-13 mb-16" style={{ backgroundColor: "#FFF3E0" }}>
        <BackHeader title="Registered Items" onBackPress={() => setPage("main")} />
        <div className="px-5 py-5">
          {loading ? (
            <div className="flex justify-center mt-20">
              <div className="w-10 h-10 border-4 border-[#990000] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : registeredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-20 gap-4">
              <div className="w-40 h-40 rounded-full bg-[#f5e6d3] flex items-center justify-center">
                <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
                  <ellipse cx="50" cy="70" rx="40" ry="15" fill="#990000" opacity="0.2"/>
                  <path d="M20 65 Q30 45 50 60 Q70 45 80 65" stroke="#990000" strokeWidth="3" fill="none" opacity="0.6"/>
                  <path d="M15 70 Q25 50 50 65 Q75 50 85 70" stroke="#990000" strokeWidth="3" fill="none" opacity="0.4"/>
                </svg>
              </div>
              <p className="font-bold text-[#4B2D23] text-base">Nothing here yet!</p>
              <p className="text-xs text-gray-400 text-center px-8">
                You have no registered items currently. Any new items you register will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {registeredItems.map((item) => (
                <div key={item.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
                  {item.imagePreview ? (
                    <img src={item.imagePreview} alt={item.itemName} className="w-full h-28 object-cover" />
                  ) : (
                    <div className="w-full h-28 bg-gray-200 flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                  )}
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-[#4B2D23] truncate">
                      {item.itemName || "Unnamed Item"}
                    </p>
                  </div>
                  <div className="flex border-t border-gray-100">
                    <button
                      onClick={() => {
                        setEditForm({ ...item });
                        setEditTargetId(item.id);
                        setPage("editItem");
                      }}
                      className="flex-1 py-2 flex items-center justify-center border-r border-gray-100"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteTargetId(item.id);
                        setShowDeleteModal(true);
                      }}
                      className="flex-1 py-2 flex items-center justify-center bg-[#990000]"
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {showDeleteModal && (
          <div className="fixed inset-0 z-[3000] flex items-end justify-center bg-black/50">
            <div className="bg-white rounded-t-2xl overflow-hidden w-full">
              <div className="px-6 py-6">
                <p className="text-[#4B2D23] font-bold text-base">Delete registered item?</p>
                <p className="text-xs text-gray-500 mt-1">
                  This will remove your registered item from the system.
                </p>
              </div>
              <div className="flex border-t border-gray-200">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-4 text-sm font-semibold text-[#4B2D23] border-r border-gray-200"
                >
                  No, keep it
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-4 text-sm font-semibold text-white"
                  style={{ backgroundColor: "#990000" }}
                >
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =====================
  // EDIT ITEM
  // =====================
  if (page === "editItem") {
    return (
      <div className="flex flex-col min-h-screen mt-13 mb-16" style={{ backgroundColor: "#FFF3E0" }}>
        <BackHeader title="Edit Registered Item" onBackPress={() => setPage("viewItems")} />
        <div className="px-5 py-5 flex flex-col gap-4">

          <div>
            <p className="text-xs text-[#4B2D23] font-medium mb-1">Owner Name*</p>
            <input
              type="text"
              placeholder="Enter your full name"
              value={editForm.ownerName}
              onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })}
              className="w-full bg-white rounded-lg px-4 py-3 text-sm text-[#4B2D23] outline-none border border-transparent focus:border-[#990000]"
            />
          </div>

          <div>
            <p className="text-xs text-[#4B2D23] font-medium mb-1">Student Number*</p>
            <input
              type="text"
              placeholder="e.g. 2023100464"
              value={editForm.studentNumber}
              onChange={(e) => setEditForm({ ...editForm, studentNumber: e.target.value })}
              className="w-full bg-white rounded-lg px-4 py-3 text-sm text-[#4B2D23] outline-none border border-transparent focus:border-[#990000]"
            />
          </div>

          <div>
            <p className="text-xs text-[#4B2D23] font-medium mb-1">Course and Section*</p>
            <input
              type="text"
              placeholder="e.g. BSIT 3G-G1"
              value={editForm.courseSection}
              onChange={(e) => setEditForm({ ...editForm, courseSection: e.target.value })}
              className="w-full bg-white rounded-lg px-4 py-3 text-sm text-[#4B2D23] outline-none border border-transparent focus:border-[#990000]"
            />
          </div>

          <div>
            <p className="text-xs text-[#4B2D23] font-medium mb-1">Contact Number</p>
            <input
              type="text"
              placeholder="e.g. 09695394881"
              value={editForm.contactNumber}
              onChange={(e) => setEditForm({ ...editForm, contactNumber: e.target.value })}
              className="w-full bg-white rounded-lg px-4 py-3 text-sm text-[#4B2D23] outline-none border border-transparent focus:border-[#990000]"
            />
          </div>

          <div>
            <p className="text-xs text-[#4B2D23] font-medium mb-1">Item Description</p>
            <div className="bg-white rounded-xl p-4 flex flex-col items-center gap-2 border border-dashed border-gray-300">
              {editForm.imagePreview ? (
                <img src={editForm.imagePreview} alt="Item" className="w-full h-32 object-cover rounded-lg" />
              ) : (
                <label className="w-12 h-12 rounded-full bg-[#990000] flex items-center justify-center cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, true)}
                  />
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </label>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs text-[#4B2D23] font-medium mb-1">Item Name</p>
            <input
              type="text"
              placeholder="e.g. Black Umbrella"
              value={editForm.itemName}
              onChange={(e) => setEditForm({ ...editForm, itemName: e.target.value })}
              className="w-full bg-white rounded-lg px-4 py-3 text-sm text-[#4B2D23] outline-none border border-transparent focus:border-[#990000]"
            />
          </div>

          <div>
            <p className="text-xs text-[#4B2D23] font-medium mb-1">Category*</p>
            <div className="bg-white rounded-lg px-4 py-3">
              <select
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="w-full text-sm text-[#4B2D23] outline-none bg-transparent"
              >
                <option value="" disabled>Select Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleEditSave}
            disabled={!isEditFormValid}
            className="w-full py-3 rounded-lg text-sm font-semibold mt-2"
            style={{
              backgroundColor: isEditFormValid ? "#990000" : "rgba(153, 0, 0, 0.3)",
              color: "white",
              cursor: isEditFormValid ? "pointer" : "default",
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  // =====================
  // SCAN AN ITEM
  // =====================
  if (page === "scan") {
    return (
      <div className="flex flex-col min-h-screen mt-13 mb-16 bg-black">
        <BackHeader
          title="Scan An Item"
          onBackPress={() => {
            if (html5QrRef.current) {
              disposeScanner(html5QrRef.current);
              html5QrRef.current = null;
            }
            setPage("main");
          }}
        />
        <div className="flex-1 flex items-center justify-center relative">
          <div id="qr-reader" ref={scannerRef} className="w-full" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-56 h-56 relative shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"/>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"/>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"/>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"/>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================
  // SCAN RESULT
  // =====================
  if (page === "scanResult") {
    return (
      <div className="flex flex-col min-h-screen mt-13 mb-16" style={{ backgroundColor: "#FFF3E0" }}>
        <BackHeader
          title={scanResult?.itemName || "Scanned Item"}
          onBackPress={() => {
            setScanResult(null);
            setPage("scan");
          }}
        />
        <div className="px-5 py-5 flex flex-col gap-4">
          {scanResult ? (
            <>
              <div>
                <p className="text-xs text-[#4B2D23] font-medium mb-1">Owner Name*</p>
                <div className="bg-white rounded-lg px-4 py-3 opacity-60">
                  <p className="text-sm text-[#4B2D23]">{scanResult.ownerName || "—"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-[#4B2D23] font-medium mb-1">Student Number*</p>
                <div className="bg-white rounded-lg px-4 py-3 opacity-60">
                  <p className="text-sm text-[#4B2D23]">{scanResult.studentNumber || "—"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-[#4B2D23] font-medium mb-1">Course and Section*</p>
                <div className="bg-white rounded-lg px-4 py-3 opacity-60">
                  <p className="text-sm text-[#4B2D23]">{scanResult.courseSection || "—"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-[#4B2D23] font-medium mb-1">Contact Number</p>
                <div className="bg-white rounded-lg px-4 py-3 opacity-60">
                  <p className="text-sm text-[#4B2D23]">{scanResult.contactNumber || "—"}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-[#4B2D23] font-medium mb-1">Category*</p>
                <div className="bg-white rounded-lg px-4 py-3 opacity-60">
                  <p className="text-sm text-[#4B2D23]">{scanResult.category || "—"}</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500 text-center mt-10">No data found.</p>
          )}
        </div>
      </div>
    );
  }
}