import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { CircleAlert } from "lucide-react";
import PageLabel from "../components/PageLabel";
import PageLabelWithReturn from "../components/PageLabelWithReturn";
import HorizontalBreak from "../components/HorizontalBreak";
import Loading from "../components/Loading";
import AlertDialog from "../components/AlertDialog";
import Toast from "../components/Toast";
import InfoIcon from "../assets/info_icon.png";
import heart from "../assets/heart.png";
import { fetchWithAuth } from "../utils/fetchWithAuth";

const API_URL = import.meta.env.VITE_API_URL;

/* -------------------------------------------------------------------------- */
/* Limits                                                                     */
/* -------------------------------------------------------------------------- */

// Change these in one place; inputs, counters, validation and AI output all use them.
const LIMITS = {
  itemName: 50,
  description: 500,
  contents: 100,
  specificLocation: 100,
};
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const showToast = (message) => toast.custom(() => <Toast icon={InfoIcon} message={message} />);

// Strips < >, collapses whitespace, and enforces the max length
const sanitizeInput = (value, maxLength) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/[<>]/g, "")
    .slice(0, maxLength);

async function fetchJson(url) {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
  return data;
}

// Page 1 validation: returns { valid, errors } like the mobile form
function validatePage1({ categoryId, itemName, description, contents }) {
  const errors = {};

  if (!categoryId) errors.category = "Please select a category.";

  const name = itemName.trim();
  if (!name) errors.itemName = "Item name is required.";
  else if (name.length > LIMITS.itemName)
    errors.itemName = `Item name must be ${LIMITS.itemName} characters or less.`;

  const desc = description.trim();
  if (!desc) errors.description = "Description is required.";
  else if (desc.length > LIMITS.description)
    errors.description = `Description must be ${LIMITS.description} characters or less.`;

  if (contents.trim().length > LIMITS.contents)
    errors.contents = `Contents must be ${LIMITS.contents} characters or less.`;

  return { valid: Object.keys(errors).length === 0, errors };
}

// Date helpers use LOCAL time. The old version compared UTC dates, which made
// "today" unselectable for users ahead of UTC (e.g. the Philippines, before 8am).
const pad = (n) => String(n).padStart(2, "0");

const todayLocalISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const parseLocal = (dateStr, timeStr = "00:00") => {
  const [y, m, d] = (dateStr || "").split("-").map(Number);
  const [h, min] = (timeStr || "00:00").split(":").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, h || 0, min || 0);
};

const isValidPastOrToday = (dateStr) => {
  const chosen = parseLocal(dateStr);
  if (!chosen || Number.isNaN(chosen.getTime())) return false;
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  return chosen <= endOfToday;
};

const isTimeNotFuture = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return false;
  const chosen = parseLocal(dateStr, timeStr);
  return !!chosen && chosen <= new Date();
};

/* -------------------------------------------------------------------------- */
/* UI pieces                                                                  */
/* -------------------------------------------------------------------------- */

// Shared look for inputs, selects and textareas (same as the mobile form)
const fieldClass = (hasError, extra = "") =>
  `w-full rounded-lg border px-3 text-base text-[#333] bg-white outline-none placeholder:text-[#8C7A70] focus:border-primary disabled:bg-white disabled:opacity-80 ${
    hasError ? "border-[#C62828]" : "border-[#DDD9CF]"
  } ${extra}`;

function Spinner({ className = "h-8 w-8" }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-[3px] border-primary border-t-transparent ${className}`}
    />
  );
}

function SectionHeading({ children }) {
  return (
    <h2 className="text-[17px] font-black text-black border-b border-black px-2.5 pt-5 pb-4 mb-5">
      {children}
    </h2>
  );
}

// Label + control + error message + optional character counter
function Field({ label, htmlFor, required, error, hint, count, max, children }) {
  return (
    <div className="mt-5">
      <label htmlFor={htmlFor} className="block text-[17px] font-extrabold mb-2">
        {label}
        {required && <span className="text-primary"> *</span>}
      </label>
      {children}
      <div className="flex items-start justify-between gap-2 mt-1 min-h-4">
        {error ? (
          <p role="alert" className="text-[13px] text-[#C62828]">
            {error}
          </p>
        ) : (
          <p className="text-[13px] text-[#8C7A70]">{hint}</p>
        )}
        {max != null && (
          <p className={`text-xs shrink-0 ml-auto ${count >= max ? "text-[#C62828]" : "text-[#8C7A70]"}`}>
            {count}/{max}
          </p>
        )}
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-primary" : "bg-[#CCCCCC]"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

function ActionButton({ variant = "solid", danger = false, disabled = false, onClick, children }) {
  const look =
    variant === "solid"
      ? "bg-primary text-white px-8 disabled:bg-[#A0A0A0]"
      : danger
      ? "border border-[#C62828] text-[#C62828] px-5 disabled:opacity-50"
      : "border border-primary text-primary px-5 disabled:opacity-50";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-[10px] py-2.5 text-sm font-semibold transition-transform duration-100 enabled:active:scale-95 ${look}`}
    >
      {children}
    </button>
  );
}

function UploadCard({ image, isLoading, viewOnly, useAi, onToggleAi, onOpenPicker }) {
  const hasImage = image && image !== "REMOVE";

  return (
    <div className="flex justify-center pb-2.5">
      <div className="w-full max-w-[450px] bg-white rounded-[28px] py-5 px-5 flex flex-col items-center shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          onClick={onOpenPicker}
          disabled={isLoading || viewOnly}
          aria-label={hasImage ? "Change photo" : "Add photo"}
          className="mb-5 flex items-center justify-center disabled:cursor-default"
        >
          {isLoading ? (
            <div className="h-20 w-20 rounded-full border-[1.5px] border-dashed border-[#CCC] flex items-center justify-center">
              <Spinner />
            </div>
          ) : hasImage ? (
            <div className="relative h-[110px] w-[110px]">
              <img src={image} alt="Item" className="h-full w-full rounded-[20px] object-cover" />
              {!viewOnly && (
                <span className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary border-2 border-white flex items-center justify-center">
                  <i className="fa-solid fa-pen text-white text-[11px]" />
                </span>
              )}
            </div>
          ) : (
            <div className="h-20 w-20 rounded-full border-[1.5px] border-dashed border-primary flex items-center justify-center">
              <div className="h-[60px] w-[60px] rounded-full bg-primary flex items-center justify-center">
                <i className="fa-solid fa-plus text-white text-2xl" />
              </div>
            </div>
          )}
        </button>

        <p className="text-[17px] font-semibold text-[#6B5A52] text-center mb-3.5">
          {isLoading ? "Analyzing image..." : "Upload Item Photo (Optional)"}
        </p>
        <p className="text-[13px] text-[#8C7A70] text-center leading-[22px] px-3">
          *FoundNest AI will help auto-fill details based on your photo.
        </p>
        <p className="text-xs text-[#8C7A70] text-center mt-1">PNG, JPG or WEBP up to 10MB</p>

        {!viewOnly && (
          <div className="flex items-center justify-center gap-2.5 mt-3.5">
            <span className="text-sm font-semibold">Use AI to describe image</span>
            <Toggle
              checked={useAi}
              onChange={onToggleAi}
              disabled={isLoading}
              label="Use AI to describe image"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function PhotoSheet({ hasPhoto, onTake, onChoose, onRemove, onClose }) {
  const row =
    "w-full flex items-center gap-3 rounded-xl border border-[#eee] px-4 py-3 text-sm font-semibold text-left";

  return (
    <div className="fixed inset-0 bg-black/20 flex items-end justify-center z-50" onClick={onClose}>
      <div
        className="bg-white w-full rounded-t-3xl p-4 pb-25 flex flex-col gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={row} onClick={onTake}>
          <i className="fa-solid fa-camera w-5 text-center text-primary" />
          Take Photo
        </button>
        <button type="button" className={row} onClick={onChoose}>
          <i className="fa-regular fa-image w-5 text-center text-primary" />
          Choose from Library
        </button>
        {hasPhoto && (
          <button type="button" className={`${row} text-[#C62828]`} onClick={onRemove}>
            <i className="fa-regular fa-trash-can w-5 text-center" />
            Remove Photo
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl py-3 text-sm font-semibold text-primary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function LocationGroup({ group, selectedLocations, open, onToggleOpen, onToggleItem, disabled, readOnly }) {
  const count = group.items.filter((i) => selectedLocations.includes(i.name)).length;

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onToggleOpen}
        disabled={disabled}
        className="flex items-center justify-between p-2.5 text-xs font-medium bg-[#F2F2F2] rounded-md disabled:opacity-40"
      >
        <span>
          {group.title}
          {count > 0 && ` (${count})`}
        </span>
        <i className={`fa-solid fa-chevron-${open ? "up" : "down"} text-[10px] text-primary`} />
      </button>

      {open && (
        <div className="flex flex-wrap gap-2 pt-2 px-1">
          {group.items.map((item) => (
            <label
              key={item.key}
              className="cursor-pointer flex items-center gap-2 text-xs p-2 rounded-md font-medium w-fit bg-[#f9f9f9] border border-[#eee] has-[:checked]:border-primary"
            >
              <input
                type="checkbox"
                checked={selectedLocations.includes(item.name)}
                onChange={() => onToggleItem(item.name)}
                disabled={readOnly}
                className="w-3.5 h-3.5 accent-primary cursor-pointer"
              />
              {item.name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function Report() {
  const navigate = useNavigate();
  const { id, reportId, mode } = useParams();
  const viewOnly = mode === "view";
  const userID = localStorage.getItem("user_id");

  // ---- lookups ----
  const [categories, setCategories] = useState([]);
  const [offices, setOffices] = useState([]);
  const [sharedSpaces, setSharedSpaces] = useState([]);
  const [gates, setGates] = useState([]);

  // ---- page 1 fields ----
  const [image, setImage] = useState(null); // preview url | existing url | "REMOVE" | null
  const [selectedFile, setSelectedFile] = useState(null); // File | "REMOVE" | null
  const [categoryID, setCategoryID] = useState("");
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [contents, setContents] = useState("");
  const [errors, setErrors] = useState({});
  const [useAiDescribe, setUseAiDescribe] = useState(false);

  // ---- page 2 fields ----
  const [dateLost, setDateLost] = useState("");
  const [timeLost, setTimeLost] = useState("");
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [rawLocations, setRawLocations] = useState([]);
  const [cantRemember, setCantRemember] = useState(false);
  const [specificLocation, setSpecificLocation] = useState("");
  const [openLocations, setOpenLocations] = useState(false);
  const [openGroups, setOpenGroups] = useState({ college: false, shared: false, gates: false });

  // ---- flow / ui ----
  const [createdReportID, setCreatedReportID] = useState(null);
  const [nextPage, setNextPage] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isCancel, setIsCancel] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const blobUrlRef = useRef(null);

  const hasPhoto = !!image && image !== "REMOVE";
  const totalLocations = selectedLocations.length + (cantRemember ? 1 : 0);

  const dateValid = isValidPastOrToday(dateLost);
  const timeValid = dateValid && isTimeNotFuture(dateLost, timeLost);

  const locationGroups = useMemo(
    () => [
      {
        id: "college",
        title: "College Buildings",
        items: offices.map((o) => ({ key: o.office_id, name: o.office_name })),
      },
      {
        id: "shared",
        title: "Shared Spaces",
        items: sharedSpaces.map((s) => ({ key: s.shared_space_id, name: s.shared_space_name })),
      },
      {
        id: "gates",
        title: "Gates",
        items: gates.map((g) => ({ key: g.gate_id, name: g.gate_name })),
      },
    ],
    [offices, sharedSpaces, gates]
  );

  const locationLabel = (() => {
    if (totalLocations === 0) return "Select Locations";
    if (totalLocations === 1) return cantRemember ? "Can't remember" : selectedLocations[0];
    return `Locations (${totalLocations})`;
  })();

  /* ------------------------------- navigation ------------------------------ */

  const navBack = () => {
    if (mode === "view" && reportId) navigate(`/notifications/${reportId}/verify`);
    else navigate(`/profile/report-history/${userID}`);
  };

  /* ------------------------------ data loading ----------------------------- */

  useEffect(() => {
    (async () => {
      const results = await Promise.allSettled([
        fetchJson(`${API_URL}/api/categories`),
        fetchJson(`${API_URL}/api/offices`),
        fetchJson(`${API_URL}/api/gates`),
        fetchJson(`${API_URL}/api/shared-spaces`),
      ]);

      results.forEach((r) => r.status === "rejected" && console.error(r.reason));
      const list = (r) => (r.status === "fulfilled" && Array.isArray(r.value) ? r.value : []);

      setCategories(list(results[0]));
      setOffices(list(results[1]));
      setGates(list(results[2]));
      setSharedSpaces(list(results[3]));
    })();
  }, []);

  const fetchLostReport = async (reportToLoad) => {
    try {
      setIsLoadingReport(true);
      const res = await fetchWithAuth(`${API_URL}/api/lost-reports/${reportToLoad}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Cannot fetch lost report");

      setItemName(data.item_name || "");
      setDescription(data.description || "");
      setContents(data.contents || "");
      setCategoryID(String(data.category_id || ""));
      setSpecificLocation(data.specific_location || "");

      if (data.image_url) setImage(data.image_url); // existing photo; replaced only if user picks a new one

      if (data.lost_date) {
        const [datePart, timePart] = data.lost_date.split(/[T ]/);
        setDateLost(datePart || "");
        setTimeLost(timePart?.slice(0, 5) || ""); // "14:30:00" -> "14:30"
      }

      if (data.location_lost) {
        let parsed;
        try {
          parsed = JSON.parse(data.location_lost);
        } catch {
          parsed = [data.location_lost];
        }

        if (Array.isArray(parsed)) {
          if (parsed.includes("Can't Remember")) setCantRemember(true);
          else setRawLocations(parsed);
        }
      }

      setIsEdit(true);
    } catch (err) {
      console.error(err);
      showToast(err.message || "Cannot load this report.");
    } finally {
      setIsLoadingReport(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchLostReport(id);
      setCreatedReportID(id);
    }
  }, [id]);

  // Once the location lists are loaded, tick the ones saved on the report
  useEffect(() => {
    if (rawLocations.length === 0) return;

    const known = new Set(
      locationGroups.flatMap((g) => g.items.map((i) => i.name?.trim().toLowerCase())).filter(Boolean)
    );
    if (known.size === 0) return;

    setSelectedLocations(rawLocations.filter((loc) => known.has(loc.trim().toLowerCase())));
  }, [rawLocations, locationGroups]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [nextPage, submitted]);

  useEffect(
    () => () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    },
    []
  );

  /* -------------------------------- photo + AI ----------------------------- */

  const setPhoto = (file) => {
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    const url = URL.createObjectURL(file);
    blobUrlRef.current = url;
    setImage(url);
    setSelectedFile(file);
  };

  // When editing, "REMOVE" tells the server to drop the saved photo
  const clearPhoto = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setImage(isEdit ? "REMOVE" : null);
    setSelectedFile(isEdit ? "REMOVE" : null);
  };

  const analyzeImage = async (file) => {
    try {
      setIsAnalyzing(true);

      const formData = new FormData();
      formData.append("image", file);

      const res = await fetchWithAuth(`${API_URL}/api/gemini-item-listing/describe-item`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI analysis failed");

      // AI text is cut to the same limits as typed text
      setItemName(sanitizeInput(data.itemName, LIMITS.itemName));
      setDescription(sanitizeInput(data.detailedDescription, LIMITS.description));
      setContents(sanitizeInput(data.contents, LIMITS.contents));
      setErrors({});

      const aiCategory = data.category?.toLowerCase();
      const matched = categories.find((c) => c.category_name?.toLowerCase() === aiCategory);
      if (matched) setCategoryID(String(matched.category_id));
    } catch (err) {
      console.error(err);
      showToast("Failed to auto-fill details. Please fill them out manually.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the same file be picked again
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      showToast("File size exceeds 10MB limit");
      return;
    }
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      showToast("Invalid file type");
      return;
    }

    setPhoto(file);
    if (useAiDescribe) analyzeImage(file);
  };

  // Same rule as the mobile form: turning AI on clears the photo so the
  // next one the user adds is scanned
  const handleAiToggle = (value) => {
    setUseAiDescribe(value);
    if (value && hasPhoto) {
      clearPhoto();
      showToast("Photo removed. Please insert an image again to use AI.");
    }
  };

  /* ------------------------------ page 1 actions --------------------------- */

  const clearError = (key) => errors[key] && setErrors((prev) => ({ ...prev, [key]: undefined }));

  const confirmClearAll = () => {
    clearPhoto();
    setCategoryID("");
    setItemName("");
    setDescription("");
    setContents("");
    setErrors({});
    setShowClearConfirm(false);
  };

  const handleNext = () => {
    if (viewOnly) {
      setNextPage(true);
      return;
    }

    const { valid, errors: found } = validatePage1({
      categoryId: categoryID,
      itemName,
      description,
      contents,
    });

    if (!valid) {
      setErrors(found);
      showToast("Please fix the highlighted fields before continuing.");
      return;
    }

    setErrors({});
    setNextPage(true);
  };

  /* ------------------------------ page 2 actions --------------------------- */

  const handleDateChange = (value) => {
    setDateLost(value);
    setTimeLost("");
  };

  const toggleLocation = (name) =>
    setSelectedLocations((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );

  const toggleCantRemember = () => {
    setCantRemember((prev) => !prev);
    setSelectedLocations([]); // "Can't remember" replaces any other choice
    setOpenGroups({ college: false, shared: false, gates: false });
  };

  /* --------------------------------- saving -------------------------------- */

  const buildFormData = () => {
    const formData = new FormData();

    if (selectedFile) formData.append("image", selectedFile);
    formData.append("item_name", itemName.trim());
    formData.append("description", description.trim());
    formData.append("contents", contents.trim());
    formData.append("category_id", categoryID);
    formData.append("user_id", userID);
    formData.append("specific_location", specificLocation.trim());
    formData.append("lost_date", `${dateLost} ${timeLost}`);
    formData.append(
      "location_lost",
      JSON.stringify(cantRemember ? ["Can't Remember"] : selectedLocations)
    );

    return formData;
  };

  const saveReport = async (isUpdate) => {
    setShowSubmitConfirmation(false);
    if (isUpdate) setIsUpdating(true);
    else setIsSubmitting(true);

    try {
      const res = await fetchWithAuth(
        isUpdate ? `${API_URL}/api/lost-reports/${createdReportID}` : `${API_URL}/api/lost-reports`,
        { method: isUpdate ? "PUT" : "POST", body: buildFormData() }
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || data.message || "Something went wrong");

      if (!isUpdate) setCreatedReportID(data.report?.lost_report_id ?? null);
      setSubmitted(true);
      if (isUpdate) showToast("Report edited successfully.");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
      setIsUpdating(false);
    }
  };

  /* ---------------------------- cancel / edit flow ------------------------- */

  const handleDiscard = () => {
    if (reportId) {
      navigate(`/notifications/${reportId}/verify`);
    } else if (id) {
      navigate(`/profile/report-history/${userID}`);
    } else {
      setIsCancel(false);
      setNextPage(true);
      setSubmitted(true);
    }
    showToast("Edit has been cancelled.");
  };

  const handleEditReport = () => {
    setNextPage(false);
    setSubmitted(false);
    setIsEdit(true);
  };

  /* --------------------------------- render -------------------------------- */

  return (
    <>
      <div className={submitted ? "hidden" : ""}>
        {mode ? (
          <PageLabelWithReturn label="View Lost Item Report Form" onClick={navBack} />
        ) : (
          <PageLabel label={id ? "Edit Lost Item Report Form" : "Lost Item Report Form"} />
        )}
      </div>

      <div
        className={`${
          submitted
            ? "bg-(--color-primary) flex flex-col items-center justify-center"
            : "bg-(--color-secondary)"
        } min-h-screen px-4`}
      >
        {/* ---------------------------- PAGE 1 ---------------------------- */}
        {!nextPage && (
          <div className="pb-24">
            <SectionHeading>Item Description</SectionHeading>

            <UploadCard
              image={image}
              isLoading={isAnalyzing}
              viewOnly={viewOnly}
              useAi={useAiDescribe}
              onToggleAi={handleAiToggle}
              onOpenPicker={() => setShowImageOptions(true)}
            />

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <Field label="Category" htmlFor="category" required error={errors.category}>
              <div className="relative">
                <select
                  id="category"
                  value={categoryID}
                  disabled={viewOnly || categories.length === 0}
                  onChange={(e) => {
                    setCategoryID(e.target.value);
                    clearError("category");
                  }}
                  className={fieldClass(
                    !!errors.category,
                    `h-[50px] appearance-none pr-10 ${categoryID ? "" : "text-[#8C7A70]"}`
                  )}
                >
                  <option value="">
                    {categories.length === 0 ? "Loading categories..." : "Select Category"}
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.category_id} value={String(cat.category_id)}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
                <i className="fa-solid fa-chevron-down pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-primary" />
              </div>
            </Field>

            <Field
              label="Item Name"
              htmlFor="item-name"
              required
              error={errors.itemName}
              count={itemName.length}
              max={LIMITS.itemName}
            >
              <input
                id="item-name"
                type="text"
                value={itemName}
                maxLength={LIMITS.itemName}
                disabled={viewOnly}
                placeholder="e.g., iPhone 13 Pro Max, Bag, Umbrella"
                onChange={(e) => {
                  setItemName(sanitizeInput(e.target.value, LIMITS.itemName));
                  clearError("itemName");
                }}
                className={fieldClass(!!errors.itemName, "h-[50px]")}
              />
            </Field>

            <Field
              label="Detailed Description"
              htmlFor="description"
              required
              error={errors.description}
              count={description.length}
              max={LIMITS.description}
            >
              <textarea
                id="description"
                value={description}
                maxLength={LIMITS.description}
                disabled={viewOnly}
                placeholder="Brand, Model, Size, Color, Material, etc."
                onChange={(e) => {
                  setDescription(sanitizeInput(e.target.value, LIMITS.description));
                  clearError("description");
                }}
                className={fieldClass(!!errors.description, "h-[140px] py-3 resize-none")}
              />
            </Field>

            <Field
              label="Contents (if applicable)"
              htmlFor="contents"
              error={errors.contents}
              count={contents.length}
              max={LIMITS.contents}
            >
              <input
                id="contents"
                type="text"
                value={contents}
                maxLength={LIMITS.contents}
                disabled={viewOnly}
                placeholder="e.g., Cash amount, ID name"
                onChange={(e) => {
                  setContents(sanitizeInput(e.target.value, LIMITS.contents));
                  clearError("contents");
                }}
                className={fieldClass(!!errors.contents, "h-[50px]")}
              />
            </Field>

            <div className="flex items-center justify-between mt-5 py-7 border-t border-black/[0.24]">
              <p className="text-sm font-bold">Page 1 out of 2</p>

              <div className="flex gap-2.5">
                {isEdit && !mode ? (
                  <ActionButton variant="outline" onClick={() => setIsCancel(true)}>
                    Cancel
                  </ActionButton>
                ) : (
                  !viewOnly && (
                    <ActionButton variant="outline" danger onClick={() => setShowClearConfirm(true)}>
                      Clear All
                    </ActionButton>
                  )
                )}
                <ActionButton onClick={handleNext}>Next</ActionButton>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------- PAGE 2 ---------------------------- */}
        {nextPage && !submitted && (
          <div className="pb-24">
            <SectionHeading>When & Where</SectionHeading>

            <Field
              label="Date Lost"
              htmlFor="date-lost"
              required
              error={dateLost && !dateValid ? "Date cannot be in the future." : null}
            >
              <input
                id="date-lost"
                type="date"
                value={dateLost}
                max={todayLocalISO()}
                disabled={viewOnly}
                onChange={(e) => handleDateChange(e.target.value)}
                className={fieldClass(!!dateLost && !dateValid, "h-[50px]")}
              />
            </Field>

            <Field
              label="Time Lost"
              htmlFor="time-lost"
              required
              error={dateValid && timeLost && !timeValid ? "Time cannot be in the future." : null}
              hint={!dateValid ? "Enter a valid date first." : null}
            >
              <input
                id="time-lost"
                type="time"
                value={timeLost}
                disabled={!dateValid || viewOnly}
                onChange={(e) => setTimeLost(e.target.value)}
                className={fieldClass(dateValid && !!timeLost && !timeValid, "h-[50px]")}
              />
            </Field>

            <Field label="Location Lost" required>
              <button
                type="button"
                onClick={() => setOpenLocations((prev) => !prev)}
                className={fieldClass(false, "h-[50px] flex items-center justify-between text-left text-sm")}
              >
                <span className={`truncate ${totalLocations === 0 ? "text-[#8C7A70]" : ""}`}>
                  {locationLabel}
                </span>
                <i
                  className={`fa-solid fa-chevron-${openLocations ? "up" : "down"} ml-2 text-sm text-primary shrink-0`}
                />
              </button>

              {openLocations && (
                <div className="mt-2 rounded-xl border border-primary bg-white p-2 flex flex-col gap-2">
                  {locationGroups.map((group) => (
                    <LocationGroup
                      key={group.id}
                      group={group}
                      selectedLocations={selectedLocations}
                      open={openGroups[group.id]}
                      onToggleOpen={() =>
                        setOpenGroups((prev) => ({ ...prev, [group.id]: !prev[group.id] }))
                      }
                      onToggleItem={toggleLocation}
                      disabled={cantRemember}
                      readOnly={viewOnly}
                    />
                  ))}

                  <hr className="my-1 border-gray-200" />

                  <label
                    className={`cursor-pointer flex items-center gap-2 text-xs p-2 rounded-md font-medium w-full ${
                      cantRemember ? "bg-[#e5d4b8] text-primary" : "bg-[#F2F2F2]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={cantRemember}
                      onChange={toggleCantRemember}
                      disabled={viewOnly}
                      className="w-4 h-4 accent-primary cursor-pointer ml-1"
                    />
                    Can't remember the location
                  </label>
                </div>
              )}
            </Field>

            <Field
              label="Specific Location"
              htmlFor="specific-location"
              count={specificLocation.length}
              max={LIMITS.specificLocation}
            >
              <input
                id="specific-location"
                type="text"
                value={specificLocation}
                maxLength={LIMITS.specificLocation}
                disabled={viewOnly}
                placeholder="e.g., 2nd Floor, Room A, near stairs, etc."
                onChange={(e) =>
                  setSpecificLocation(sanitizeInput(e.target.value, LIMITS.specificLocation))
                }
                className={fieldClass(false, "h-[50px]")}
              />
            </Field>

            <div className="bg-primary/20 text-primary-content w-full my-3 rounded-md">
              <div className="card-body">
                <div className="w-full flex items-center">
                  <CircleAlert className="size-4 mr-2" />
                  <p className="card-title text-sm">What happens next?</p>
                </div>
                <p className="text-primary text-xs">
                  We’ll check for matching found items and notify you if we find a potential match.
                  You’ll receive updates via the notification bell.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-5 py-7 border-t border-black/[0.24]">
              <p className="text-sm font-bold">Page 2 out of 2</p>

              <div className="flex gap-2.5">
                <ActionButton variant="outline" onClick={() => setNextPage(false)}>
                  Back
                </ActionButton>
                {!viewOnly && (
                  <ActionButton
                    disabled={isEdit ? !timeValid : !timeValid || totalLocations === 0}
                    onClick={() => setShowSubmitConfirmation(true)}
                  >
                    {isEdit ? "Confirm" : "Submit"}
                  </ActionButton>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --------------------------- SUCCESS ---------------------------- */}
        {submitted && nextPage && (
          <div className="h-fit w-fit px-3 flex flex-col gap-8">
            <div className="h-28 w-full flex gap-2 justify-evenly">
              <img className="h-full w-2/5" src={heart} alt="smiley heart" />
              <div className="flex flex-col gap-2 h-full w-full">
                <p className="text-white font-bold text-md">Report Successful!</p>
                <p className="text-white/70 font-bold text-xs text-justify">
                  We've secured your lost report and immediately started searching for a match. Rest
                  assured, we'll notify you if we find it.
                </p>
              </div>
            </div>

            <div className="h-full w-full rounded-xl bg-white">
              <div className="h-full w-full flex flex-col gap-2 p-4">
                <p className="font-bold text-xs">What happens next?</p>
                <div className="pl-5 flex flex-col gap-2">
                  <li className="text-xs">Your detailed description has been added to our records.</li>
                  <li className="text-xs">
                    Our system is now automatically searching and comparing your report against all
                    old and newly found items.
                  </li>
                  <li className="text-xs">
                    We will notify you immediately via email or in-app notifications if a potential
                    match is reported by a finder.
                  </li>
                </div>
              </div>

              <HorizontalBreak />

              <div className="flex justify-between px-3 py-3">
                <button type="button" className="flex items-center gap-1" onClick={handleEditReport}>
                  <i className="fa-regular fa-pen-to-square text-primary" />
                  <span className="text-xs text-primary">Edit Report</span>
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1"
                  onClick={() => navigate(`/profile/report-history/${userID}`)}
                >
                  <span className="text-xs text-primary">Go to my Report History</span>
                  <i className="fa-solid fa-arrow-right text-primary" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------ overlays & dialogs ------------------------ */}
        {isAnalyzing && <Loading label="Analyzing Image" />}
        {isSubmitting && <Loading label="Creating Lost Report" />}
        {isUpdating && <Loading label="Updating Lost Report" />}

        {isCancel && (
          <AlertDialog
            message="Discard changes? Unsaved edits will be lost."
            b1Label="Keep Editing"
            b2Label="Discard"
            b1OnClick={() => setIsCancel(false)}
            b2OnClick={handleDiscard}
          />
        )}

        {showClearConfirm && (
          <AlertDialog
            message="Clear all entered data? This action cannot be undone."
            b1Label="Cancel"
            b2Label="Clear"
            b1OnClick={() => setShowClearConfirm(false)}
            b2OnClick={confirmClearAll}
          />
        )}

        {showSubmitConfirmation && (
          <AlertDialog
            message="Please review the information for accuracy before submission."
            b1Label="Cancel"
            b2Label={isEdit ? "Update" : "Submit"}
            b1OnClick={() => setShowSubmitConfirmation(false)}
            b2OnClick={() => saveReport(isEdit)}
          />
        )}

        {showImageOptions && (
          <PhotoSheet
            hasPhoto={hasPhoto}
            onClose={() => setShowImageOptions(false)}
            onTake={() => {
              setShowImageOptions(false);
              cameraInputRef.current?.click();
            }}
            onChoose={() => {
              setShowImageOptions(false);
              galleryInputRef.current?.click();
            }}
            onRemove={() => {
              setShowImageOptions(false);
              clearPhoto();
            }}
          />
        )}
      </div>

      {isLoadingReport && <Loading />}
    </>
  );
}