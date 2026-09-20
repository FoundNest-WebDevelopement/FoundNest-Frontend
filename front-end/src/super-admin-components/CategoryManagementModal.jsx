import { useState } from "react";
import formatDate from "../utils/formatDate";
import Button from "../global-components/Button";
import ConfirmDialog from "../global-components/ConfirmDialog";
import { TriangleAlert, Power } from "lucide-react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";
import CategoryEditTab from "./CategoryEditTab";

export default function CategoryManagementModal({
    selectedCategory = [],
    setSelectedCategory,
    onUpdated,
}) {
    const API_URL = import.meta.env.VITE_API_URL;

    const [isTogglingStatus, setIsTogglingStatus] = useState(false);

    // Edit mode: CategoryEditTab owns the form, saving, and its own confirmations
    const [isEditing, setIsEditing] = useState(false);
    const [isEditDirty, setIsEditDirty] = useState(false);

    const [openDeactivate, setOpenDeactivate] = useState(false);
    const [openActivate, setOpenActivate] = useState(false);
    const [openCancelEdit, setOpenCancelEdit] = useState(false);

    const formatCatId = (id) => {
        return `CAT-${String(id).padStart(5, "0")}`;
    };

    const refreshCategories = async () => {
        const response = await fetchWithAuth(`${API_URL}/api/categories/private`);
        const data = await response.json();

        if (Array.isArray(data)) {
            onUpdated?.(data);
        }

        return data.find(
            (category) => category.category_id === selectedCategory.category_id
        );
    };

    const closeEditMode = () => {
        setIsEditing(false);
        setIsEditDirty(false);
    };

    const handleClosePanel = () => {
        if (isEditing && isEditDirty) {
            setOpenCancelEdit(true);
        } else {
            setSelectedCategory(null);
        }
    };

    const handleToggleStatus = async (status) => {
        try {
            setIsTogglingStatus(true);
            setOpenDeactivate(false);
            setOpenActivate(false);

            const response = await fetchWithAuth(
                `${API_URL}/api/categories/${selectedCategory.category_id}/status`,
                {
                    method: "PUT",
                    body: JSON.stringify({ status }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update category status");
            }

            const updatedCategory = await refreshCategories();
            setSelectedCategory(updatedCategory);

            toast.success(
                status
                    ? `Category ${formatCatId(selectedCategory.category_id)} activated.`
                    : `Category ${formatCatId(selectedCategory.category_id)} deactivated.`
            );
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setIsTogglingStatus(false);
        }
    };

    return (
        <>
            <div
                className="fixed inset-0 z-100 w-screen h-screen bg-black/20 flex items-center justify-center"
                // onClick={() => (isChanged ? setOpenCancelEdit(true) : setSelectedCategory(null))}
            >
                <div
                    className="absolute top-0 right-0 h-full w-3/10 bg-white flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-full h-15 bg-primary items-center flex pl-2 gap-4 shrink-0"   >
                        <p className="text-white font-semibold text-md xl:text-lg pl-2">
                            {isEditing ? "Edit Category" : "Category Details"}
                        </p>
                        <div className="ml-auto pr-6">
                            <button onClick={handleClosePanel}>
                                <i className="fa-solid fa-x text-xs xl:text-sm text-white"></i>
                            </button>
                        </div>
                    </div>

                    <div className="h-full w-full p-5 overflow-auto flex flex-col gap-6">
                        {isEditing ? (
                            <CategoryEditTab
                                selectedCategory={selectedCategory}
                                setSelectedCategory={setSelectedCategory}
                                refreshCategories={refreshCategories}
                                catLabel={formatCatId(selectedCategory.category_id)}
                                disabled={isTogglingStatus}
                                onDirtyChange={setIsEditDirty}
                                onSaved={closeEditMode}
                                onCancel={closeEditMode}
                            />
                        ) : (
                            <>
                                {/* Category Details (view only) */}
                                <div className="flex flex-col gap-4">
                                    <p className="font-semibold text-sm xl:text-base">Category Details</p>

                                    <div className="flex flex-col gap-1">
                                        <p className="text-xs text-[#6B5C42]">CATEGORY ID</p>
                                        <p className="text-xs">{formatCatId(selectedCategory.category_id)}</p>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <p className="text-xs text-[#6B5C42]">CATEGORY NAME</p>
                                        <p className="text-xs">{selectedCategory.category_name || "N/A"}</p>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <p className="text-xs text-[#6B5C42]">DESCRIPTION</p>
                                        <p className="text-xs whitespace-pre-wrap">
                                            {selectedCategory.description || "No description provided."}
                                        </p>
                                    </div>

                                    <div className="flex">
                                        <div className="flex flex-col gap-1 flex-1">
                                            <p className="text-xs text-[#6B5C42]">DATE CREATED</p>
                                            <p className="text-xs">
                                                {formatDate(selectedCategory.created_at) || "N/A"}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-1 flex-1">
                                            <p className="text-xs text-[#6B5C42]">STATUS</p>
                                            <div
                                                className={`px-3 py-1 rounded-full text-xs font-medium w-fit
                                                    ${selectedCategory.status === true && "bg-green-100 text-green-700"}
                                                    ${selectedCategory.status === false && "bg-gray-200 text-gray-700"}
                                                `}
                                            >
                                                <p>
                                                    {selectedCategory.status === true && "Active"}
                                                    {selectedCategory.status === false && "Inactive"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-4 mt-auto">
                                    <hr className="border-(--color-tertiary) opacity-30" />

                                    {selectedCategory.status === true && (
                                        <div className="flex w-full gap-2 h-10">
                                            <div className="flex-1 h-full">
                                                <div className=" flex flex-col h-full">
                                                    <Button
                                                        isSolid={true}
                                                        disabled={isTogglingStatus}
                                                        label="Edit Category"
                                                        onClick={() => setIsEditing(true)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-1 h-full">
                                                <div className=" flex flex-col h-full">
                                                    <Button
                                                        isBorder={true}
                                                        isSolid={false}
                                                        disabled={isTogglingStatus}
                                                        label={isTogglingStatus ? "Deactivating..." : "Deactivate Category"}
                                                        onClick={() => setOpenDeactivate(true)}
                                                    />

                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {selectedCategory.status === false && (
                                        <>
                                            <p className="text-xs text-[#6B5C42]">
                                                This category is currently inactive and hidden from item listings.
                                            </p>
                                            <div className="flex w-full gap-2">
                                                <div className="flex-1">
                                                    <div className=" flex flex-col">
                                                        <Button
                                                            isBorder={true}
                                                            isSolid={false}
                                                            disabled={isTogglingStatus}
                                                            label="Edit Category"
                                                            onClick={() => setIsEditing(true)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className=" flex flex-col">
                                                        <Button
                                                            isSolid={true}
                                                            disabled={isTogglingStatus}
                                                            label={isTogglingStatus ? "Activating..." : "Activate Category"}
                                                            onClick={() => setOpenActivate(true)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {openDeactivate && (
                <ConfirmDialog
                    Icon={TriangleAlert}
                    iconColor="text-(--color-quaternary)"
                    title="Deactivate Category"
                    description={
                        <>
                            Are you sure you want to deactivate{" "}
                            <span className="font-bold">{selectedCategory.category_name}</span>?
                        </>
                    }
                    message={"This action will be permanently logged in the action log."}
                    cancelText="Cancel"
                    confirmText={isTogglingStatus ? "Deactivating..." : "Deactivate"}
                    onClose={() => setOpenDeactivate(false)}
                    onConfirm={() => handleToggleStatus(false)}
                    disabled={isTogglingStatus}
                />
            )}

            {openActivate && (
                <ConfirmDialog
                    Icon={Power}
                    iconColor="text-primary"
                    title="Activate Category"
                    description={
                        <>
                            Are you sure you want to activate{" "}
                            <span className="font-bold">{selectedCategory.category_name}</span>?
                        </>
                    }
                    message={"This action will be permanently logged in the action log."}
                    cancelText="Cancel"
                    confirmText={isTogglingStatus ? "Activating..." : "Activate"}
                    onClose={() => setOpenActivate(false)}
                    onConfirm={() => handleToggleStatus(true)}
                    disabled={isTogglingStatus}
                />
            )}

            {/* Closing the panel while there are unsaved edits */}
            {openCancelEdit && (
                <ConfirmDialog
                    description={
                        <>
                            Are you sure you want to discard your edits to{" "}
                            <span className="font-semibold">{selectedCategory.category_name}</span>?
                        </>
                    }
                    onClose={() => setOpenCancelEdit(false)}
                    onConfirm={() => setSelectedCategory(null)}
                    disabled={isTogglingStatus}
                />
            )}
        </>
    );
}