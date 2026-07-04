import { useState } from "react";
import { Tag } from "lucide-react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";
import ConfirmDialog from "../global-components/ConfirmDialog";

export default function AddCategoryModal ({ onClose, onCreate, onUpdated, setSelectedCategory }) {

    const API_URL = import.meta.env.VITE_API_URL;

     const [categoryName, setCategoryName] = useState("");
    const [description, setDescription] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const checkProgress = 
            categoryName !== "" ||
            description !== "";
    const [openConfirmAdd, setOpenConfirmAdd] = useState(false);
    const [openCancelAdd, setOpenCancelAdd] = useState(false);


    const [error, setError] = useState("");
 
    const formatCatId = (id) => {
        return `CAT-${String(id).padStart(5, "0")}`;
      };

    const handleSubmit = async () => {
        if (!categoryName.trim()) {
            setError("Category name is required.");
            return;
        }
 
        try {
            setOpenConfirmAdd(false);
            setIsSaving(true);
            setError("");

            const response = await fetchWithAuth(
                `${API_URL}/api/categories`, {
                    method:"POST",
                    body: JSON.stringify({
                        category_name: categoryName.trim(),
                        description: description.trim(),
                    }),
                }
            )
 
            const data = await response.json();

            console.log(data)

            if(!response.ok){
                throw new Error (data.message || "Failed to Add Category")
            }

            const categoriesResponse = await fetchWithAuth(
                `${API_URL}/api/categories/private`
            )

            const categoriesData = await categoriesResponse.json();

            if (Array.isArray(categoriesData)) {
                onUpdated?.(categoriesData);
            }

            const updatedSelected = categoriesData.find(
                (category) => category.category_id === data.data.category_id.found_report_id,
            );


            
            toast.success(`Category ${formatCatId(data.data.category_id)} added successfully`)
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to create category.");
            toast.error(err.message || "Failed to create category.")
        } finally {
            setIsSaving(false);
        }
    };

    return(
        <>

        
        
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-1040">
            <div className="relative bg-white rounded-lg w-100 max-w-[90vw]">
                <div className="w-full h-10 rounded-t-lg bg-primary text-white flex items-center justify-between px-5">
                    <p className="font-semibold">Add Category</p>
                    <button onClick={onClose}>
                        <i className="fa-solid fa-x text-sm text-white" />
                    </button>
                </div>
 
                <div className="p-4">
                    <div className="flex justify-center mb-4">
                        <Tag size={40} className="text-primary" />
                    </div>
 
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-[#1A1208]">
                                Category Name
                            </label>
                            <input
                                type="text"
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                placeholder="e.g., Electronics"
                                className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none
                                   "
                            />
                        </div>
 
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-[#1A1208]">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What kind of items belong in this category?"
                                rows={3}
                                className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none resize-none
                                    "
                            />
                        </div>
 
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
                                if(checkProgress){
                                    setOpenCancelAdd(true);
                                }else{
                                    onClose()
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
                            disabled={isSaving || categoryName === "" ||  description === ""}
                            onClick={()=>setOpenConfirmAdd(true)}
                        >
                            {isSaving ? "Creating..." : "Create Category"}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {openConfirmAdd &&
            <ConfirmDialog
                title="Confirm Add Category"
                cancelText="Cancel"
                description= { 
                    <>
                        "Confirm adding category: <span className="font-semibold">{categoryName}</span>?"
                        
                    </>
                }
                confirmText="Confirm"
                onClose={()=>setOpenConfirmAdd(false)}
                onConfirm={handleSubmit}
            />
        }
        {openCancelAdd &&
            <ConfirmDialog
         
                description= {"Are you sure you want to discared progress?"}
                onClose={()=>setOpenCancelAdd(false)}
                onConfirm={onClose}
            />
        }
            
        </>
    )
}