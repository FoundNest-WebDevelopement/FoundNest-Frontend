import { useEffect, useState } from "react";
import Button from "../global-components/Button";
import ConfirmDialog from "../global-components/ConfirmDialog";
import TextArea from "../global-components/TextArea";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";

const normalize = (value) => String(value ?? "").trim();
export default function CategoryEditTab({
    selectedCategory,
    setSelectedCategory,
    refreshCategories,
    catLabel,
    disabled = false,
    onDirtyChange,
    onSaved,
    onCancel,
}) {
    const API_URL = import.meta.env.VITE_API_URL;

    const [isSaving, setIsSaving] = useState(false);
    const [categoryName, setCategoryName] = useState(selectedCategory.category_name || "");
    const [description, setDescription] = useState(selectedCategory.description || "");

    const [openSaveChange, setOpenSaveChange] = useState(false);
    const [openDiscardEdits, setOpenDiscardEdits] = useState(false);

    const trimmedName = categoryName.trim();
    const trimmedDescription = description.trim();

    const isNameEmpty = trimmedName === "";
    const isDescriptionEmpty = trimmedDescription === "";

    const isChanged =
        trimmedName !== normalize(selectedCategory.category_name) ||
        trimmedDescription !== normalize(selectedCategory.description);

    // Save is only allowed with a real change AND a non-empty name
    const canSave = isChanged && !isNameEmpty && !isDescriptionEmpty;

    useEffect(() => {
        onDirtyChange?.(isChanged);
    }, [isChanged, onDirtyChange]);

    const revertFields = () => {
        setCategoryName(selectedCategory.category_name || "");
        setDescription(selectedCategory.description || "");
    };

    const handleCancel = () => {
        if (isChanged) {
            setOpenDiscardEdits(true);
        } else {
            onCancel?.();
        }
    };

    const handleSaveDetails = async () => {
        setOpenSaveChange(false);

        if (isNameEmpty) {
            toast.error("Category name is required.");
            return;
        }

        if (!isChanged) {
            toast.info("No changes to save.");
            return;
        }

        try {
            setIsSaving(true);

            const response = await fetchWithAuth(
                `${API_URL}/api/categories/${selectedCategory.category_id}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        category_name: trimmedName,
                        description: trimmedDescription,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {

                throw new Error(data.message || "Failed to update category");
            }

            const updatedCategory = await refreshCategories();
            setSelectedCategory(updatedCategory);

            // Re-sync with what was actually saved (values are trimmed on save)
            setCategoryName(updatedCategory?.category_name || "");
            setDescription(updatedCategory?.description || "");

            toast.success(`Successfully updated ${catLabel}.`);
            onSaved?.();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const locked = disabled || isSaving;

    return (
        <>
            <div className="flex flex-col gap-4 h-full">
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-[#6B5C42]">CATEGORY NAME</label>
                    <input
                        type="text"
                        value={categoryName}
                        disabled={locked}
                        onChange={(e) => setCategoryName(e.target.value)}
                        className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none
                            disabled:cursor-not-allowed disabled:opacity-40"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-xs text-[#6B5C42]">DESCRIPTION</label>
                    <TextArea
                        placeholder="What kind of items belong in this category?"
                        disabled={locked}
                        value={description}
                        onChange={setDescription}
                    />
                </div>

                <div className="flex flex-col gap-4 mt-auto">
                    <hr className="border-(--color-tertiary) opacity-30" />
                    <div className="flex gap-2 ">
                        <div className="flex-1">
                            <div className="flex flex-col">
                                <Button
                                    isBorder={true}
                                    isSolid={false}
                                    disabled={isSaving}
                                    label="Cancel"
                                    onClick={handleCancel}
                                />
                            </div>

                        </div>
                        <div className="flex-1">
                            <div className="flex flex-col">
                                <Button
                                    isSolid={true}
                                    disabled={!canSave || locked}
                                    label={isSaving ? "Saving..." : "Save Changes"}
                                    onClick={() => setOpenSaveChange(true)}
                                />

                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {openSaveChange && (
                <ConfirmDialog
                    title="Save Changes"
                    description={
                        <>
                            Are you sure you want to save{" "}
                            <span className="font-bold">{selectedCategory.category_name}</span>?
                        </>
                    }
                    message={"This action will be seen to public by FoundNest users."}
                    cancelText="Cancel"
                    confirmText={"Save"}
                    onClose={() => setOpenSaveChange(false)}
                    onConfirm={handleSaveDetails}
                    disabled={isSaving}
                />
            )}

            {openDiscardEdits && (
                <ConfirmDialog
                    description={
                        <>
                            Are you sure you want to discard your edits to{" "}
                            <span className="font-semibold">{selectedCategory.category_name}</span>?
                        </>
                    }
                    onClose={() => setOpenDiscardEdits(false)}
                    onConfirm={() => {
                        setOpenDiscardEdits(false);
                        revertFields();
                        onCancel?.();
                    }}
                    disabled={isSaving}
                />
            )}
        </>
    );
}