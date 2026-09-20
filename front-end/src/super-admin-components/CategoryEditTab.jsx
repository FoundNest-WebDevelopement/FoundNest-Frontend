import { useEffect, useState } from "react";
import Button from "../global-components/Button";
import ConfirmDialog from "../global-components/ConfirmDialog";
import TextArea from "../global-components/TextArea";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";

export default function CategoryEditTab({
    selectedCategory,
    setSelectedCategory,
    refreshCategories, // async () => updatedCategory
    catLabel,          // e.g. "CAT-00012", used in the success toast
    disabled = false,  // parent busy (e.g. status is being toggled)
    onDirtyChange,     // (boolean) => void, tells the parent about unsaved edits
    onSaved,           // called after a successful save
    onCancel,          // called when the user leaves edit mode without saving
}) {
    const API_URL = import.meta.env.VITE_API_URL;

    const [isSaving, setIsSaving] = useState(false);
    const [categoryName, setCategoryName] = useState(selectedCategory.category_name || "");
    const [description, setDescription] = useState(selectedCategory.description || "");

    const [openSaveChange, setOpenSaveChange] = useState(false);
    const [openDiscardEdits, setOpenDiscardEdits] = useState(false);

    // Compare against "" so a null description doesn't count as a change
    const isChanged =
        categoryName !== (selectedCategory.category_name || "") ||
        description !== (selectedCategory.description || "");

    // Let the parent know so it can warn before the panel is closed
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

        if (!categoryName.trim()) {
            toast.error("Category name is required.");
            return;
        }

        try {
            setIsSaving(true);

            const response = await fetchWithAuth(
                `${API_URL}/api/categories/${selectedCategory.category_id}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        category_name: categoryName.trim(),
                        description: description.trim(),
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
            console.error(error);
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const locked = disabled || isSaving;

    return (
        <>
            <div className="flex flex-col gap-4">
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

                <div className="flex gap-2">
                    <div className="flex-1">
                        <Button
                            isBorder={true}
                            isSolid={false}
                            disabled={isSaving}
                            label="Cancel"
                            onClick={handleCancel}
                        />
                    </div>
                    <div className="flex-1">
                        <Button
                            isSolid={true}
                            disabled={locked || !isChanged}
                            label={isSaving ? "Saving..." : "Save Changes"}
                            onClick={() => setOpenSaveChange(true)}
                        />
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