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
import UploadCard from "../components/report_components/UploadCard";
import LocationGroup from "../components/report_components/LocationGroup";
import PhotoSheet from "../components/report_components/PhotoSheet";
import Field from "../components/report_components/Field";
import ActionButton from "../components/report_components/ActionButton";

const API_URL = import.meta.env.VITE_API_URL;

const LIMITS = {
  itemName: 50,
  description: 500,
  contents: 100,
  specificLocation: 100,
};
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

const showToast = (message) => toast.custom(() => <Toast icon={InfoIcon} message={message} />);

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

const fieldClass = (hasError, extra = "") =>
  `w-full rounded-lg border px-3 text-base text-[#333] bg-white outline-none placeholder:text-[#8C7A70] focus:border-primary disabled:bg-white disabled:opacity-80 ${hasError ? "border-[#C62828]" : "border-[#DDD9CF]"
  } ${extra}`;


function SectionHeading({ children }) {
  return (
    <h2 className="text-[17px] font-black text-black border-b border-black px-2.5 pt-5 pb-4 mb-5">
      {children}
    </h2>
  );
}


export default function Report() {
  const navigate = useNavigate();
  const { id, reportId, mode } = useParams();
  const viewOnly = mode === "view";
  const userID = localStorage.getItem("user_id");

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
  const [useAiDescribe, setUseAiDescribe] = useState(false);

  const [dateLost, setDateLost] = useState("");
  const [timeLost, setTimeLost] = useState("");
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [rawLocations, setRawLocations] = useState([]);
  const [cantRemember, setCantRemember] = useState(false);
  const [specificLocation, setSpecificLocation] = useState("");
  const [openLocations, setOpenLocations] = useState(false);
  const [openGroups, setOpenGroups] = useState({ college: false, shared: false, gates: false });

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



      setItemName(data.item_name || "");
      setDescription(data.description || "");
      setContents(data.contents || "");
      setCategoryID(String(data.category_id || ""));
      setSpecificLocation(data.specific_location || "");

      if (data.image_url) setImage(data.image_url);

      if (data.lost_date) {
        const [datePart, timePart] = data.lost_date.split(/[T ]/);
        setDateLost(datePart || "");
        setTimeLost(timePart?.slice(0, 5) || "");
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI analysis failed");

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
      showToast("Please fix the highlighted fields before continuing.");
      return;
    }

    setErrors({});
    setNextPage(true);
  };

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
        className={`${submitted
          ? "bg-(--color-primary) flex flex-col items-center justify-center"
          : "bg-(--color-secondary)"
          } min-h-screen px-4`}
      >
        {!nextPage && (
          <div className="pb-24">
            <SectionHeading>Item Description</SectionHeading>

            <UploadCard
              image={image}
              isLoading={isAnalyzing}
              viewOnly={viewOnly}
              canScan={selectedFile instanceof File && !isAnalyzing}
              onScan={() => analyzeImage(selectedFile)}
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
                  disabled={viewOnly || categories.length === 0 || isAnalyzing}
                  onChange={(e) => {
                    setCategoryID(e.target.value);
                    clearError("category");
                  }}
                  className={fieldClass(
                    !!errors.category,
                    `h-[50px] appearance-none pr-10 ${categoryID ? "" : "text-[#8C7A70]"}
                    disabled:opacity-60`
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
                disabled={viewOnly || isAnalyzing}
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
                disabled={viewOnly || isAnalyzing}
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
                disabled={viewOnly || isAnalyzing}
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
                    className={`cursor-pointer flex items-center gap-2 text-xs p-2 rounded-md font-medium w-full ${cantRemember ? "bg-[#e5d4b8] text-primary" : "bg-[#F2F2F2]"
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