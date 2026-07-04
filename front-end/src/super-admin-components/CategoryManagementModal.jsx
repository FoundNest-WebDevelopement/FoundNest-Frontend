import { useState } from "react";
import formatDate from "../utils/formatDate";
import Button from "../global-components/Button";
import ConfirmDialog from "../global-components/ConfirmDialog";
import { TriangleAlert, Power } from "lucide-react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";
import TextArea from "../global-components/TextArea";

export default function CategoryManagementModal({
    selectedCategory = [],
    setSelectedCategory,
    onUpdated,
}) {
    const API_URL = import.meta.env.VITE_API_URL;

    const [isSaving, setIsSaving] = useState(false);
    const [isTogglingStatus, setIsTogglingStatus] = useState(false);
    

    const [categoryName, setCategoryName] = useState(selectedCategory.category_name || "");
    const [description, setDescription] = useState(selectedCategory.description || "");

    const isChanged = 
        categoryName !== selectedCategory.category_name ||
        description !== selectedCategory.description;

    const [openDeactivate, setOpenDeactivate] = useState(false);
    const [openActivate, setOpenActivate] = useState(false);

    const [openSaveChange, setOpenSaveChange] = useState(false);

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

    

    const handleSaveDetails = async () => {
        if (!categoryName.trim()) {
            toast.error("Category name is required.");
            return;
        }

        try {
            setIsSaving(true);
            setOpenSaveChange(false)
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

            toast.success(`Successfully updated ${formatCatId(selectedCategory.category_id)}.`);
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setIsSaving(false);
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
            <div className="fixed inset-0 z-100 w-screen h-screen bg-black/20 flex items-center justify-center">
                <div className="absolute top-0 right-0 h-full w-3/10 bg-white flex flex-col">
                    <div className="w-full h-15 bg-primary items-center flex pl-2 gap-4 shrink-0">
                        <p className="text-white font-semibold text-md xl:text-lg pl-2">Category Details</p>
                        <div className="ml-auto pr-6">
                            <button onClick={() => {
                                if(isChanged){
                                    setOpenCancelEdit(true)
                                }else{
                                    setSelectedCategory(null)
                                }
                            }}>
                                <i className="fa-solid fa-x text-xs xl:text-sm text-white"></i>
                            </button>
                        </div>
                    </div>

                    <div className="h-full w-full p-5 overflow-auto flex flex-col gap-6">
                        {/* Category Details */}
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <p className="font-semibold text-sm xl:text-base">Category Details</p>
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

                            <div className="flex flex-col gap-1">
                                <p className="text-xs text-[#6B5C42]">CATEGORY ID</p>
                                <p className="text-xs">{formatCatId(selectedCategory.category_id)}</p>
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-[#6B5C42]">CATEGORY NAME</label>
                                <input
                                    type="text"
                                    value={categoryName}
                                    disabled={isTogglingStatus || isSaving}
                                    onChange={(e) => setCategoryName(e.target.value)}
                                    className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none
                                    disabled:cursor-not-allowed disabled:opacity-40"
                                        
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-[#6B5C42]">DESCRIPTION</label>
                                <TextArea
                                    placeholder="What kind of items belong in this category?"
                                    disabled={isTogglingStatus || isSaving}
                                    value={description}
                                    onChange={setDescription}
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <p className="text-xs text-[#6B5C42]">DATE CREATED</p>
                                <p className="text-xs">{formatDate(selectedCategory.created_at) || "N/A"}</p>
                            </div>

                            <Button
                                isSolid={true}
                                disabled={isSaving || !isChanged || isTogglingStatus}
                                label={isSaving ? "Saving..." : "Save Changes"}
                                onClick={()=>setOpenSaveChange(true)}
                            />
                        </div>

                        <hr className="border-(--color-tertiary) opacity-30" />

                        {/* Status Management */}
                        <div className="flex flex-col gap-4">
                            <p className="font-semibold text-sm xl:text-base">Category Status</p>

                            {selectedCategory.status === true && (
                                <>
                                    <p className="text-xs text-[#C0392B]">
                                        Deactivating this category will hide it from item listings and reports.
                                    </p>
                                    <Button
                                        isBorder={true}
                                        isSolid={false}
                                        disabled={isTogglingStatus || isSaving}
                                        label={isTogglingStatus ? "Deactivating..." : "Deactivate Category"}
                                        onClick={() => setOpenDeactivate(true)}
                                    />
                                </>
                            )}

                            {selectedCategory.status === false && (
                                <>
                                    <p className="text-xs text-[#6B5C42]">
                                        This category is currently inactive and hidden from item listings.
                                    </p>
                                    <Button
                                        isSolid={true}
                                        disabled={isTogglingStatus ||  isSaving}
                                        label={isTogglingStatus ? "Activating..." : "Activate Category"}
                                        onClick={() => setOpenActivate(true)}
                                    />
                                </>
                            )}
                        </div>
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

            {openSaveChange && (
                <ConfirmDialog
                    title="Save Changes"
                    description={
                        <>
                            Are you sure you want to save {" "}
                            <span className="font-bold">{selectedCategory.category_name}</span>?
                        </>
                    }
                    message={"This action will be seen to public by FoundNest users."}
                    cancelText="Cancel"
                    confirmText={"Save"}
                    onClose={() => setOpenSaveChange(false)}
                    onConfirm={handleSaveDetails}
                    disabled={isTogglingStatus}
                />
            )}

            {openCancelEdit && (
                <ConfirmDialog
                    description={
                    <>
                        Are you sure you want to discard your edits to{" "}
                        <span className="font-semibold">{selectedCategory.category_name}</span>?
                    </>
                    }
                    onClose={() => setOpenCancelEdit(false)} 
                    onConfirm={()=>setSelectedCategory(null)} 
                    disabled={isTogglingStatus}
                />
                )}
        </>
    );
}