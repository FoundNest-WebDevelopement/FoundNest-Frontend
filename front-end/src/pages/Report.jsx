import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import AlertDialog from "../components/AlertDialog";
import Toast from "../user-native/Toast";
import happyHeart from "../assets/native/happy-heart.png";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import UploadCard from "../components/report_components/UploadCard";
import PhotoSheet from "../components/report_components/PhotoSheet";
import WebcamCaptureModal from "../components/report_components/WebcamCaptureModal";
import AppHeader from "../user-native/AppHeader";
import Icon from "../user-native/Icon";
import {
  Dropdown,
  FieldError,
  FormTitle,
  FormTitleRow,
  NextSection,
  SectionTitle,
  SubTitle,
  TextBox,
} from "../user-native/form";
import { useUnsavedChangesGuard } from "../context/UnsavedChangesContext";
import { sanitizeText, minLengthMessage } from "../utils/textValidation";
import { isMobileDevice } from "../utils/isMobileDevice";

const API_URL = import.meta.env.VITE_API_URL;

const LIMITS = {
  itemName: 50,
  description: 500,
  contents: 100,
  specificLocation: 100,
};
const MIN_LENGTHS = {
  itemName: 2,
  description: 10,
};
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

const showToast = (message) => toast.custom(() => <Toast message={message} solid={true} />, { duration: 1500 });
const showToastLight = (message) => toast.custom(() => <Toast message={message}  />, { duration: 1500 });

const sanitizeInput = sanitizeText;

async function fetchJson(url) {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
  return data;
}

// Exact match first, then a partial match either way round (same rule as the
// mobile app) so "Electronic" or "Electronics device" still picks "Electronics".
function matchCategoryFromAi(aiCategory, categoryList) {
  const normalized = String(aiCategory ?? "").trim().toLowerCase();
  if (!normalized || !categoryList?.length) return null;

  const names = categoryList.map((c) => ({ c, name: String(c.category_name ?? "").toLowerCase() }));
  const exact = names.find((n) => n.name === normalized);
  if (exact) return exact.c;

  const partial = names.find(
    (n) => n.name && (normalized.includes(n.name) || n.name.includes(normalized))
  );
  return partial ? partial.c : null;
}

// location_lost is stored as a JSON array by the web and as a comma-joined
// string by the mobile app, so both shapes have to load into the edit form.
function parseLocationLost(value) {
  if (!value) return [];

  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    parsed = String(value).split(",");
  }

  return (Array.isArray(parsed) ? parsed : [parsed])
    .map((l) => String(l ?? "").trim())
    .filter(Boolean);
}

const isCantRemember = (loc) => /^can'?t remember$/i.test(loc);

const NON_EDITABLE_STATUSES = ["cancelled", "resolved", "archived"];

function validatePage1({ categoryId, itemName, description, contents }) {
  const errors = {};

  if (!categoryId) errors.category = "Please select a category.";

  const name = itemName.trim();
  if (!name) errors.itemName = "Item name is required.";
  else if (name.length < MIN_LENGTHS.itemName) errors.itemName = minLengthMessage(MIN_LENGTHS.itemName);
  else if (name.length > LIMITS.itemName)
    errors.itemName = `Item name must be ${LIMITS.itemName} characters or less.`;

  const desc = description.trim();
  if (!desc) errors.description = "Description is required.";
  else if (desc.length < MIN_LENGTHS.description) errors.description = minLengthMessage(MIN_LENGTHS.description);
  else if (desc.length > LIMITS.description)
    errors.description = `Description must be ${LIMITS.description} characters or less.`;

  if (contents.trim().length > LIMITS.contents)
    errors.contents = `Contents must be ${LIMITS.contents} characters or less.`;

  return { valid: Object.keys(errors).length === 0, errors };
}

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

export default function Report() {
  const navigate = useNavigate();
  const { id, reportId, mode } = useParams();
  const viewOnly = mode === "view";
  const userID = localStorage.getItem("user_id");
  const { setDirty, setBlocking } = useUnsavedChangesGuard();

  const [recentReportId, setRecentReportId] = useState();
  const [categories, setCategories] = useState([]);
  const [offices, setOffices] = useState([]);
  const [sharedSpaces, setSharedSpaces] = useState([]);
  const [gates, setGates] = useState([]);

  const [image, setImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [categoryID, setCategoryID] = useState("");
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [contents, setContents] = useState("");
  const [errors, setErrors] = useState({});

  // The native app pre-fills the date and time with "now" for a new report
  const [dateLost, setDateLost] = useState(() => (id || mode === "view" ? "" : todayLocalISO()));
  const [timeLost, setTimeLost] = useState(() => {
    if (id || mode === "view") return "";
    const now = new Date();
    return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  });
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [rawLocations, setRawLocations] = useState([]);
  const [cantRemember, setCantRemember] = useState(false);
  const [specificLocation, setSpecificLocation] = useState("");
  const [openLocations, setOpenLocations] = useState(false);
  const [openSub, setOpenSub] = useState(null);
  const [alertInfo, setAlertInfo] = useState(null);

  const [createdReportID, setCreatedReportID] = useState(null);
  const [nextPage, setNextPage] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showWebcamCapture, setShowWebcamCapture] = useState(false);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isCancel, setIsCancel] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scannedFile, setScannedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const blobUrlRef = useRef(null);
  const [originalReport, setOriginalReport] = useState(null);

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
        title: "Shared Student Spaces",
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



  const navBack = () => {
    if (mode === "view" && reportId) navigate(`/notifications/${reportId}/verify`);
    else navigate(`/profile/report-history/${userID}`);
  };


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

      if (String(data.user_id) !== String(userID)) {
        showToast("Item is not yours");

        navigate(`/home`);

        return;
      }

      // Cancelled / resolved reports are read-only (the report history hides
      // Edit for them); block the direct /report/:id URL too.
      if (!viewOnly && NON_EDITABLE_STATUSES.includes(String(data.status ?? "").toLowerCase())) {
        showToast("This report can no longer be edited.");
        navigate(`/profile/report-history/${userID}`);
        return;
      }

      setItemName(data.item_name || "");
      setDescription(data.description || "");
      setContents(data.contents || "");
      setCategoryID(String(data.category_id || ""));
      setSpecificLocation(data.specific_location || "");

      if (data.image_url) setImage(data.image_url);

      let originalDateLost = "";
      let originalTimeLost = "";
      if (data.lost_date) {
        const [datePart, timePart] = data.lost_date.split(/[T ]/);
        originalDateLost = datePart || "";
        originalTimeLost = timePart?.slice(0, 5) || "";
        setDateLost(originalDateLost);
        setTimeLost(originalTimeLost);
      }

      let originalCantRemember = false;
      let originalLocations = [];
      if (data.location_lost) {
        const parsed = parseLocationLost(data.location_lost);

        if (parsed.some(isCantRemember)) {
          originalCantRemember = true;
          setCantRemember(true);
        } else {
          originalLocations = parsed;
          setRawLocations(parsed);
        }
      }

      setOriginalReport({
        itemName: data.item_name || "",
        description: data.description || "",
        contents: data.contents || "",
        categoryID: String(data.category_id || ""),
        specificLocation: data.specific_location || "",
        dateLost: originalDateLost,
        timeLost: originalTimeLost,
        cantRemember: originalCantRemember,
        locations: [...originalLocations].sort(),
      });

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

    // lower-cased name -> the list's own spelling, so ticks match whatever
    // casing the report was saved with
    const known = new Map(
      locationGroups
        .flatMap((g) => g.items.map((i) => i.name?.trim()))
        .filter(Boolean)
        .map((name) => [name.toLowerCase(), name])
    );
    if (known.size === 0) return;

    setSelectedLocations(
      [...new Set(rawLocations.map((loc) => known.get(loc.trim().toLowerCase())).filter(Boolean))]
    );
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

  const setPhoto = (file) => {
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    const url = URL.createObjectURL(file);
    blobUrlRef.current = url;
    setImage(url);
    setSelectedFile(file);
  };

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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const error = new Error(data.message || "AI analysis failed");
        error.status = res.status;
        throw error;
      }

      setItemName(sanitizeInput(data.itemName, LIMITS.itemName));
      setDescription(sanitizeInput(data.detailedDescription, LIMITS.description));
      setContents(sanitizeInput(data.contents, LIMITS.contents));
      setErrors({});

      const matched = matchCategoryFromAi(data.category, categories);
      if (matched) setCategoryID(String(matched.category_id));

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

    setPhoto(file);
  };


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
      setAlertInfo({ message: "Please fix the highlighted fields before continuing.", label: "Got It" });
      return;
    }

    setErrors({});
    setNextPage(true);
  };

  const handleDateChange = (value) => {
    setDateLost(value);
  };

  const toggleLocation = (name) =>
    setSelectedLocations((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );

  const toggleCantRemember = () => {
    setCantRemember((prev) => !prev);
    setSelectedLocations([]); // "Can't remember" replaces any other choice
    setOpenSub(null);
  };

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

    if (!timeValid) {
      setAlertInfo({ message: "Date and time cannot be in the future.", label: "Got It" });
      return
    }

    if (selectedLocations.length <= 0 && !cantRemember) {
      setAlertInfo({ message: "Open Select Location and pick at least one place, or choose Can't Remember.", label: "Got It" });
      return
    }
    if (isUpdate) setIsUpdating(true);
    else setIsSubmitting(true);

    try {
      const res = await fetchWithAuth(
        isUpdate ? `${API_URL}/api/lost-reports/${createdReportID}` : `${API_URL}/api/lost-reports`,
        { method: isUpdate ? "PUT" : "POST", body: buildFormData() }
      );
      const data = await res.json().catch(() => ({}));

      // Check the response before reading data.report: error bodies have none
      if (!res.ok) throw new Error(data.error || data.message || "Something went wrong");

      setRecentReportId(data.report?.lost_report_id ?? (isUpdate ? createdReportID : undefined));

      if (!isUpdate) setCreatedReportID(data.report?.lost_report_id ?? null);
      setSubmitted(true);
      if (isUpdate){
         showToastLight("Report edited successfully.")
      }
      else{
        showToastLight("Report submitted successfully.")
      }
    } catch (err) {
      console.error(err);
      showToastLight(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
      setIsUpdating(false);
    }
  };

  const handleDiscard = ({ silent } = {}) => {
    if (reportId) {
      navigate(`/notifications/${reportId}/verify`);
    } else if (id) {
      navigate(`/profile/report-history/${userID}`);
    } else {
      setIsCancel(false);
      setNextPage(true);
      setSubmitted(true);
    }
    if (!silent) showToast("Edit has been cancelled.");
  };

  const hasChangedFromOriginal = () => {
    const original = originalReport;
    if (!original) return false;

    if (selectedFile) return true; // new photo chosen or existing one removed

    return (
      itemName.trim() !== original.itemName.trim() ||
      description.trim() !== original.description.trim() ||
      contents.trim() !== original.contents.trim() ||
      categoryID !== original.categoryID ||
      specificLocation.trim() !== original.specificLocation.trim() ||
      dateLost !== original.dateLost ||
      timeLost !== original.timeLost ||
      cantRemember !== original.cantRemember ||
      JSON.stringify([...selectedLocations].sort()) !== JSON.stringify(original.locations)
    );
  };

  const hasUnsavedChanges =
    !viewOnly &&
    !submitted &&
    (
      isAnalyzing ||
      (
        isEdit
          ? hasChangedFromOriginal()
          : (
            !!image ||
            !!categoryID ||
            !!itemName.trim() ||
            !!description.trim() ||
            !!contents.trim() ||
            selectedLocations.length > 0 ||
            cantRemember ||
            !!specificLocation.trim()
          )
      )
    );

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!hasUnsavedChanges) return;

      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  useEffect(() => {
    setDirty(hasUnsavedChanges);
  }, [hasUnsavedChanges, setDirty, isAnalyzing]);

  useEffect(() => () => setDirty(false), [setDirty]);

  useEffect(() => {
    setBlocking(isAnalyzing);
  }, [isAnalyzing, setBlocking]);

  useEffect(() => () => setBlocking(false), [setBlocking]);



  const isFormComplete1 = !!categoryID && !!itemName.trim() && !!description.trim();
  const isNextDisabled = !isEdit && !viewOnly ? !isFormComplete1 || isAnalyzing : false;

  const dateDisplay = dateValid || dateLost ? (parseLocal(dateLost)?.toLocaleDateString() ?? "") : "";
  const timeDisplay = timeLost
    ? (parseLocal(dateLost || todayLocalISO(), timeLost)?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) ?? "")
    : "";

  const onTitleBack = () => {
    if (viewOnly) navBack();
    else if (hasUnsavedChanges) setIsCancel(true);
    else handleDiscard({ silent: true }); // nothing was edited, so nothing to announce
  };

  const confirmMessage = isEdit
    ? "Are you sure you want to save these changes?"
    : "Are you sure all report details are correct and ready to be submitted?";

  const outlineBtn = "rounded-[10px] border-[1.5px] border-primary px-[30px] py-2.5 text-primary text-[14px] active:opacity-70 disabled:opacity-50";
  const solidBtn = "rounded-[10px] bg-primary px-[30px] py-2.5 text-white text-[14px] active:opacity-80 disabled:bg-[#A0A0A0]";

  const pickerRow = (value, iconName, inputProps) => (
    <div className="px-5">
      <div className="relative mb-2.5 p-3.5 bg-white border border-[#E0E0E0] rounded-md flex items-center justify-between">
        <span className="text-[15px] text-[#333]">{value}</span>
        <Icon family="material" name={iconName} size={24} color="#8B0000" />
        {!viewOnly && (
          <input
            {...inputProps}
            onClick={(e) => e.currentTarget.showPicker?.()}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        )}
      </div>
    </div>
  );

  const nestedHeader = (title, isOpen, onPress, disabled) => (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      className={`w-full flex items-center justify-between py-3.5 px-4 border-t border-[#EEEEEE] bg-white ${disabled ? "opacity-50" : ""}`}
    >
      <span className={`text-[15px] font-semibold ${disabled ? "text-[#888888]" : "text-[#212121]"}`}>{title}</span>
      <Icon family="material" name={isOpen ? "keyboard-arrow-down" : "keyboard-arrow-right"} size={22} color="#900014" />
    </button>
  );

  const successBullet = (children) => (
    <div className="flex mb-2.5 gap-2">
      <span className="text-[14px] text-[#1a1a1a] mt-px">•</span>
      <span className="flex-1 text-[14px] text-[#1a1a1a] leading-5 text-left">{children}</span>
    </div>
  );

  // ----------------------------- success screen -----------------------------
  if (submitted && nextPage) {
    return (
      <div className="bg-primary min-h-[calc(100vh-70px)] lg:min-h-screen px-6 flex flex-col justify-center">
        <div className="flex items-center mb-6 gap-4 lg:w-full lg:max-w-[720px] lg:mx-auto">
          <img src={happyHeart} alt="" className="w-[110px] h-[110px] shrink-0 object-contain" />
          <div className="flex-1 min-w-0">
            <p className="text-[22px] font-extrabold text-white mb-2">{isEdit ? "Report Updated!" : "Report Successful!"}</p>
            <p className="text-[13px] text-white/85 leading-5">
              {isEdit
                ? "Your lost item report has been updated. We'll continue searching and notify you if we find a potential match."
                : "We've secured your lost report and immediately started searching for a match. Rest assured, we'll notify you if we find it."}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 lg:w-full lg:max-w-[720px] lg:mx-auto">
          <p className="text-[16px] font-extrabold text-[#1a1a1a] mb-3.5">What happens next?</p>

          {successBullet(`Your ${isEdit ? "updated" : "detailed"} description has been ${isEdit ? "saved to" : "added to"} our records.`)}
          {successBullet("Our system is now automatically searching and comparing your report against all old and newly found items.")}
          {successBullet("We will notify you immediately via email or in-app notifications if a potential match is reported by a finder.")}

          <div className="h-px bg-black/[0.08] mt-2" />

          <div className={`flex items-center mt-4 px-1 ${isEdit ? "justify-between" : "justify-center py-1"}`}>
            {isEdit && (
              <button
                type="button"
                className="flex items-center active:opacity-40"
                onClick={() => {
                  // Already on /report/:id for this report, so navigating there is a no-op and
                  // would leave the success screen up. Reset to page 1 and re-sync originalReport
                  // so the form isn't instantly considered dirty.
                  setSubmitted(false);
                  setNextPage(false);
                  fetchLostReport(recentReportId);
                }}
              >
                <Icon family="mci" name="pencil-outline" size={14} color="#8B0000" />
                <span className="text-[13px] font-semibold text-primary whitespace-pre">  Edit Report</span>
              </button>
            )}

            <button
              type="button"
              className="active:opacity-40"
              onClick={() => navigate(`/profile/report-history/${userID}`)}
            >
              <span className="text-[13px] font-semibold text-primary whitespace-pre">
                {isEdit ? "Report History  →" : "View Report History  →"}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="narrow-body bg-[#FFF1E0] min-h-[calc(100vh-70px)] lg:min-h-screen pb-10 flex flex-col">
        <AppHeader
          redDesktop
          title="Report"
          desktopTitle={id || mode ? (viewOnly ? "Report Details" : "Edit Lost Item Report") : "Lost Item Report Form"}
          onBack={id || mode ? onTitleBack : undefined}
        />

        {id || mode ? (
          <FormTitleRow onBack={onTitleBack}>{viewOnly ? "Report Details" : "Edit Lost Item Report"}</FormTitleRow>
        ) : (
          <FormTitle>Lost Item Report Form</FormTitle>
        )}

        {isLoadingReport && !originalReport && (
          <div className="flex justify-center py-20">
            <div className="w-9 h-9 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* ---------------------------- PAGE 1 ---------------------------- */}
        {!nextPage && !(isLoadingReport && !originalReport) && (
          <>
            <SubTitle>Item Description</SubTitle>

            <UploadCard
              image={image}
              isLoading={isAnalyzing}
              viewOnly={viewOnly}
              canScan={!!(selectedFile instanceof File) && !isAnalyzing && selectedFile !== scannedFile}
              onScan={() => analyzeImage(selectedFile)}
              onOpenPicker={() => setShowImageOptions(true)}
            />

            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
            <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            {viewOnly && (
              <>
                <SectionTitle>Report ID</SectionTitle>
                <div className="px-5">
                  <p className="bg-white rounded-lg px-3 h-[50px] leading-[50px] text-[16px] border border-black/[0.08]">
                    {`RPT-${String(id).padStart(5, "0")}`}
                  </p>
                </div>
              </>
            )}

            <SectionTitle required={!viewOnly}>Category</SectionTitle>
            <Dropdown
              value={categoryID}
              options={categories.map((c) => ({ value: String(c.category_id), label: c.category_name }))}
              placeholder={
                categories.length === 0 ? "Loading categories..." : isEdit || viewOnly ? "Select a category..." : "Select Category"
              }
              disabled={viewOnly || categories.length === 0 || isAnalyzing}
              viewOnly={viewOnly}
              error={!!errors.category}
              onChange={(val) => {
                setCategoryID(val);
                clearError("category");
              }}
            />
            <FieldError message={errors.category} />

            <SectionTitle required={!viewOnly}>Item Name</SectionTitle>
            <TextBox
              type="text"
              value={itemName}
              maxLength={LIMITS.itemName}
              disabled={viewOnly || isAnalyzing}
              viewOnly={viewOnly}
              placeholder="e.g., iPhone 13 Pro Max, Bag, Umbrella"
              error={!!errors.itemName}
              onChange={(e) => {
                setItemName(sanitizeInput(e.target.value, LIMITS.itemName));
                clearError("itemName");
              }}
            />
            <FieldError message={errors.itemName} />

            <SectionTitle required={!viewOnly}>Detailed Description</SectionTitle>
            <TextBox
              multiline
              value={description}
              maxLength={LIMITS.description}
              disabled={viewOnly || isAnalyzing}
              viewOnly={viewOnly}
              placeholder="Brand, Model, Size, Color, Material, etc."
              error={!!errors.description}
              onChange={(e) => {
                setDescription(sanitizeInput(e.target.value, LIMITS.description));
                clearError("description");
              }}
            />
            <FieldError message={errors.description} />

            <SectionTitle>Contents (if applicable)</SectionTitle>
            <TextBox
              type="text"
              value={viewOnly ? contents || "—" : contents}
              maxLength={LIMITS.contents}
              disabled={viewOnly || isAnalyzing}
              viewOnly={viewOnly}
              placeholder="e.g., wallet contents, keys, notes..."
              error={!!errors.contents}
              onChange={(e) => {
                setContents(sanitizeInput(e.target.value, LIMITS.contents));
                clearError("contents");
              }}
            />
            <FieldError message={errors.contents} />

            <NextSection label="Page 1 out of 2">
              {viewOnly ? null : isEdit ? (
                <button type="button" className={outlineBtn} disabled={isAnalyzing} onClick={onTitleBack}>
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => setShowClearConfirm(true)}
                  className="rounded-[10px] border border-[#C62828] py-2.5 px-5 text-[#C62828] text-[14px] font-semibold active:opacity-70 disabled:opacity-50"
                >
                  Clear All
                </button>
              )}
              <button type="button" className={solidBtn} disabled={isNextDisabled} onClick={handleNext}>
                Next
              </button>
            </NextSection>
          </>
        )}

        {/* ---------------------------- PAGE 2 ---------------------------- */}
        {nextPage && !submitted && (
          <>
            <SubTitle>When & Where</SubTitle>

            <SectionTitle required={!viewOnly}>Date Lost</SectionTitle>
            {pickerRow(dateDisplay, "calendar-month", {
              type: "date",
              value: dateLost,
              max: todayLocalISO(),
              onChange: (e) => handleDateChange(e.target.value),
              "aria-label": "Date lost",
            })}

            <SectionTitle required={!viewOnly}>Time Lost</SectionTitle>
            {pickerRow(timeDisplay, "access-time", {
              type: "time",
              value: timeLost,
              disabled: !dateValid,
              onChange: (e) => setTimeLost(e.target.value),
              "aria-label": "Time lost",
            })}
            <FieldError
              message={
                dateLost && !dateValid
                  ? "Date and time cannot be in the future."
                  : dateValid && timeLost && !timeValid
                    ? "Date and time cannot be in the future."
                    : null
              }
            />

            <SectionTitle required={!viewOnly}>Select Location</SectionTitle>
            <div className="mx-5">
              <button
                type="button"
                disabled={viewOnly}
                onClick={() => setOpenLocations((prev) => !prev)}
                className={`w-full flex items-center justify-between p-3.5 bg-white border border-[#E0E0E0] rounded-md ${viewOnly ? "" : "disabled:bg-[#E2D7CC]"} ${
                  openLocations ? "rounded-b-none border-b-0" : ""
                }`}
              >
                <span className="text-[15px] font-semibold text-[#A2938A]">Select Location</span>
                <span className={`flex transition-transform duration-300 ${openLocations ? "rotate-180" : ""}`}>
                  <Icon family="material" name="keyboard-arrow-down" size={24} color={openLocations ? "#900014" : "#8B0000"} />
                </span>
              </button>

              {openLocations && (
                <div className="bg-white border-x border-b border-[#E0E0E0] rounded-b-md">
                  {locationGroups.map((group) => (
                    <div key={group.id}>
                      {nestedHeader(
                        group.id === "shared" ? "Shared Student Spaces" : group.title,
                        openSub === group.id,
                        () => setOpenSub((prev) => (prev === group.id ? null : group.id)),
                        cantRemember
                      )}
                      {openSub === group.id && (
                        <div className="bg-[#F9F9F9] py-1.5 border-t border-[#EEEEEE]">
                          {group.items.map((item) => {
                            const checked = selectedLocations.includes(item.name);
                            return (
                              <button
                                key={item.key}
                                type="button"
                                disabled={viewOnly}
                                onClick={() => toggleLocation(item.name)}
                                className="w-full flex items-center py-2.5 px-6 text-left active:opacity-70"
                              >
                                <Icon
                                  family="material"
                                  name={checked ? "check-box" : "check-box-outline-blank"}
                                  size={22}
                                  color={checked ? "#8B0000" : "#757575"}
                                />
                                <span className="ml-3 text-[15px] text-[#212121]">{item.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    disabled={viewOnly}
                    onClick={toggleCantRemember}
                    className="w-full flex items-center justify-between py-3.5 px-4 border-t border-[#EEEEEE] bg-white rounded-b-md"
                  >
                    <span className="text-[15px] font-semibold text-[#212121]">Can't Remember</span>
                    <Icon
                      family="material"
                      name={cantRemember ? "radio-button-checked" : "radio-button-unchecked"}
                      size={22}
                      color="#900014"
                    />
                  </button>
                </div>
              )}
            </div>

            <p className="text-[13px] text-[#1a1a1a] mx-5 mt-1">
              {cantRemember
                ? "Selected: Can't Remember"
                : selectedLocations.length > 0
                  ? `Selected: ${selectedLocations.join(", ")}`
                  : "No location selected yet."}
            </p>

            <SectionTitle>Specific Location (Optional)</SectionTitle>
            <div className="px-5">
              <input
                type="text"
                value={specificLocation}
                maxLength={LIMITS.specificLocation}
                disabled={viewOnly}
                placeholder="e.g., 2nd floor hallway, near the vending machine"
                onChange={(e) => setSpecificLocation(sanitizeInput(e.target.value, LIMITS.specificLocation))}
                className={`block w-full mb-2.5 px-3.5 h-[50px] text-[15px] text-[#333] bg-white border border-[#E0E0E0] rounded-md outline-none placeholder:text-[#8C7A70] ${viewOnly ? "" : "disabled:bg-[#E2D7CC]"}`}
              />
            </div>

            {!viewOnly && (
              <div className="bg-[#E3D5CA] rounded-lg p-4 mx-5 mt-7 mb-3">
                <div className="flex items-center mb-2.5">
                  <span className="mr-2 flex">
                    <Icon family="feather" name="info" size={20} color="#000000" />
                  </span>
                  <p className="text-[16px] font-bold text-black">What happens next?</p>
                </div>
                <p className="text-[14px] text-primary leading-5 pl-[29px]">
                  We’ll check for matching found items and notify you if we find a potential match. You’ll receive updates via the notification bell.
                </p>
              </div>
            )}

            <NextSection label="Page 2 out of 2" tight>
              <button
                type="button"
                disabled={isSubmitting || isUpdating}
                onClick={() => setNextPage(false)}
                className="rounded-[14px] border-[1.5px] border-[#900014] bg-transparent py-3 px-7 text-[#900014] text-[15px] font-medium active:opacity-70 disabled:opacity-70 disabled:border-[#A0A0A0] disabled:text-[#A0A0A0]"
              >
                {isEdit || viewOnly ? "Back to Page 1" : "Back"}
              </button>
              {!viewOnly && (
                <button
                  type="button"
                  disabled={
                    isSubmitting ||
                    isUpdating ||
                    (isEdit ? !timeValid || !hasUnsavedChanges : !timeValid || totalLocations === 0)
                  }
                  onClick={() => setShowSubmitConfirmation(true)}
                  className="rounded-[14px] bg-[#900014] py-3 px-[26px] min-w-[100px] flex items-center justify-center text-white text-[15px] font-medium active:opacity-80 disabled:bg-[#A0A0A0] disabled:opacity-70"
                >
                  {isSubmitting || isUpdating ? (
                    <span className="inline-block w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : isEdit ? (
                    "Confirm"
                  ) : (
                    "Submit"
                  )}
                </button>
              )}
            </NextSection>
          </>
        )}
      </div>

      {/* ------------------------ overlays & dialogs ------------------------ */}
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
          message={confirmMessage}
          b1Label={isEdit ? "Cancel" : "Review"}
          b2Label={isEdit ? "Save" : "Submit"}
          b1OnClick={() => setShowSubmitConfirmation(false)}
          b2OnClick={() => saveReport(isEdit)}
        />
      )}

      {alertInfo && (
        <AlertDialog message={alertInfo.message} b1Label={alertInfo.label || "Got It"} b1OnClick={() => setAlertInfo(null)} />
      )}

      {showImageOptions && (
        <PhotoSheet
          hasPhoto={hasPhoto}
          onClose={() => setShowImageOptions(false)}
          onTake={() => {
            setShowImageOptions(false);
            if (isMobileDevice()) {
              cameraInputRef.current?.click();
            } else {
              setShowWebcamCapture(true);
            }
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

      {showWebcamCapture && (
        <WebcamCaptureModal
          onClose={() => setShowWebcamCapture(false)}
          onCapture={(file) => {
            setShowWebcamCapture(false);
            setPhoto(file);
          }}
        />
      )}
    </>
  );
}
