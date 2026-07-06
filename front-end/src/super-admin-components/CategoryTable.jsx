import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import CategoryManagementModal from "./CategoryManagementModal";

export default function CategoryTable(
          {
            categories,
    onUpdated,
    selectedCategory,
    setSelectedCategory,
          }
){

    const [currentPage, setCurrentPage] = useState(1);
        const [tableHeight, setTableHeight] = useState("");
        const [itemsPerPage, setItemsPerPage] = useState();
        const safeCategories = Array.isArray(categories) ? categories : [];
        const totalPages = Math.max(1, Math.ceil(safeCategories.length / itemsPerPage));
        const activePage = Math.min(currentPage, totalPages);
        const startIndex = (activePage - 1) * itemsPerPage;
        const paginatedCategories= safeCategories.slice(
            startIndex,
            startIndex + itemsPerPage
        );
    
        const formatCatId = (id) => {
        return `CAT-${String(id).padStart(5, "0")}`;
      };

      useEffect(() => {
    const updateTableSize = () => {
        const height = window.innerHeight;

        if (height > 732) {
            setTableHeight("min-h-150");
            setItemsPerPage(9);
        } else {
            setTableHeight("min-h-102");
            setItemsPerPage(6);
        }
    };

    updateTableSize();

    window.addEventListener("resize", updateTableSize);

    return () => {
        window.removeEventListener("resize", updateTableSize);
    };
}, []);

    return(
        <>
           <div>
             <div className={`h-fit ${tableHeight} w-full max-w-full min-w-0  rounded-t-xl bg-white border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden`}>
                <div className="w-full min-w-0 overflow-x-auto overflow-y-hidden bg-white shadow-sm">

                    <table className="table table-zebra table-sm min-w-295 [&_th]:px-2 [&_td]:px-2 text-center">

                        <thead className="bg-primary text-white text-center">
                            <tr>
                                <th className="w-5"></th>
                                <th className="w-20">CAT ID</th>
                                <th className="w-48">NAME</th>
                                <th className="w-32">ITEMS COUNT</th>
                                <th className="w-32">STATUS</th>
                                <th className="w-24">ACTIONS</th>
                            </tr>
                        </thead>

                        <tbody>
                            {paginatedCategories?.map((cat, index) => (
                                <tr
                                    key={cat.category_id}
                                    className={
                                        index % 2 === 0
                                            ? "bg-white"
                                            : "bg-[#F5F5F5]"
                                    }
                                >

                                    <td className="align-middle h-15">{startIndex + index + 1}</td>

                                    <td className="w-28 align-middle text-center">{formatCatId(cat.category_id)}</td>

                    

                                    <td className="truncate max-w-48 align-middle text-center">{cat.category_name? cat.category_name : "N/A"}</td>

                                    <td className="truncate max-w-48 align-middle text-center">{cat.item_count}</td>

                                    <td className="align-middle text-center">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium 
                                        ${cat.status === true && "bg-green-100 text-green-700" }
                                        ${cat.status == false && "bg-gray-200 text-gray-700"}
                                    
                
                                        `}
                                        >
                                        {cat.status === true && "Active"}
                                            {cat.status === false && "Inactive"}
            
                                        </span>
                                    </td>

                                    <td className="align-middle text-center">
                                        <button className=" btn-sm btn-square  text-white border-none cursor-pointer transition-transform duration-100
                                     active:scale-95 disabled:opacity-20 "
                                            onClick={() => { setSelectedCategory(cat)}}
                                        > 
                                            <Pencil size={18} className="text-primary" />                       
                                        </button>
                                    </td>

                                </tr>
                            ))}
                            {paginatedCategories.length === 0 && (
                                <tr>
                                    <td colSpan={11} className="text-center py-8 text-[#6B5C42]">
                                        No Records to display.
                                    </td>
                                </tr>
                            )}
                        </tbody>

                    </table>

                </div>
            </div>

            <div className="flex items-center justify-between bg-white border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] rounded-b-xl px-4 py-3 text-xs mt-1">
                <p className="text-[#6B5C42]">
                    Showing {safeCategories.length === 0 ? 0 : startIndex + 1}
                    {" - "}
                    {Math.min(startIndex + itemsPerPage, safeCategories.length)}
                    {" of "}
                    {safeCategories.length}
                </p>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        disabled={activePage === 1}
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        className={`border border-primary rounded-md px-3 py-2 text-primary ${activePage === 1
                            ? "opacity-40 cursor-not-allowed"
                            : "cursor-pointer active:scale-95"
                            }`}
                    >
                        Previous
                    </button>

                    <p className="text-[#6B5C42]">
                        Page {activePage} of {totalPages}
                    </p>

                    <button
                        type="button"
                        disabled={activePage === totalPages}
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                        className={`border border-primary rounded-md px-3 py-2 text-primary ${activePage === totalPages
                            ? "opacity-40 cursor-not-allowed"
                            : "cursor-pointer active:scale-95"
                            }`}
                    >
                        Next
                    </button>
                </div>
            </div>
           </div>

          
            

            {selectedCategory &&
                (
                    <CategoryManagementModal
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    onUpdated={onUpdated}
                     />
                )

            }
        </>
    )
}