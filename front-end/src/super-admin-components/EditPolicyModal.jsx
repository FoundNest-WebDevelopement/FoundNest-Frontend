import { useState, useMemo } from "react";
import { Settings, Plus, Trash2, TriangleAlert } from "lucide-react";
import ConfirmDialog from "../global-components/ConfirmDialog";

const inputClass = (hasError) =>
    `border rounded-md px-3 py-2 text-sm outline-none ${
        hasError
            ? "border-[#C0392B] focus:border-[#C0392B]"
            : "border-[#DDD9CF] focus:border-primary"
    }`;

function FieldError({ id, message }) {
    if (!message) return null;
    return (
        <p id={id} className="text-xs text-[#C0392B] flex items-center gap-1">
            <TriangleAlert size={12} className="shrink-0" /> {message}
        </p>
    );
}

const formatDateTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? ""
        : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

export default function EditPolicyModal({ policy, onClose, onSave }) {
    const valueType = policy?.valueType || "text";

    // Read-only audit info (accepts camelCase or the API's snake_case)
    const createdByName = policy?.createdByName ?? policy?.created_by_name ?? "";
    const updatedByName = policy?.updatedByName ?? policy?.updated_by_name ?? "";
    const updatedAt = formatDateTime(policy?.updatedAt ?? policy?.updated_at);
    const isNumeric = valueType === "number" || valueType === "days";
    const isSteps = valueType === "steps";
    const initialSteps =
        isSteps && Array.isArray(policy?.value) ? policy.value : [];

    const [title, setTitle] = useState(policy?.title || "");
    const [description, setDescription] = useState(policy?.description || "");
    const [value, setValue] = useState(isSteps ? "" : policy?.value ?? "");
    const [steps, setSteps] = useState(initialSteps);
    const [isSaving, setIsSaving] = useState(false);

    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [openCancelConfirmDialog, setOpenCancelConfirmDialog] = useState(false);

    // Validation display state.
    // A field's error shows once the user has interacted with it (or after a
    // save attempt), then updates on every keystroke and disappears as soon
    // as the input is valid.
    const [touched, setTouched] = useState({ title: false, value: false, steps: false });
    const [stepTouched, setStepTouched] = useState(() => initialSteps.map(() => false));
    const [submitted, setSubmitted] = useState(false);
    const [saveError, setSaveError] = useState(""); // server / network error only

    const touch = (field) =>
        setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));

    // ---- live validation (derived from current input, never stale) ----
    const errors = useMemo(() => {
        const result = { title: "", value: "", steps: "", stepTitles: [] };

        if (!title.trim()) {
            result.title = "Policy name is required.";
        }

        if (isSteps) {
            if (steps.length === 0) {
                result.steps = "Add at least one step.";
            }
            result.stepTitles = steps.map((step) =>
                step.title.trim() ? "" : "Step is required"
            );
        } else {
            const trimmed = String(value).trim();
            if (trimmed === "") {
                result.value = "Current value is required.";
            } else if (
                isNumeric &&
                (Number.isNaN(Number(trimmed)) || Number(trimmed) < 0)
            ) {
                result.value = "Enter a number that is 0 or higher.";
            }
        }

        return result;
    }, [title, value, steps, isSteps, isNumeric]);

    const isValid =
        !errors.title &&
        !errors.value &&
        !errors.steps &&
        errors.stepTitles.every((e) => !e);

    const titleError = touched.title || submitted ? errors.title : "";
    const valueError = touched.value || submitted ? errors.value : "";
    const stepsError = touched.steps || submitted ? errors.steps : "";
    const stepTitleError = (index) =>
        stepTouched[index] || submitted ? errors.stepTitles[index] : "";

    // ---- change handlers ----
    const handleTitleChange = (e) => {
        setTitle(e.target.value);
        touch("title");
        setSaveError("");
    };

    const handleDescriptionChange = (e) => {
        setDescription(e.target.value);
        setSaveError("");
    };

    const handleValueChange = (e) => {
        setValue(e.target.value);
        touch("value");
        setSaveError("");
    };

    const updateStep = (index, field, newValue) => {
        setSteps((prev) =>
            prev.map((step, i) => (i === index ? { ...step, [field]: newValue } : step))
        );
        if (field === "title") {
            setStepTouched((prev) => prev.map((t, i) => (i === index ? true : t)));
        }
        setSaveError("");
    };

    const addStep = () => {
        setSteps((prev) => [...prev, { title: "", description: "" }]);
        setStepTouched((prev) => [...prev, false]); // don't flag a brand-new step
        setSaveError("");
    };

    const removeStep = (index) => {
        setSteps((prev) => prev.filter((_, i) => i !== index));
        setStepTouched((prev) => prev.filter((_, i) => i !== index));
        touch("steps");
        setSaveError("");
    };

    const hasChanges =
        title !== (policy?.title || "") ||
        description !== (policy?.description || "") ||
        (isSteps
            ? JSON.stringify(steps) !== JSON.stringify(policy?.value || [])
            : String(value) !== String(policy?.value ?? ""));

    const requestClose = () =>
        hasChanges ? setOpenCancelConfirmDialog(true) : onClose();

    // Validate BEFORE asking for confirmation, so the user never confirms
    // a save that is about to be rejected.
    const handleSaveClick = () => {
        setSubmitted(true);
        if (!isValid) return;
        setOpenConfirmDialog(true);
    };

    const handleSubmit = async () => {
        setOpenConfirmDialog(false);

        if (!isValid) {
            setSubmitted(true);
            return;
        }

        try {
            setIsSaving(true);
            setSaveError("");

            const finalValue = isSteps
                ? steps.map((step) => ({
                      title: step.title.trim(),
                      description: step.description.trim(),
                  }))
                : isNumeric
                ? Number(value)
                : String(value).trim();

            await onSave({
                ...policy,
                title: title.trim(),
                description: description.trim(),
                value: finalValue,
            });

            onClose();
        } catch (err) {
            console.error(err);
            setSaveError(err.message || "Failed to update policy.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
        <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-1040"
            onClick={requestClose}
        >
            <div
                className={`relative bg-white rounded-lg max-w-[90vw] ${isSteps ? "w-140" : "w-100"}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-full h-10 rounded-t-lg bg-primary text-white flex items-center justify-between px-5">
                    <p className="font-semibold">Edit Policy</p>
                    <button onClick={requestClose}>
                        <i className="fa-solid fa-x text-sm text-white" />
                    </button>
                </div>

                <div className="p-4 max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-center mb-4">
                        <Settings size={40} className="text-primary" />
                    </div>

                    {(createdByName || updatedByName || updatedAt) && (
                        <div className="mb-4 rounded-md border border-[#DDD9CF] px-3 py-2 flex flex-col gap-0.5 text-xs text-[#6B5C42]">
                            {createdByName && (
                                <p>
                                    Created by{" "}
                                    <span className="font-medium text-[#1A1208]">{createdByName}</span>
                                </p>
                            )}
                            {(updatedByName || updatedAt) && (
                                <p>
                                    Last updated
                                    {updatedByName && (
                                        <>
                                            {" "}by{" "}
                                            <span className="font-medium text-[#1A1208]">{updatedByName}</span>
                                        </>
                                    )}
                                    {updatedAt && <> on {updatedAt}</>}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-[#1A1208]">
                                Policy Name
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={handleTitleChange}
                                onBlur={() => touch("title")}
                                placeholder="e.g., Login Attempt Limit"
                                aria-invalid={!!titleError}
                                aria-describedby={titleError ? "policy-title-error" : undefined}
                                className={inputClass(!!titleError)}
                            />
                            <FieldError id="policy-title-error" message={titleError} />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-[#1A1208]">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={handleDescriptionChange}
                                placeholder="What does this policy control?"
                                rows={2}
                                className={`${inputClass(false)} resize-none`}
                            />
                        </div>

                        {isSteps ? (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-[#1A1208]">
                                        Steps
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addStep}
                                        className="flex items-center gap-1 text-xs text-primary font-medium"
                                    >
                                        <Plus size={14} />
                                        Add Step
                                    </button>
                                </div>

                                {steps.map((step, index) => {
                                    const stepError = stepTitleError(index);
                                    return (
                                        <div
                                            key={index}
                                            className={`border rounded-md p-3 flex flex-col gap-2 ${
                                                stepError ? "border-[#C0392B]" : "border-[#DDD9CF]"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold text-primary">
                                                    Step {index + 1}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeStep(index)}
                                                    className="text-[#C0392B]"
                                                    aria-label={`Remove step ${index + 1}`}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <input
                                                    type="text"
                                                    value={step.title}
                                                    onChange={(e) => updateStep(index, "title", e.target.value)}
                                                    onBlur={() =>
                                                        setStepTouched((prev) =>
                                                            prev.map((t, i) => (i === index ? true : t))
                                                        )
                                                    }
                                                    placeholder="Step title, e.g., Bring Proof"
                                                    aria-invalid={!!stepError}
                                                    aria-describedby={
                                                        stepError ? `step-title-error-${index}` : undefined
                                                    }
                                                    className={inputClass(!!stepError)}
                                                />
                                                <FieldError
                                                    id={`step-title-error-${index}`}
                                                    message={stepError}
                                                />
                                            </div>

                                            <textarea
                                                value={step.description}
                                                onChange={(e) => updateStep(index, "description", e.target.value)}
                                                placeholder="Step description"
                                                rows={2}
                                                className={`${inputClass(false)} resize-none`}
                                            />
                                        </div>
                                    );
                                })}

                                {steps.length === 0 &&
                                    (stepsError ? (
                                        <FieldError id="policy-steps-error" message={stepsError} />
                                    ) : (
                                        <p className="text-xs text-[#6B5C42] text-center py-4">
                                            No steps yet. Click "Add Step" to create one.
                                        </p>
                                    ))}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-[#1A1208]">
                                    Current Value
                                </label>

                                {isNumeric ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min={0}
                                            value={value}
                                            onChange={handleValueChange}
                                            onBlur={() => touch("value")}
                                            placeholder="e.g., 5"
                                            aria-invalid={!!valueError}
                                            aria-describedby={valueError ? "policy-value-error" : undefined}
                                            className={`${inputClass(!!valueError)} w-full`}
                                        />
                                        {policy?.unit && (
                                            <span className="text-sm text-[#6B5C42] shrink-0">
                                                {policy.unit}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <textarea
                                        value={value}
                                        onChange={handleValueChange}
                                        onBlur={() => touch("value")}
                                        placeholder="e.g., BulSU Email domain required (@ms.bulsu.edu.ph)"
                                        rows={2}
                                        aria-invalid={!!valueError}
                                        aria-describedby={valueError ? "policy-value-error" : undefined}
                                        className={`${inputClass(!!valueError)} resize-none`}
                                    />
                                )}

                                <FieldError id="policy-value-error" message={valueError} />
                            </div>
                        )}

                        {/* Shown after a save attempt; disappears as soon as everything is valid */}
                        {submitted && !isValid && (
                            <FieldError message="Please fix the highlighted fields before saving." />
                        )}

                        {/* Server / network failure, cleared as soon as the user edits anything */}
                        {saveError && <FieldError message={saveError} />}
                    </div>

                    <hr className="border-(--color-tertiary) my-4 opacity-30" />

                    <div className="flex gap-2">
                        <button
                            type="button"
                            className="flex-1 h-10 bg-white border border-primary rounded-lg text-primary text-sm font-medium
                                transition-transform duration-100 active:scale-95"
                            onClick={requestClose}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="flex-1 h-10 bg-primary rounded-lg text-white text-sm font-medium
                                transition-transform duration-100 enabled:active:scale-95
                                disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={isSaving || !hasChanges}
                            onClick={handleSaveClick}
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {openConfirmDialog && (
            <ConfirmDialog
                title="Save Changes?"
                cancelText="Cancel"
                confirmText="Save"
                description={"Do you want to save changes for this policy?"}
                onClose={() => setOpenConfirmDialog(false)}
                onConfirm={handleSubmit}
            />
        )}

        {openCancelConfirmDialog && (
            <ConfirmDialog
                description={"Do you want to discard progress in this edit policy form?"}
                onClose={() => setOpenCancelConfirmDialog(false)}
                onConfirm={onClose}
            />
        )}
        </>
    );
}