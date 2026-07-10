import { useState } from "react";
import { Settings, Plus, Trash2 } from "lucide-react";
import ConfirmDialog from "../global-components/ConfirmDialog";

export default function EditPolicyModal({ policy, onClose, onSave }) {
    const [title, setTitle] = useState(policy?.title || "");
    const [description, setDescription] = useState(policy?.description || "");
    const [value, setValue] = useState(
        policy?.valueType === "steps" ? "" : policy?.value ?? ""
    );
    const [steps, setSteps] = useState(
        policy?.valueType === "steps" ? policy.value : []
    );
    const [isSaving, setIsSaving] = useState(false);

    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [openCancelConfirmDialog, setOpenCancelConfirmDialog] = useState(false);
    const [error, setError] = useState("");

    const valueType = policy?.valueType || "text";
    const isNumeric = valueType === "number" || valueType === "days";
    const isSteps = valueType === "steps";

    const updateStep = (index, field, newValue) => {
        setSteps((prev) =>
            prev.map((step, i) => (i === index ? { ...step, [field]: newValue } : step))
        );
    };

    const addStep = () => {
        setSteps((prev) => [...prev, { title: "", description: "" }]);
    };

    const removeStep = (index) => {
        setSteps((prev) => prev.filter((_, i) => i !== index));
    };

    const hasChanges =
    title !== (policy?.title || "") ||
    description !== (policy?.description || "") ||
    (isSteps
        ? JSON.stringify(steps) !== JSON.stringify(policy?.value || [])
        : String(value) !== String(policy?.value ?? ""));

    const handleSubmit = async () => {

        setOpenConfirmDialog(false);
        if (!title.trim()) {
            setError("Policy name is required.");
            return;
        }

        if (isSteps) {
            if (steps.length === 0) {
                setError("Add at least one step.");
                return;
            }

            const hasEmptyStep = steps.some((step) => !step.title.trim());
            if (hasEmptyStep) {
                setError("Every step needs a title.");
                return;
            }
        } else {
            const trimmedValue = typeof value === "string" ? value.trim() : value;

            if (trimmedValue === "" || trimmedValue === null) {
                setError("Current value is required.");
                return;
            }

            if (isNumeric && (isNaN(Number(trimmedValue)) || Number(trimmedValue) < 0)) {
                setError("Current value must be a valid positive number.");
                return;
            }
        }

        try {
            setIsSaving(true);
            setError("");

            const finalValue = isSteps
                ? steps.map((step) => ({
                      title: step.title.trim(),
                      description: step.description.trim(),
                  }))
                : isNumeric
                ? Number(value)
                : value.trim();

            await onSave({
                ...policy,
                title: title.trim(),
                description: description.trim(),
                value: finalValue,
            });

            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to update policy.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-1040">
            <div className={`relative bg-white rounded-lg max-w-[90vw] ${isSteps ? "w-140" : "w-100"}`}>
                <div className="w-full h-10 rounded-t-lg bg-primary text-white flex items-center justify-between px-5">
                    <p className="font-semibold">Edit Policy</p>
                    <button onClick={()=>{
                                 if (hasChanges) {
                                setOpenCancelConfirmDialog(true);
                            } else {
                                onClose(); 
                            }
                                                    }}
                    >
                        <i className="fa-solid fa-x text-sm text-white" />
                    </button>
                </div>

                <div className="p-4 max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-center mb-4">
                        <Settings size={40} className="text-primary" />
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-[#1A1208]">
                                Policy Name
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Login Attempt Limit"
                                className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none
                                    focus:border-primary"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-[#1A1208]">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What does this policy control?"
                                rows={2}
                                className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none resize-none
                                    focus:border-primary"
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

                                {steps.map((step, index) => (
                                    <div
                                        key={index}
                                        className="border border-[#DDD9CF] rounded-md p-3 flex flex-col gap-2"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-primary">
                                                Step {index + 1}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeStep(index)}
                                                className="text-[#C0392B]"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                        <input
                                            type="text"
                                            value={step.title}
                                            onChange={(e) => updateStep(index, "title", e.target.value)}
                                            placeholder="Step title, e.g., Bring Proof"
                                            className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none
                                                focus:border-primary"
                                        />

                                        <textarea
                                            value={step.description}
                                            onChange={(e) => updateStep(index, "description", e.target.value)}
                                            placeholder="Step description"
                                            rows={2}
                                            className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none resize-none
                                                focus:border-primary"
                                        />
                                    </div>
                                ))}

                                {steps.length === 0 && (
                                    <p className="text-xs text-[#6B5C42] text-center py-4">
                                        No steps yet. Click "Add Step" to create one.
                                    </p>
                                )}
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
                                            onChange={(e) => setValue(e.target.value)}
                                            placeholder="e.g., 5"
                                            className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none w-full
                                                focus:border-primary"
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
                                        onChange={(e) => setValue(e.target.value)}
                                        placeholder="e.g., BulSU Email domain required (@ms.bulsu.edu.ph)"
                                        rows={2}
                                        className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none resize-none
                                            focus:border-primary"
                                    />
                                )}
                            </div>
                        )}

                        {error && (
                            <p className="text-xs text-[#C0392B]">{error}</p>
                        )}
                    </div>

                    <hr className="border-(--color-tertiary) my-4 opacity-30" />

                    <div className="flex gap-2">
                        <button
                            type="button"
                            className="flex-1 h-10 bg-white border border-primary rounded-lg text-primary text-sm font-medium
                                transition-transform duration-100 active:scale-95"
                            onClick={()=>{
                                 if (hasChanges) {
                                setOpenCancelConfirmDialog(true);
                            } else {
                                onClose(); 
                            }
                                                    }}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="flex-1 h-10 bg-primary rounded-lg text-white text-sm font-medium
                                transition-transform duration-100 enabled:active:scale-95
                                disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={isSaving || !hasChanges}
                            onClick={()=>setOpenConfirmDialog(true)}
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {openConfirmDialog && 
        
        (
            <ConfirmDialog
                title="Save Changes?"
                cancelText="Cancel"
                confirmText="Save"
                description={"Do you want to save changes for this policy?"}
                onClose={()=>setOpenConfirmDialog(false)}
                onConfirm={handleSubmit}
            />
        )

        }
        {openCancelConfirmDialog &&
        (
            <ConfirmDialog
    
                description={"Do you want to disacard progress in this edit policy form?"}
                onClose={()=>setOpenCancelConfirmDialog(false)}
                onConfirm={onClose}
            />

        )

        }
        </>
    );
}