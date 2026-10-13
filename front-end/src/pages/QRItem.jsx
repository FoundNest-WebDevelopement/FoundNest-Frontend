import { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";
import { Html5Qrcode } from "html5-qrcode";
import toast from "react-hot-toast";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { useUnsavedChangesGuard } from "../context/UnsavedChangesContext";
import { isMobileDevice } from "../utils/isMobileDevice";
import Toast from "../user-native/Toast";
import AlertDialog from "../components/AlertDialog";
import PhotoSheet from "../components/report_components/PhotoSheet";
import WebcamCaptureModal from "../components/report_components/WebcamCaptureModal";
import StackHeader from "../user-native/StackHeader";
import Icon from "../user-native/Icon";
import ImageViewer from "../user-native/ImageViewer";
import EmptyNest from "../user-native/EmptyNest";
import { Dropdown } from "../user-native/form";
import logo from "../assets/native/app-logo.png";
import SafeImage from "../user-native/SafeImage";

const API_URL = import.meta.env.VITE_API_URL;

const LIMITS = { itemName: 50, description: 500, contents: 100 };
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

const showToast = (message) => toast.custom(() => <Toast message={message} solid={true} />, { duration: 1500 });

function disposeScanner(instance) {
  // Multiple code paths (effect cleanup, decode callback, delayed start()
  // resolution) can all try to tear down the same scanner instance. Calling
  // stop()/clear() twice on html5-qrcode can throw, which crashes the page
  // to a blank screen — so make disposal idempotent per instance.
  if (!instance || instance.__disposed) return;
  instance.__disposed = true;

  const clearScannerUi = () => {
    instance.clear().catch(() => {});
  };

  try {
    instance.stop().then(clearScannerUi).catch(clearScannerUi);
  } catch {
    clearScannerUi();
  }
}

// Same rules as the mobile app: category, name and description are required
// and the item needs a photo.
function validateItemForm({ categoryId, itemName, description, hasPhoto }) {
  const errors = {};
  if (!categoryId) errors.category = "Please select a category.";
  if (!itemName.trim()) errors.itemName = "Item name is required.";
  if (!description.trim()) errors.description = "Description is required.";
  if (!hasPhoto) errors.image = "Item photo is required.";
  return errors;
}

// Exact match first, then a partial match either way round (same as the report form)
function matchCategoryFromAi(aiCategory, categoryList) {
  const normalized = String(aiCategory ?? "").trim().toLowerCase();
  if (!normalized || !categoryList?.length) return null;

  const names = categoryList.map((c) => ({ c, name: String(c.category_name ?? "").toLowerCase() }));
  const exact = names.find((n) => n.name === normalized);
  if (exact) return exact.c;

  const partial = names.find((n) => n.name && (normalized.includes(n.name) || n.name.includes(normalized)));
  return partial ? partial.c : null;
}

const emptyForm = {
  file: null,
  imagePreview: null,
  categoryId: "",
  itemName: "",
  description: "",
  contents: "",
};

// Draws the printable card (item name + QR + FoundNest branding) like the native app's ViewShot capture
async function buildQrCardPng(itemName, qrDataUrl) {
  const load = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const [qrImg, logoImg] = await Promise.all([load(qrDataUrl), load(logo)]);
  const scale = 2;
  const w = 320 * scale;
  const h = 392 * scale;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  // card
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, 20 * scale);
  ctx.fill();

  // item name
  ctx.fillStyle = "#1a1a1a";
  ctx.font = `700 ${20 * scale}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(itemName, w / 2, 28 * scale, w - 48 * scale);

  // qr code (200px)
  ctx.drawImage(qrImg, (w - 200 * scale) / 2, 76 * scale, 200 * scale, 200 * scale);

  // branding
  ctx.drawImage(logoImg, w / 2 - 66 * scale, 296 * scale, 70 * scale, 70 * scale);
  ctx.fillStyle = "#8B0000";
  ctx.font = `700 ${16 * scale}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("FoundNest", w / 2 + 6 * scale, 331 * scale);

  return canvas.toDataURL("image/png");
}

/* -------------------------------------------------------------------------- */
/* Field primitives (QrItemFormFields + the screens' own styles)               */
/* -------------------------------------------------------------------------- */

function QrLabel({ children, required = false }) {
  return (
    <p className="text-[15px] font-bold text-[#1a1a1a] mb-1.5">
      {children}
      {required && <span className="text-[#C62828]"> *</span>}
    </p>
  );
}

function QrFieldError({ message }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-[13px] text-[#C62828] mt-1">
      {message}
    </p>
  );
}

// Owner details on the Register / Edit forms: sand coloured read-only box
function OwnerField({ label, value }) {
  return (
    <div className="mb-4">
      <QrLabel>{label}</QrLabel>
      <div className="bg-[#EDE0D4] rounded-lg px-3.5 h-[50px] flex items-center">
        <p className="text-[16px] text-[#1a1a1a] truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

// Read-only value on the item details screen: white box with border
function ValueField({ label, value, multiline = false }) {
  return (
    <div className="mb-4">
      <QrLabel>{label}</QrLabel>
      <div
        className={`bg-white rounded-lg px-3.5 border border-[#D6D6D6] flex items-center ${
          multiline ? "min-h-20 py-3" : "h-[50px]"
        }`}
      >
        <p className={`text-[16px] text-[#1a1a1a] break-words min-w-0 ${multiline ? "" : "truncate"}`}>{value || "—"}</p>
      </div>
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <p className="text-[17px] font-black text-[#1a1a1a] border-b border-black/15 pb-2.5 mb-4 mt-1">{children}</p>
  );
}

function TextField({ error, multiline, disabled, className = "", ...props }) {
  const base = `block w-full bg-white rounded-lg px-3.5 text-[16px] text-[#1a1a1a] outline-none placeholder:text-[#8C7A70] disabled:bg-[#E2D7CC] ${
    error ? "border-[1.5px] border-[#C62828]" : "border border-[#D6D6D6]"
  }`;
  return multiline ? (
    <textarea disabled={disabled} className={`${base} h-[120px] pt-3 resize-none ${className}`} {...props} />
  ) : (
    <input disabled={disabled} className={`${base} h-[50px] ${className}`} {...props} />
  );
}

// Photo card of the QR forms (uploadCard: radius 24, "Upload Item Photo (Required)")
function PhotoCard({ image, error, isAnalyzing, canScan, viewOnly = false, onPick, onRemove, onScan }) {
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [showSheet, setShowSheet] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      showToast("File size exceeds 10MB limit");
      return;
    }
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      showToast("Invalid file type");
      return;
    }
    onPick(file);
  };

  const handleTarget = () => {
    if (image) setViewerOpen(true);
    else if (!viewOnly) setShowSheet(true);
  };

  return (
    <div className="mb-4">
      <div
        className="w-full bg-white rounded-3xl py-5 px-5 flex flex-col items-center"
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
      >
        <button
          type="button"
          onClick={handleTarget}
          disabled={isAnalyzing || (viewOnly && !image)}
          aria-label={image ? "View photo" : "Add photo"}
          className="mb-3.5 flex items-center justify-center active:opacity-70"
        >
          {isAnalyzing ? (
            <span className="h-20 w-20 rounded-full border-[1.5px] border-dashed border-[#CCC] flex items-center justify-center">
              <span className="inline-block h-9 w-9 animate-spin rounded-full border-[3px] border-[#900000] border-t-transparent" />
            </span>
          ) : image ? (
            <span className="relative block w-[110px] h-[110px]">
              <SafeImage src={image} alt="Item" className="w-full h-full rounded-2xl object-cover" />
              {viewOnly ? (
                <span className="absolute bottom-2 right-2 bg-black/45 rounded-md p-1 flex">
                  <Icon name="expand-outline" size={18} color="#FFFFFF" />
                </span>
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Change photo"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSheet(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation();
                      setShowSheet(true);
                    }
                  }}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#900000] border-2 border-white flex items-center justify-center active:opacity-80"
                >
                  <Icon family="material" name="edit" size={16} color="#FFFFFF" />
                </span>
              )}
            </span>
          ) : viewOnly ? (
            <span className="h-20 w-20 rounded-full border-[1.5px] border-dashed border-[#CCCCCC] flex items-center justify-center">
              <Icon family="material" name="image-not-supported" size={28} color="#B0A09A" />
            </span>
          ) : (
            <span className="h-20 w-20 rounded-full border-[1.5px] border-dashed border-[#900000] flex items-center justify-center">
              <span className="h-[60px] w-[60px] rounded-full bg-[#900000] flex items-center justify-center">
                <Icon family="material" name="add" size={32} color="#FFFFFF" />
              </span>
            </span>
          )}
        </button>

        <p className={`text-[16px] font-semibold text-[#6B5A52] text-center ${viewOnly ? "" : "mb-2"}`}>
          {viewOnly ? (image ? "Item Photo" : "No Photo Attached") : isAnalyzing ? "Analyzing Image" : "Upload Item Photo (Required)"}
        </p>

        {!viewOnly && (
          <>
            <p className="text-[13px] text-[#8C7A70] text-center leading-5">
              *FoundNest AI will help auto-fill details based on your photo.
            </p>

            <button
              type="button"
              onClick={onScan}
              disabled={!canScan}
              className="mt-3.5 flex items-center justify-center gap-2.5 py-3 px-6 rounded-[10px] bg-[#900000] disabled:bg-[#A0A0A0] disabled:opacity-70 active:opacity-80"
            >
              <Icon name="sparkles-outline" size={22} color="#FFFFFF" />
              <span className="text-[15px] font-semibold text-white">Scan Image</span>
            </button>
          </>
        )}
      </div>
      <QrFieldError message={error} />

      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {showSheet && (
        <PhotoSheet
          hasPhoto={!!image}
          onClose={() => setShowSheet(false)}
          onTake={() => {
            setShowSheet(false);
            if (isMobileDevice()) cameraInputRef.current?.click();
            else setShowWebcam(true);
          }}
          onChoose={() => {
            setShowSheet(false);
            galleryInputRef.current?.click();
          }}
          onRemove={() => {
            setShowSheet(false);
            onRemove();
          }}
        />
      )}

      {showWebcam && (
        <WebcamCaptureModal
          onClose={() => setShowWebcam(false)}
          onCapture={(file) => {
            setShowWebcam(false);
            onPick(file);
          }}
        />
      )}

      <ImageViewer uri={image} visible={viewerOpen} onClose={() => setViewerOpen(false)} />
    </div>
  );
}

// Category / name / description / contents shared by the register and edit forms
function ItemFields({ form, setForm, errors, setErrors, categories, disabled }) {
  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  return (
    <>
      <div className="mb-4">
        <QrLabel required>Category</QrLabel>
        <Dropdown
          variant="qr"
          flush
          value={form.categoryId}
          options={categories.map((c) => ({ value: String(c.category_id), label: c.category_name }))}
          placeholder={categories.length === 0 ? "Loading categories..." : "Select Category"}
          disabled={disabled || categories.length === 0}
          error={!!errors.category}
          onChange={(val) => {
            setForm((prev) => ({ ...prev, categoryId: val }));
            if (errors.category) setErrors((prev) => ({ ...prev, category: undefined }));
          }}
        />
        <QrFieldError message={errors.category} />
      </div>

      <div className="mb-4">
        <QrLabel required>Item Name</QrLabel>
        <TextField
          type="text"
          placeholder="e.g., iPhone 13 Pro Max, Bag, Umbrella"
          value={form.itemName}
          maxLength={LIMITS.itemName}
          disabled={disabled}
          error={!!errors.itemName}
          onChange={(e) => update("itemName", e.target.value)}
        />
        <QrFieldError message={errors.itemName} />
      </div>

      <div className="mb-4">
        <QrLabel required>Detailed Description</QrLabel>
        <TextField
          multiline
          placeholder="Brand, Model, Size, Color, Material, etc."
          value={form.description}
          maxLength={LIMITS.description}
          disabled={disabled}
          error={!!errors.description}
          onChange={(e) => update("description", e.target.value)}
        />
        <QrFieldError message={errors.description} />
      </div>

      <div className="mb-4">
        <QrLabel>Contents (if applicable)</QrLabel>
        <TextField
          type="text"
          placeholder="e.g., Cash amount, ID name"
          value={form.contents}
          maxLength={LIMITS.contents}
          disabled={disabled}
          onChange={(e) => update("contents", e.target.value)}
        />
      </div>
    </>
  );
}

// Cancel + primary button row of the register / edit forms (buttonRow)
function FormButtons({ onCancel, onSubmit, submitLabel, disabled, busy }) {
  return (
    <div className="flex justify-end items-center gap-2.5 mt-2 border-t border-black/10 pt-6">
      <button
        type="button"
        onClick={onCancel}
        disabled={busy}
        className="h-[46px] px-7 rounded-[14px] border-[1.5px] border-primary bg-transparent text-[15px] font-medium text-primary active:opacity-70"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled}
        className="h-[46px] px-[26px] min-w-[100px] rounded-[14px] bg-primary flex items-center justify-center text-[15px] font-medium text-white active:opacity-80 disabled:bg-[#A0A0A0] disabled:opacity-70"
      >
        {busy ? (
          <span className="inline-block w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          submitLabel
        )}
      </button>
    </div>
  );
}

// Result card + download used after register / edit and when viewing an item's QR (QrItemSuccessScreen)
function QrCardScreen({ banner, itemName, qrCodeUrl, bottomLabel, onBottom, isView }) {
  const handleDownload = async () => {
    if (!qrCodeUrl) return;
    try {
      const png = await buildQrCardPng(itemName || "FoundNest", qrCodeUrl);
      const link = document.createElement("a");
      link.href = png;
      link.download = `${itemName || "foundnest-qr"}.png`;
      link.click();
    } catch (err) {
      console.error(err);
      showToast("Failed to save QR code image.");
    }
  };

  return (
    <div className="bg-primary min-h-[calc(100vh-70px)] lg:min-h-screen flex flex-col items-center lg:justify-center pt-[30px] lg:pt-0 pb-[60px] lg:pb-0 px-6">
      <div className="flex items-center mb-8 gap-3">
        <span className="w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0">
          <Icon name={isView ? "qr-code-outline" : "checkmark"} size={28} color="#8B0000" />
        </span>
        <p className="text-[18px] font-bold text-white min-w-0">{banner}</p>
      </div>

      <div className="rounded-[20px] overflow-hidden w-full max-w-[320px]">
        <div className="bg-white rounded-[20px] pt-7 pb-3 px-6 flex flex-col items-center w-full">
          <p className="text-[20px] font-bold text-[#1a1a1a] mb-5 text-center break-words max-w-full">{itemName}</p>

          <div className="p-3 rounded-xl bg-white mb-1">
            {qrCodeUrl ? <img src={qrCodeUrl} alt="QR Code" className="w-[200px] h-[200px]" /> : <div className="w-[200px] h-[200px]" />}
          </div>

          <div className="flex items-center -mt-2.5">
            <img src={logo} alt="" className="w-[70px] h-[70px] object-contain" />
            <span className="-ml-1.5 text-[16px] font-bold text-primary">FoundNest</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDownload}
        disabled={!qrCodeUrl}
        className="flex items-center justify-center gap-2.5 mt-6 active:opacity-70 disabled:opacity-50"
      >
        <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
          <Icon name="download-outline" size={18} color="#8B0000" />
        </span>
        <span className="text-[16px] font-medium text-white">Download Image For Printing</span>
      </button>

      <button
        type="button"
        onClick={onBottom}
        className="mt-7 w-full max-w-[320px] bg-[#FFF3E0] rounded-xl py-3.5 flex items-center justify-center text-[15px] font-medium text-primary active:opacity-70"
      >
        {bottomLabel}
      </button>
    </div>
  );
}

export default function QRItem({ onBack }) {
  const user_id = localStorage.getItem("user_id");
  const { setDirty, setBlocking } = useUnsavedChangesGuard();

  const [page, setPage] = useState("main");
  const [categories, setCategories] = useState([]);
  const [profile, setProfile] = useState(null);

  // register
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [scannedFile, setScannedFile] = useState(null);
  const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  // success / generated QR
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [generatedItemName, setGeneratedItemName] = useState("");
  const [successMode, setSuccessMode] = useState("register"); // "register" | "edit"

  // list / detail
  const [registeredItems, setRegisteredItems] = useState([]);
  const [listError, setListError] = useState("");
  const [viewingItem, setViewingItem] = useState(null);
  const [viewQrCodeUrl, setViewQrCodeUrl] = useState("");
  const [fromScan, setFromScan] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // edit
  const [editForm, setEditForm] = useState(emptyForm);
  const [editErrors, setEditErrors] = useState({});
  const [editBase, setEditBase] = useState(null);
  const [editTargetId, setEditTargetId] = useState(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showEditDiscard, setShowEditDiscard] = useState(false);

  // scan
  const [scanResult, setScanResult] = useState(null); // { status: "loading" | "not_found" | "not_owner", message }
  const [scannerError, setScannerError] = useState("");
  const [scanRetryCount, setScanRetryCount] = useState(0);
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);

  // search + category filter of the registered items list
  const [listSearch, setListSearch] = useState("");
  const [listCategories, setListCategories] = useState([]);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const filteredItems = registeredItems.filter((item) => {
    const q = listSearch.trim().toLowerCase();
    const matchesSearch = !q || String(item.item_name ?? "").toLowerCase().includes(q);
    const matchesCategory = listCategories.length === 0 || listCategories.includes(item.category_id);
    return matchesSearch && matchesCategory;
  });

  const blobUrlRef = useRef(null);

  /* --------------------------------- data --------------------------------- */

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/categories`);
        const data = await res.json();
        setCategories(res.ok && Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    })();

    (async () => {
      try {
        const res = await fetchWithAuth(`${API_URL}/api/profile/${user_id}`);
        const data = await res.json();
        if (res.ok) setProfile(data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [user_id]);

  // Owner details shown (read-only) on the register form come from the saved profile
  const ownerName =
    `${profile?.first_name || localStorage.getItem("first_name") || ""} ${profile?.last_name || localStorage.getItem("last_name") || ""}`.trim();
  const studentNumber = profile?.student_number || localStorage.getItem("student_number") || "";
  const courseSection = profile?.course_section || localStorage.getItem("course_section") || "";
  const contactNumber = profile?.contact_number ?? "";

  const fetchUserItems = useCallback(async () => {
    setLoading(true);
    setListError("");
    try {
      const res = await fetchWithAuth(`${API_URL}/api/qr-items/${user_id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load your registered items.");
      setRegisteredItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setListError(err.message || "Failed to load your registered items.");
    } finally {
      setLoading(false);
    }
  }, [user_id]);

  useEffect(() => {
    if (page === "viewItems") {
      fetchUserItems();
    }
  }, [page, fetchUserItems]);

  // Freshest copy of one item (includes owner details and qr_data)
  const fetchItemDetail = async (qrCodeId) => {
    try {
      const res = await fetchWithAuth(`${API_URL}/api/qr-items/detail/${qrCodeId}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  /* ------------------------------ unsaved guard ---------------------------- */

  const hasRegisterInput =
    !!form.file ||
    form.categoryId !== "" ||
    form.itemName.trim() !== "" ||
    form.description.trim() !== "" ||
    form.contents.trim() !== "";

  const hasEditChanges =
    !!editBase &&
    (!!editForm.file ||
      imageRemoved ||
      editForm.categoryId !== editBase.categoryId ||
      editForm.itemName.trim() !== editBase.itemName.trim() ||
      editForm.description.trim() !== editBase.description.trim() ||
      editForm.contents.trim() !== editBase.contents.trim());

  useEffect(() => {
    setDirty((page === "register" && hasRegisterInput) || (page === "editItem" && hasEditChanges));
  }, [page, hasRegisterInput, hasEditChanges, setDirty]);

  useEffect(() => {
    setBlocking(isAnalyzing);
  }, [isAnalyzing, setBlocking]);

  useEffect(
    () => () => {
      setDirty(false);
      setBlocking(false);
    },
    [setDirty, setBlocking]
  );

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!((page === "register" && hasRegisterInput) || (page === "editItem" && hasEditChanges))) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [page, hasRegisterInput, hasEditChanges]);

  useEffect(
    () => () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    },
    []
  );

  /* -------------------------------- photo / AI ----------------------------- */

  const previewFor = (file) => {
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    blobUrlRef.current = URL.createObjectURL(file);
    return blobUrlRef.current;
  };

  const analyzeImage = async (file, setTarget, setTargetErrors) => {
    try {
      setIsAnalyzing(true);

      const formData = new FormData();
      formData.append("image", file);

      const res = await fetchWithAuth(`${API_URL}/api/gemini-item-listing/describe-item`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const error = new Error(data.message || "AI analysis failed");
        error.status = res.status;
        throw error;
      }

      const matched = matchCategoryFromAi(data.category, categories);
      setTarget((prev) => ({
        ...prev,
        itemName: String(data.itemName ?? "").slice(0, LIMITS.itemName),
        description: String(data.detailedDescription ?? "").slice(0, LIMITS.description),
        contents: String(data.contents ?? "").slice(0, LIMITS.contents),
        categoryId: matched ? String(matched.category_id) : prev.categoryId,
      }));
      setTargetErrors({});
      setScannedFile(file);
    } catch (err) {
      console.error(err);
      showToast(
        err.status === 429
          ? "You've reached the hourly limit for AI analysis. Please fill out the details manually or try again later."
          : "Failed to auto-fill details. Please fill them out manually."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* -------------------------------- register ------------------------------- */

  const resetRegister = () => {
    setForm(emptyForm);
    setFormErrors({});
    setScannedFile(null);
  };

  const handleRegisterPress = () => {
    const errors = validateItemForm({
      categoryId: form.categoryId,
      itemName: form.itemName,
      description: form.description,
      hasPhoto: !!form.file,
    });
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast("Please fix the highlighted fields.");
      return;
    }
    setFormErrors({});
    setShowRegisterConfirm(true);
  };

  const handleRegister = async () => {
    setShowRegisterConfirm(false);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("user_id", String(user_id));
      formData.append("item_name", form.itemName.trim());
      formData.append("category_id", String(form.categoryId));
      formData.append("description", form.description.trim());
      if (form.contents.trim()) formData.append("contents", form.contents.trim());
      formData.append("image", form.file);

      const res = await fetchWithAuth(`${API_URL}/api/qr-items/register`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showToast(data.message || "Failed to register item.");
        return;
      }

      // qr_data is generated by the server; it is only a lookup key
      const qrData = data.qr_code?.qr_data;
      setQrCodeUrl(qrData ? await QRCode.toDataURL(qrData, { width: 200, margin: 0 }) : "");
      setGeneratedItemName(form.itemName.trim());
      setSuccessMode("register");
      resetRegister();
      setDirty(false);
      setPage("qrSuccess");
    } catch (err) {
      console.error(err);
      showToast("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------- detail / view QR --------------------------- */

  const openDetail = async (item, scanned = false) => {
    setViewingItem(item);
    setFromScan(scanned);
    setPage("viewItemDetail");

    if (item.qr_code_id) {
      const fresh = await fetchItemDetail(item.qr_code_id);
      if (fresh) setViewingItem(fresh);
    }
  };

  const handleViewQr = async (item) => {
    try {
      const url = await QRCode.toDataURL(item.qr_data, { width: 200, margin: 0 });
      setViewQrCodeUrl(url);
      setPage("viewQr");
    } catch (err) {
      console.error(err);
      showToast("Could not generate the QR code.");
    }
  };

  /* --------------------------------- delete -------------------------------- */

  const handleDeleteConfirm = async () => {
    const targetId = deleteTargetId;
    setShowDeleteModal(false);
    setDeleteTargetId(null);
    try {
      const res = await fetchWithAuth(`${API_URL}/api/qr-items/${targetId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRegisteredItems((prev) => prev.filter((i) => i.qr_code_id !== targetId));
        showToast("Item deleted.");
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.message || "Failed to delete item.");
      }
    } catch (err) {
      console.error(err);
      showToast("Could not connect to server.");
    }
  };

  /* ---------------------------------- edit --------------------------------- */

  const openEdit = async (item) => {
    setLoading(true);
    // The list row can be stale; edit the server's freshest copy
    const fresh = (await fetchItemDetail(item.qr_code_id)) ?? item;
    setLoading(false);

    const values = {
      categoryId: fresh.category_id ? String(fresh.category_id) : "",
      itemName: fresh.item_name || "",
      description: fresh.description || "",
      contents: fresh.contents || "",
    };
    setEditBase(values);
    setEditForm({ ...emptyForm, ...values, imagePreview: fresh.image_url || null });
    setEditErrors({});
    setImageRemoved(false);
    setEditTargetId(fresh.qr_code_id);
    setViewingItem(fresh);
    setPage("editItem");
  };

  const editHasPhoto = !!editForm.file || (!!editForm.imagePreview && !imageRemoved);

  const handleEditPress = () => {
    if (!hasEditChanges) return;
    const errors = validateItemForm({
      categoryId: editForm.categoryId,
      itemName: editForm.itemName,
      description: editForm.description,
      hasPhoto: editHasPhoto,
    });
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      showToast("Please fix the highlighted fields.");
      return;
    }
    setEditErrors({});
    setShowSaveConfirm(true);
  };

  const handleEditSave = async () => {
    setShowSaveConfirm(false);
    setLoading(true);
    try {
      let res;
      if (editForm.file) {
        const formData = new FormData();
        formData.append("item_name", editForm.itemName.trim());
        formData.append("description", editForm.description.trim());
        formData.append("category_id", String(editForm.categoryId));
        formData.append("contents", editForm.contents.trim());
        formData.append("image", editForm.file);
        res = await fetchWithAuth(`${API_URL}/api/qr-items/${editTargetId}`, {
          method: "PUT",
          body: formData,
        });
      } else {
        res = await fetchWithAuth(`${API_URL}/api/qr-items/${editTargetId}`, {
          method: "PUT",
          body: JSON.stringify({
            item_name: editForm.itemName.trim(),
            description: editForm.description.trim(),
            category_id: editForm.categoryId ? Number(editForm.categoryId) : null,
            contents: editForm.contents.trim(),
            remove_image: imageRemoved,
          }),
        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.message || "Failed to save changes.");
        return;
      }

      const fresh = await fetchItemDetail(editTargetId);
      setQrCodeUrl(fresh?.qr_data ? await QRCode.toDataURL(fresh.qr_data, { width: 200, margin: 0 }) : "");
      setGeneratedItemName(editForm.itemName.trim());
      setSuccessMode("edit");
      setEditBase(null);
      setDirty(false);
      setPage("qrSuccess");
    } catch (err) {
      console.error(err);
      showToast("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------- scanner ------------------------------- */

  // Looks the scanned code up on the server, which also checks ownership
  const handleScanned = async (decodedText) => {
    setScanResult({ status: "loading" });
    setPage("scanResult");
    try {
      const res = await fetchWithAuth(`${API_URL}/api/qr-items/scan`, {
        method: "POST",
        body: JSON.stringify({ qr_data: decodedText }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setScanResult({ status: "not_found", message: data.message || "Something went wrong. Please try again." });
        return;
      }
      if (!data.found) {
        setScanResult({ status: "not_found", message: "This QR code is not registered in FoundNest." });
        return;
      }
      if (!data.isOwner) {
        setScanResult({ status: "not_owner" });
        return;
      }

      setScanResult(null);
      openDetail(data.item, true);
    } catch (err) {
      console.error(err);
      setScanResult({ status: "not_found", message: "Could not connect to server. Please try again." });
    }
  };

  // QR Scanner
  useEffect(() => {
    if (page !== "scan" || !scannerRef.current) return;

    let cancelled = false;
    setScannerError("");
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
          handleScanned(decodedText);
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
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to start QR scanner:", err);
        html5QrRef.current = null;
        const name = err?.name || "";
        if (name === "NotAllowedError") {
          setScannerError("Camera access was denied. Please allow camera permission in your browser settings and try again.");
        } else if (name === "NotFoundError" || name === "OverconstrainedError") {
          setScannerError("No camera was found on this device.");
        } else if (name === "NotReadableError") {
          setScannerError("The camera is already in use by another app.");
        } else {
          setScannerError("Could not start the camera. Please check your camera permissions and try again.");
        }
      });

    return () => {
      cancelled = true;
      disposeScanner(html5Qrcode);
      html5QrRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, scanRetryCount]);

  const screen = "narrow-body bg-[#FFF1E0] min-h-[calc(100vh-70px)] lg:min-h-screen";

  // =====================
  // MAIN PAGE (QrItemMenuScreen)
  // =====================
  if (page === "main") {
    const MENU = [
      { key: "register", label: "Register an Item", icon: "qrcode", page: "register" },
      { key: "view", label: "View Registered Items", icon: "format-list-bulleted", page: "viewItems" },
      { key: "scan", label: "Scan An Item", icon: "crop-free", page: "scan" },
    ];

    return (
      <div className={screen}>
        <StackHeader title="QR Item" onBack={onBack} />
        <div className="px-4 pt-6">
          <div className="bg-white rounded-2xl py-1 px-1" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
            {MENU.map((item, index) => (
              <div key={item.key}>
                <button
                  type="button"
                  onClick={() => setPage(item.page)}
                  className="w-full flex items-center py-[18px] px-3.5 text-left active:opacity-60"
                >
                  <span className="w-7 mr-3.5 flex justify-center">
                    <Icon family="mci" name={item.icon} size={22} color="#1a1a1a" />
                  </span>
                  <span className="flex-1 text-[15px] text-[#1a1a1a]">{item.label}</span>
                  <Icon name="chevron-forward" size={20} color="rgba(0,0,0,0.65)" />
                </button>
                {index < MENU.length - 1 && <div className="h-px bg-black/[0.06] mx-3" />}
              </div>
            ))}
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
      <div className={screen}>
        <StackHeader
          title="Register An Item"
          onBack={() => {
            if (isAnalyzing) showToast("Please wait until scanning finishes.");
            else if (hasRegisterInput) setShowDiscardModal(true);
            else setPage("main");
          }}
        />

        <div className="px-4 pt-5 pb-10 flex flex-col">
          <OwnerField label="Owner Name" value={ownerName} />
          <OwnerField label="Student Number" value={studentNumber} />
          <OwnerField label="Course and Section" value={courseSection} />
          <OwnerField label="Contact Number" value={contactNumber} />

          <SectionHeading>Item Description</SectionHeading>

          <PhotoCard
            image={form.imagePreview}
            error={formErrors.image}
            isAnalyzing={isAnalyzing}
            canScan={!!form.file && !isAnalyzing && !loading && form.file !== scannedFile}
            onPick={(file) => {
              const imagePreview = previewFor(file);
              setForm((prev) => ({ ...prev, file, imagePreview }));
              setFormErrors((prev) => ({ ...prev, image: undefined }));
            }}
            onRemove={() => setForm((prev) => ({ ...prev, file: null, imagePreview: null }))}
            onScan={() => analyzeImage(form.file, setForm, setFormErrors)}
          />

          <ItemFields
            form={form}
            setForm={setForm}
            errors={formErrors}
            setErrors={setFormErrors}
            categories={categories}
            disabled={isAnalyzing}
          />

          <FormButtons
            onCancel={() => {
              if (hasRegisterInput) setShowDiscardModal(true);
              else setPage("main");
            }}
            onSubmit={handleRegisterPress}
            submitLabel="Register"
            disabled={loading || isAnalyzing || !form.file || !form.categoryId || !form.itemName.trim() || !form.description.trim()}
            busy={loading}
          />
        </div>

        {showRegisterConfirm && (
          <AlertDialog
            message="Are you sure you want to register this item?"
            b1Label="Review"
            b2Label="Register"
            b1OnClick={() => setShowRegisterConfirm(false)}
            b2OnClick={handleRegister}
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
              resetRegister();
              setPage("main");
            }}
          />
        )}
      </div>
    );
  }

  // =====================
  // QR SUCCESS (register + edit)
  // =====================
  if (page === "qrSuccess") {
    const isEdit = successMode === "edit";
    return (
      <QrCardScreen
        banner={isEdit ? "Item Edited Successfully!" : "Item Successfully Registered!"}
        itemName={generatedItemName}
        qrCodeUrl={qrCodeUrl}
        bottomLabel={isEdit ? "Back to My Items" : "Register Another Item"}
        onBottom={() => {
          setQrCodeUrl("");
          setPage(isEdit ? "viewItems" : "register");
        }}
      />
    );
  }

  // =====================
  // VIEW REGISTERED ITEMS
  // =====================
  if (page === "viewItems") {
    return (
      <div className={"bg-[#FFF1E0] min-h-[calc(100vh-70px)] lg:min-h-screen flex flex-col"}>
        <StackHeader title="Registered Items" onBack={() => setPage("main")} />

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-24">
            <div className="w-9 h-9 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : listError ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <p className="text-sm text-red-500 text-center">{listError}</p>
            <button
              type="button"
              onClick={fetchUserItems}
              className="border border-primary rounded-lg h-10 px-6 text-primary bg-white text-xs"
            >
              Try again
            </button>
          </div>
        ) : registeredItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 pb-[120px] pt-10">
            <EmptyNest />
            <p className="text-[20px] font-extrabold text-[#1a1a1a] mt-4 mb-2.5">Nothing here yet!</p>
            <p className="text-[14px] text-black/65 text-center leading-[22px]">
              You have no registered items currently.
              <br />
              Any new items you register will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="flex items-center bg-white m-[15px] lg:mx-10 lg:my-5 px-[15px] rounded-[25px] border border-[#ddd] h-[45px]">
              <span className="mr-2.5 flex">
                <Icon name="search-outline" size={20} color="#8B0000" />
              </span>
              <input
                type="text"
                placeholder="Search Item"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                className="flex-1 min-w-0 bg-transparent outline-none text-[16px] text-[#333] placeholder:text-[#999]"
              />
              {listSearch.length > 0 && (
                <button type="button" onClick={() => setListSearch("")} aria-label="Clear search" className="flex">
                  <Icon name="close-circle" size={18} color="#B0A09A" />
                </button>
              )}
            </div>

            {/* Filter */}
            <div className="bg-white py-2.5 mx-2.5 lg:mx-10 mb-2.5 lg:mb-6 rounded-[15px] lg:border lg:border-black/[0.06]">
              <div className="flex justify-between px-2.5">
                <button
                  type="button"
                  onClick={() => setCategoryMenuOpen((o) => !o)}
                  className={`flex-1 min-w-0 mx-1 flex items-center justify-center bg-white px-2 py-2 rounded-[15px] border active:opacity-70 ${
                    categoryMenuOpen || listCategories.length > 0 ? "border-[#A31D1D]" : "border-[#ddd]"
                  }`}
                >
                  <span
                    className={`text-[12px] truncate mr-[5px] ${
                      categoryMenuOpen || listCategories.length > 0 ? "text-[#A31D1D] font-bold" : "text-[#333]"
                    }`}
                  >
                    {listCategories.length === 0
                      ? "All Categories"
                      : listCategories.length === 1
                        ? categories.find((c) => c.category_id === listCategories[0])?.category_name ?? "1 Selected"
                        : `${listCategories.length} Selected`}
                  </span>
                  <Icon name={categoryMenuOpen ? "chevron-up" : "chevron-down"} size={14} color="#8B0000" />
                </button>
                {(listCategories.length > 0 || listSearch) && (
                  <button
                    type="button"
                    onClick={() => {
                      setListCategories([]);
                      setListSearch("");
                    }}
                    className="shrink-0 flex items-center justify-center gap-[3px] mx-1 px-2 py-2 rounded-[15px] border border-[#ddd] active:opacity-70"
                  >
                    <Icon name="close" size={14} color="#8B0000" />
                    <span className="text-[12px] font-semibold text-primary">Clear</span>
                  </button>
                )}
              </div>

              {categoryMenuOpen && (
                <div className="bg-white mt-3 mx-2.5 rounded-xl p-[15px] border border-[#eee]">
                  <div className="flex flex-wrap justify-start">
                    {[{ category_id: "all", category_name: "All Categories" }, ...categories].map((cat) => {
                      const isAll = cat.category_id === "all";
                      const active = isAll ? listCategories.length === 0 : listCategories.includes(cat.category_id);
                      return (
                        <button
                          key={cat.category_id}
                          type="button"
                          onClick={() => {
                            if (isAll) {
                              setListCategories([]);
                              setCategoryMenuOpen(false);
                            } else {
                              setListCategories((prev) =>
                                prev.includes(cat.category_id) ? prev.filter((id) => id !== cat.category_id) : [...prev, cat.category_id]
                              );
                            }
                          }}
                          className={`self-start mx-[5px] my-[5px] py-2.5 px-3.5 rounded-lg bg-white border flex items-center justify-center active:opacity-70 ${
                            active ? "border-[#A31D1D]" : "border-[#eee]"
                          }`}
                        >
                          <span className={`text-[13px] ${active ? "text-[#A31D1D] font-bold" : "text-[#333] font-semibold"}`}>
                            {cat.category_name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {filteredItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20">
                <Icon name="search-outline" size={48} color="#C5AFA7" />
                <p className="text-[20px] font-extrabold text-[#1a1a1a] mt-4 mb-2.5">No items found</p>
                <p className="text-[14px] text-black/65 text-center leading-[22px]">Try adjusting your search or filter.</p>
              </div>
            ) : (
          <div className="grid grid-cols-2 gap-x-[4%] sm:grid-cols-3 sm:gap-x-[2%] lg:grid-cols-4 lg:gap-x-5 xl:grid-cols-5 p-3 lg:px-10 lg:pt-0 lg:pb-10 pb-10">
            {filteredItems.map((item) => (
              <div
                key={item.qr_code_id}
                className="bg-white rounded-xl overflow-hidden mb-3 flex flex-col"
                style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.07)" }}
              >
                <button type="button" onClick={() => openDetail(item)} className="block w-full text-left active:opacity-80">
                  {item.image_url ? (
                    <SafeImage src={item.image_url} alt={item.item_name} className="w-full h-[140px] object-cover" />
                  ) : (
                    <div className="w-full h-[140px] bg-[#EDE0D4] flex items-center justify-center">
                      <Icon family="mci" name="image-off-outline" size={36} color="#B0A09A" />
                    </div>
                  )}
                  <p className="text-[14px] font-semibold text-[#1a1a1a] px-2.5 py-2 bg-white truncate">{item.item_name}</p>
                </button>

                <div className="flex border-t border-black/[0.07]">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    aria-label={`Edit ${item.item_name}`}
                    className="flex-1 h-[41px] flex items-center justify-center bg-white active:opacity-70"
                  >
                    <Icon family="mci" name="pencil-outline" size={20} color="#8B0000" />
                  </button>
                  <div className="w-px bg-black/[0.07]" />
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteTargetId(item.qr_code_id);
                      setShowDeleteModal(true);
                    }}
                    aria-label={`Delete ${item.item_name}`}
                    className="flex-1 h-[41px] flex items-center justify-center bg-primary active:opacity-80"
                  >
                    <Icon family="mci" name="trash-can-outline" size={20} color="#FFFFFF" />
                  </button>
                </div>
              </div>
            ))}
          </div>
            )}
          </>
        )}

        {showDeleteModal && (
          <AlertDialog
            message="This will remove your registered item from the system."
            b1Label="No, keep it"
            b2Label="Delete"
            b1OnClick={() => {
              setShowDeleteModal(false);
              setDeleteTargetId(null);
            }}
            b2OnClick={handleDeleteConfirm}
          />
        )}
      </div>
    );
  }

  // =====================
  // VIEW ITEM DETAIL (read-only, QrItemViewScreen)
  // =====================
  if (page === "viewItemDetail" && viewingItem) {
    return (
      <div className={screen}>
        <StackHeader
          title={viewingItem.item_name}
          onBack={() => {
            setViewingItem(null);
            setPage(fromScan ? "scan" : "viewItems");
          }}
        />

        <div className="px-4 pt-5 pb-10 flex flex-col">
          <ValueField label="Owner Name" value={viewingItem.owner_name} />
          <ValueField label="Student Number" value={viewingItem.student_number} />
          <ValueField label="Course and Section" value={viewingItem.course_section} />
          <ValueField label="Contact Number" value={viewingItem.contact_number} />

          <SectionHeading>Item Description</SectionHeading>

          <PhotoCard image={viewingItem.image_url} viewOnly />

          <ValueField label="Category" value={viewingItem.category_name} />
          <ValueField label="Item Name" value={viewingItem.item_name} />
          <ValueField label="Detailed Description" value={viewingItem.description} multiline />
          <ValueField label="Contents (if applicable)" value={viewingItem.contents} />

          <div className="h-px bg-black/10 mb-6" />

          <button
            type="button"
            onClick={() => handleViewQr(viewingItem)}
            disabled={!viewingItem.qr_data}
            className="w-full h-[52px] rounded-xl bg-primary flex items-center justify-center active:opacity-80 disabled:opacity-50"
          >
            <span className="mr-2 flex">
              <Icon name="qr-code-outline" size={20} color="#FFFFFF" />
            </span>
            <span className="text-[15px] font-bold text-white">View QR</span>
          </button>

          {fromScan && (
            <button
              type="button"
              onClick={() => {
                setViewingItem(null);
                setPage("scan");
              }}
              className="w-full h-[52px] rounded-xl bg-transparent border-[1.5px] border-[#A31D1D] mt-3 flex items-center justify-center active:opacity-80"
            >
              <span className="text-[15px] font-bold text-[#A31D1D]">Scan Another Item</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // =====================
  // VIEW QR CODE (read-only)
  // =====================
  if (page === "viewQr") {
    return (
      <QrCardScreen
        isView
        banner="Your Item QR Code"
        itemName={viewingItem?.item_name || "Item"}
        qrCodeUrl={viewQrCodeUrl}
        bottomLabel="Close"
        onBottom={() => {
          setViewQrCodeUrl("");
          setPage("viewItemDetail");
        }}
      />
    );
  }

  // =====================
  // EDIT ITEM
  // =====================
  if (page === "editItem") {
    const leaveEdit = () => {
      if (isAnalyzing) showToast("Please wait until scanning finishes.");
      else if (hasEditChanges) setShowEditDiscard(true);
      else setPage("viewItems");
    };

    return (
      <div className={screen}>
        <StackHeader title="Edit Registered Item" onBack={leaveEdit} />

        <div className="px-4 pt-5 pb-10 flex flex-col">
          <OwnerField label="Owner Name" value={viewingItem?.owner_name} />
          <OwnerField label="Student Number" value={viewingItem?.student_number} />
          <OwnerField label="Course and Section" value={viewingItem?.course_section} />
          <OwnerField label="Contact Number" value={viewingItem?.contact_number} />

          <SectionHeading>Item Description</SectionHeading>

          <PhotoCard
            image={editHasPhoto ? editForm.imagePreview : null}
            error={editErrors.image}
            isAnalyzing={isAnalyzing}
            canScan={!!editForm.file && !isAnalyzing && editForm.file !== scannedFile}
            onPick={(file) => {
              const imagePreview = previewFor(file);
              setEditForm((prev) => ({ ...prev, file, imagePreview }));
              setImageRemoved(false);
              setEditErrors((prev) => ({ ...prev, image: undefined }));
            }}
            onRemove={() => {
              setEditForm((prev) => ({ ...prev, file: null, imagePreview: null }));
              setImageRemoved(true);
            }}
            onScan={() => analyzeImage(editForm.file, setEditForm, setEditErrors)}
          />

          <ItemFields
            form={editForm}
            setForm={setEditForm}
            errors={editErrors}
            setErrors={setEditErrors}
            categories={categories}
            disabled={isAnalyzing}
          />

          <FormButtons
            onCancel={leaveEdit}
            onSubmit={handleEditPress}
            submitLabel="Save Changes"
            disabled={!hasEditChanges || loading || isAnalyzing}
            busy={loading}
          />
        </div>

        {showSaveConfirm && (
          <AlertDialog
            message="Are you sure you want to save these changes?"
            b1Label="Review"
            b2Label="Save"
            b1OnClick={() => setShowSaveConfirm(false)}
            b2OnClick={handleEditSave}
          />
        )}

        {showEditDiscard && (
          <AlertDialog
            message="Discard changes? Unsaved edits will be lost."
            b1Label="Keep Editing"
            b2Label="Discard"
            b1OnClick={() => setShowEditDiscard(false)}
            b2OnClick={() => {
              setShowEditDiscard(false);
              setEditBase(null);
              setPage("viewItems");
            }}
          />
        )}
      </div>
    );
  }

  // =====================
  // SCAN AN ITEM
  // =====================
  if (page === "scan") {
    return (
      <div className="desk-nopad bg-black min-h-[calc(100vh-70px)] lg:min-h-screen flex flex-col">
        <StackHeader title="Scan An Item" onBack={() => setPage("main")} />

        {!scannerError ? (
          <div className="relative flex-1">
            <div
              id="qr-reader"
              ref={scannerRef}
              className="absolute inset-0 w-full h-full [&_video]:w-full! [&_video]:h-full! [&_video]:object-cover!"
            />

            {/* Dimmed overlay with the viewfinder */}
            <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center pointer-events-none">
              <div className="relative w-[240px] h-[240px]">
                <span className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-white rounded-tl" />
                <span className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-white rounded-tr" />
                <span className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-white rounded-bl" />
                <span className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-white rounded-br" />
              </div>
              <p className="mt-7 text-[14px] text-white/75 text-center px-8">Point your camera at a FoundNest QR code</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-[#FFF1E0] flex flex-col items-center justify-center px-8 gap-3">
            <Icon name="camera-outline" size={56} color="#8B0000" />
            <p className="text-[20px] font-extrabold text-[#1a1a1a] text-center">Camera Access Required</p>
            <p className="text-[14px] text-black/65 text-center leading-[22px] mb-2">{scannerError}</p>
            <button
              type="button"
              onClick={() => setScanRetryCount((c) => c + 1)}
              className="w-full h-[52px] rounded-xl bg-primary text-[15px] font-bold text-white active:opacity-80"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    );
  }

  // =====================
  // SCAN RESULT (checking / not found / not yours)
  // =====================
  if (page === "scanResult") {
    const handleScanAgain = () => {
      setScanResult(null);
      setPage("scan");
    };
    const status = scanResult?.status;

    if (status === "loading" || !scanResult) {
      return (
        <div className="desk-nopad bg-black min-h-[calc(100vh-70px)] lg:min-h-screen flex flex-col">
          <StackHeader title="Scan An Item" onBack={() => setPage("main")} />
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-9 h-9 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-[16px] font-medium text-white">Checking item…</p>
          </div>
        </div>
      );
    }

    return (
      <div className={`${screen} flex flex-col`}>
        <StackHeader title="Scan An Item" onBack={() => setPage("main")} />

        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8 gap-3">
          <span
            className={`w-[72px] h-[72px] rounded-full flex items-center justify-center mb-2 ${
              status === "not_owner" ? "bg-[#5C5C5C]" : "bg-primary"
            }`}
          >
            <Icon name={status === "not_owner" ? "lock-closed" : "close"} size={36} color="#FFFFFF" />
          </span>
          <p className="text-[20px] font-extrabold text-[#1a1a1a] text-center">
            {status === "not_owner" ? "Item Not Yours" : "QR Code Not Found"}
          </p>
          <p className="text-[14px] text-black/65 text-center leading-[22px] mb-2">
            {status === "not_owner"
              ? "This item is registered under a different account. Details are private for security reasons."
              : scanResult.message || "This QR code is not registered in FoundNest."}
          </p>

          <button
            type="button"
            onClick={handleScanAgain}
            className="w-full h-[52px] rounded-xl bg-primary text-[15px] font-bold text-white active:opacity-80"
          >
            Scan Another Item
          </button>
          <button
            type="button"
            onClick={() => setPage("main")}
            className="w-full h-[52px] rounded-xl border border-[#D48B8B] bg-white text-[15px] font-semibold text-[#1a1a1a] active:opacity-80"
          >
            Back to QR Item
          </button>
        </div>
      </div>
    );
  }
}
