import { useState, useEffect } from "react";
import { Search, Plus, FileText, Upload } from "lucide-react";

import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";
import formatDate from "../utils/formatDate";
import EditPolicyModal from "../super-admin-components/EditPolicyModal";
import PolicyCard from "../super-admin-components/PolicyCard";
import CategoryTable from "../super-admin-components/CategoryTable";

import Button from "../global-components/Button"
import AddCategoryModal from "../super-admin-components/AddCategoryModal";
import WebLoading from "../global-components/WebLoading";

import LocationTable from "../super-admin-components/LocationTable";
import AddLocationModal from "../super-admin-components/AddLocationModal";

import CenterCard from "../super-admin-components/CenterCard";
import AddCenterModal from "../super-admin-components/AddCenterModal";
import EditCenterModal from "../super-admin-components/EditCenterModal";
import ViewAdminsModal from "../super-admin-components/ViewAdminsModal";
import EditExportTemplateModal from "../super-admin-components/EditExportTemplateModal";

const TABS = [
    { label: "Policies", value: "POLICIES" },
    { label: "Locations", value: "LOCATIONS" },
    { label: "Categories", value: "CATEGORIES" },
    { label: "Centers", value: "CENTERS" },
    { label: "Template", value: "TEMPLATES" },
];

export default function SuperAdminGlobalConfiguration() {
    const API_URL = import.meta.env.VITE_API_URL;

    const [categoryStatusFilter, setCategoryStatusFilter] = useState("ALL");

    const [activeTab, setActiveTab] = useState(TABS[0].value);

    const [isLoading, setIsLoading] = useState(false);

    const [search, setSearch] = useState("");
    const [editingPolicy, setEditingPolicy] = useState(null);

    const [openAddCategory, setOpenAddCategory] = useState(false);

    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [categorySearch, setCategorySearch] = useState("");

    const [policies, setPolicies] = useState([]);
    const [isLoadingPolicies, setIsLoadingPolicies] = useState(false);

    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [isLoadingLocations, setIsLoadingLocations] = useState(false);
    const [locationSearch, setLocationSearch] = useState("");
    const [locationStatusFilter, setLocationStatusFilter] = useState("ALL");
    const [locationTypeFilter, setLocationTypeFilter] = useState("ALL");
    const [openAddLocation, setOpenAddLocation] = useState(false);

    const [centers, setCenters] = useState([]);
    const [selectedCenter, setSelectedCenter] = useState(null);
    const [viewingAdminsCenter, setViewingAdminsCenter] = useState(null);
    const [isLoadingCenters, setIsLoadingCenters] = useState(false);
    const [centerSearch, setCenterSearch] = useState("");
    const [centerStatusFilter, setCenterStatusFilter] = useState("ALL");
    const [openAddCenter, setOpenAddCenter] = useState(false);

    const [exportTemplate, setExportTemplate] = useState(null);
    const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
    const [openEditTemplate, setOpenEditTemplate] = useState(false);


  const mapPolicy = (row) => {
    let value = row.policy_value;

    if (row.value_type === "steps") {
        try {
            value = JSON.parse(row.policy_value);
        } catch (err) {
            console.error(`Failed to parse steps for policy ${row.policy_id}`, err);
            value = [];
        }
    } else if (row.value_type !== "text") {
        value = Number(row.policy_value);
    }

    const createdByName = row.created_by_name || "";
    const updatedByName = row.updated_by_name || "";

    return {
        id: row.policy_id,
        title: row.policy_name,
        description: row.policy_details,
        valueType: row.value_type,
        unit: row.unit,
        value,

        // Used by PolicyCard (same keys as before)
        updatedAt: formatDate(row.updated_at || row.created_at),
        // If it has never been updated, the last person to touch it is the creator
        updatedBy: updatedByName || createdByName || "N/A",

        // Used by EditPolicyModal
        createdByName,
        updatedByName,
        updatedAtRaw: row.updated_at || row.created_at,
    };
};

    const fetchPolicies = async () => {
        try {
            setIsLoadingPolicies(true);
            const response = await fetchWithAuth(`${API_URL}/api/policies`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch policies.");
            }

            setPolicies(data.map(mapPolicy));
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setIsLoadingPolicies(false);
        }
    };
    const fecthCategories  = async () => {

        try{
            setIsLoadingCategories(true)
            const response = await fetchWithAuth(`${API_URL}/api/categories/private`);
            const data = await response.json();

            if(!response.ok){
                throw new Error(data.message || "Failed to fetch categories")
            }



            setCategories(data);
        }catch(err){
            console.log(err.message);
            toast.error(err.message)

        } finally {
            setIsLoadingCategories(false)
        }
    }

    const fetchLocations = async () => {
        try {
            setIsLoadingLocations(true);
            const response = await fetchWithAuth(`${API_URL}/api/locations/private`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch locations.");
            }

            setLocations(data);
        } catch (err) {
            console.error(err);
            toast.error(err.message);
        } finally {
            setIsLoadingLocations(false);
        }
    };

    const fetchCenters = async () => {
        try {
            setIsLoadingCenters(true);
            const response = await fetchWithAuth(`${API_URL}/api/offices-private/list`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch centers.");
            }

            setCenters(data);
        } catch (err) {
            console.error(err);
            toast.error(err.message);
        } finally {
            setIsLoadingCenters(false);
        }
    };

    const fetchExportTemplate = async () => {
        try {
            setIsLoadingTemplate(true);
            const response = await fetchWithAuth(`${API_URL}/api/export-template`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch export template.");
            }

            setExportTemplate(data);
        } catch (err) {
            console.error(err);
            toast.error(err.message);
        } finally {
            setIsLoadingTemplate(false);
        }
    };

    useEffect(() => {
        fetchPolicies();
    }, []);
    useEffect(() => {
        
        if (activeTab === "CATEGORIES" && categories.length === 0) {
            fecthCategories();
        
    }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === "LOCATIONS" && locations.length === 0) {
            fetchLocations();
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === "CENTERS" && centers.length === 0) {
            fetchCenters();
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === "TEMPLATES" && exportTemplate === null) {
            fetchExportTemplate();
        }
    }, [activeTab]);

    const filteredPolicies = policies?.filter((policy) =>

        policy.title.toLowerCase().includes(search.toLowerCase())
    );

 const filteredCategories = categories?.filter((category) => {
    const query = categorySearch.toLowerCase();

    const formattedCategoryId =
        `CAT-${String(category.category_id).padStart(5, "0")}`.toLowerCase();

    const paddedCategoryId = String(category.category_id).padStart(5, "0");

    const matchesSearch =
        category.category_name?.toLowerCase().includes(query) ||
        formattedCategoryId.includes(query) ||
        paddedCategoryId.includes(query);

    const matchesStatus =
        categoryStatusFilter === "ALL" ||
        (categoryStatusFilter === "ACTIVE" && category.status === true) ||
        (categoryStatusFilter === "INACTIVE" && category.status === false);

    return matchesSearch && matchesStatus;
});

    const filteredLocations = locations.filter((loc) => {
        const query = locationSearch.toLowerCase();

        const formattedLocId = `${loc.location_type}-${String(loc.location_id).padStart(5, "0")}`.toLowerCase();

        const matchesSearch =
            loc.location_name?.toLowerCase().includes(query) ||
            formattedLocId.includes(query) ||
            String(loc.location_id).includes(query);

        const matchesStatus =
            locationStatusFilter === "ALL" ||
            (locationStatusFilter === "ACTIVE" && loc.status === true) ||
            (locationStatusFilter === "INACTIVE" && loc.status === false);

        const matchesType =
            locationTypeFilter === "ALL" || loc.location_type === locationTypeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    const filteredCenters = centers.filter((center) => {
        const query = centerSearch.toLowerCase();

        const formattedCenterId = `CTR-${String(center.office_id).padStart(3, "0")}`.toLowerCase();

        const matchesSearch =
            center.office_name?.toLowerCase().includes(query) ||
            formattedCenterId.includes(query) ||
            String(center.office_id).includes(query);

        const matchesStatus =
            centerStatusFilter === "ALL" ||
            (centerStatusFilter === "ACTIVE" && center.status === true) ||
            (centerStatusFilter === "INACTIVE" && center.status === false);

        return matchesSearch && matchesStatus;
    });

    const handleEditPolicy = (policy) => {
        setEditingPolicy(policy);
    };

    const handleSavePolicy = async (updatedPolicy) => {
        try {
            const policyValue =
                updatedPolicy.valueType === "steps"
                    ? JSON.stringify(updatedPolicy.value)
                    : updatedPolicy.value;

            const response = await fetchWithAuth(
                `${API_URL}/api/policies/${updatedPolicy.id}`,
                {
                    method: "PUT",
                    body: JSON.stringify({
                        policyName: updatedPolicy.title,
                        policyDetails: updatedPolicy.description,
                        policyValue,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update policy.");
            }

            toast.success(`Successfully updated "${updatedPolicy.title}".`);
            await fetchPolicies();
        } catch (error) {
            console.error(error);
            toast.error(error.message);
            throw error; 
        }
    };



    return (
        <div className="w-full min-h-screen bg-[#FAFAF8] p-6 flex flex-col gap-6">
            {/* Tabs */}
            <div className="flex gap-6 border-b border-[#E5E1D8]">
                {TABS.map((tab) => (
                    <button
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className={`pb-3 px-1 text-sm font-medium transition-colors
                            ${
                                activeTab === tab.value
                                    ? "text-primary border-b-2 border-primary"
                                    : "text-[#6B5C42]"
                            }`}
                    >
                        {activeTab === tab.value ? (
                            <span className="bg-primary text-white rounded-md px-4 py-2 -mb-3 inline-block">
                                {tab.label}
                            </span>
                        ) : (
                            tab.label
                        )}
                    </button>
                ))}
            </div>

            {/* POLICIES TAB */}
            {activeTab === "POLICIES" && (
                <>
                  {!isLoading? 

                    (
                        <>
                              <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 bg-white border border-[#E5E1D8] rounded-lg px-3 py-2 w-full max-w-xs shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)]">
                            <Search size={16} className="text-[#9A8F7C]" />
                            <input
                                type="text"
                                placeholder="Search policy..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full text-sm outline-none placeholder:text-[#9A8F7C]"
                            />
                        </div>

                        {/* <button
                            type="button"
                            onClick={handleAddPolicy}
                            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md text-sm font-medium
                                transition-transform duration-100 active:scale-95 shrink-0"
                        >
                            <Plus size={16} />
                            Add Policy
                        </button> */}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {isLoadingPolicies && (
                            <div className="text-sm text-[#6B5C42] col-span-2 text-center py-10">
                                <WebLoading
                                    marginBottom="mb-90"
                                />
                            </div>
                        )}

                        {!isLoadingPolicies &&
                            filteredPolicies.map((policy) => (
                                <PolicyCard key={policy.id} policy={policy} onEdit={handleEditPolicy} />
                            ))}

                        {!isLoadingPolicies && filteredPolicies.length === 0 && (
                            <p className="text-sm text-[#6B5C42] col-span-2 text-center py-10">
                                No policies found.
                            </p>
                        )}
                    </div>
                        </>
                    )
                    :
                    (
                        <>
                           
                        </>
                    )

                  }
                </>
            )}

         
            {activeTab === "LOCATIONS" && (
                <>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 bg-white border border-[#E5E1D8] rounded-lg px-3 py-2 min-w-100 shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)]">
                                <Search size={16} className="text-[#9A8F7C]" />
                                <input
                                    type="text"
                                    placeholder="Search by ID or name..."
                                    value={locationSearch}
                                    onChange={(e) => setLocationSearch(e.target.value)}
                                    className="w-full text-sm outline-none placeholder:text-[#9A8F7C]"
                                />
                            </div>
                            <div className="relative">
                                <select
                                    value={locationStatusFilter}
                                    onChange={(e) => setLocationStatusFilter(e.target.value)}
                                    className="bg-white border border-[#E5E1D8] rounded-lg pl-3 pr-8 py-2 text-sm text-[#6B5C42] outline-none cursor-pointer shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] appearance-none"
                                >
                                    <option value="ALL">All Status</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                </select>
                                <i className="fa-solid fa-chevron-down pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6B5C42]" />
                            </div>
                            <div className="relative">
                                <select
                                    value={locationTypeFilter}
                                    onChange={(e) => setLocationTypeFilter(e.target.value)}
                                    className="bg-white border border-[#E5E1D8] rounded-lg pl-3 pr-8 py-2 text-sm text-[#6B5C42] outline-none cursor-pointer shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] appearance-none"
                                >
                                    <option value="ALL">All Types</option>
                                    <option value="COLLEGE">College Building</option>
                                    <option value="SHARED_SPACE">Shared Student Spaces</option>
                                    <option value="GATE">Gates</option>
                                </select>
                                <i className="fa-solid fa-chevron-down pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6B5C42]" />
                            </div>
                        </div>

                        <Button
                            icon={Plus}
                            isIcon={true}
                            isShadow={true}
                            isSolid={true}
                            label={"Add Location"}
                            onClick={() => setOpenAddLocation(true)}
                        />
                    </div>

                    {isLoadingLocations && (
                        <WebLoading marginBottom="mb-90" />
                    )}

                    {!isLoadingLocations && filteredLocations.length === 0 && (
                        <p className="text-sm text-[#6B5C42] text-center py-10">
                            No locations found.
                        </p>
                    )}

                    {!isLoadingLocations && filteredLocations.length > 0 && (
                        <LocationTable
                            locations={filteredLocations}
                            allLocations={locations}
                            onUpdated={setLocations}
                            selectedLocation={selectedLocation}
                            setSelectedLocation={setSelectedLocation}
                        />
                    )}
                </>
            )}

        
            {activeTab === "CATEGORIES" && (
                <>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 bg-white border border-[#E5E1D8] rounded-lg px-3 py-2 min-w-100  shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)]">
                            <Search size={16} className="text-[#9A8F7C]" />
                            <input
                                type="text"
                                placeholder="Search categories..."
                                value={categorySearch}
                                onChange={(e) => setCategorySearch(e.target.value)}
                                className="w-full text-sm outline-none placeholder:text-[#9A8F7C] "
                            />
                        </div>
                          <div className="relative">
            <select
                value={categoryStatusFilter}
                onChange={(e) => setCategoryStatusFilter(e.target.value)}
                className="bg-white border border-[#E5E1D8] rounded-lg pl-3 pr-8 py-2 text-sm text-[#6B5C42] outline-none cursor-pointer shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] appearance-none"
            >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
            </select>
            <i className="fa-solid fa-chevron-down pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6B5C42]" />
        </div>
                        </div>
                      

                        <Button
                            icon={Plus}
                            isIcon={true}
                            isShadow={true}          
                            isSolid={true}
                            label={"Add Category"}   
                            onClick={()=>setOpenAddCategory(true)}           
                            />
                    </div>

                    {isLoadingCategories && (
                         <WebLoading
                                    marginBottom="mb-90"
                                />
                    )}

                    {!isLoadingCategories && filteredCategories.length === 0 && (
                        <p className="text-sm text-[#6B5C42] text-center py-10">
                            No categories found.
                        </p>
                    )}

                    {!isLoadingCategories && filteredCategories.length > 0 && (
                        <CategoryTable
                            categories={filteredCategories}
                            onUpdated={setCategories}
                            selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                        />
                    )}
                </>
                
            )}

          
            {activeTab === "CENTERS" && (
                <>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 bg-white border border-[#E5E1D8] rounded-lg px-3 py-2 min-w-100 shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)]">
                                <Search size={16} className="text-[#9A8F7C]" />
                                <input
                                    type="text"
                                    placeholder="Search by ID or name..."
                                    value={centerSearch}
                                    onChange={(e) => setCenterSearch(e.target.value)}
                                    className="w-full text-sm outline-none placeholder:text-[#9A8F7C]"
                                />
                            </div>
                            <div className="relative">
                                <select
                                    value={centerStatusFilter}
                                    onChange={(e) => setCenterStatusFilter(e.target.value)}
                                    className="bg-white border border-[#E5E1D8] rounded-lg pl-3 pr-8 py-2 text-sm text-[#6B5C42] outline-none cursor-pointer shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] appearance-none"
                                >
                                    <option value="ALL">All Status</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                </select>
                                <i className="fa-solid fa-chevron-down pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6B5C42]" />
                            </div>
                        </div>

                        <Button
                            icon={Plus}
                            isIcon={true}
                            isShadow={true}
                            isSolid={true}
                            label={"Add Center"}
                            onClick={() => setOpenAddCenter(true)}
                        />
                    </div>

                    {isLoadingCenters && (
                        <WebLoading marginBottom="mb-90" />
                    )}

                    {!isLoadingCenters && filteredCenters.length === 0 && (
                        <p className="text-sm text-[#6B5C42] text-center py-10">
                            No centers found.
                        </p>
                    )}

                    {!isLoadingCenters && filteredCenters.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {filteredCenters.map((center) => (
                                <CenterCard
                                    key={center.office_id}
                                    center={center}
                                    onEdit={setSelectedCenter}
                                    onViewAdmins={setViewingAdminsCenter}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {activeTab === "TEMPLATES" && (
                <>
                    <div className="flex items-center justify-between gap-4">
                        <p className="text-sm text-[#6B5C42]">
                            This PDF is used as the letterhead/background for all generated file exports.
                        </p>

                        <Button
                            icon={Upload}
                            isIcon={true}
                            isShadow={true}
                            isSolid={true}
                            label={exportTemplate?.file_url ? "Replace Template" : "Upload Template"}
                            onClick={() => setOpenEditTemplate(true)}
                        />
                    </div>

                    {isLoadingTemplate && (
                        <WebLoading marginBottom="mb-90" />
                    )}

                    {!isLoadingTemplate && (
                        <div className="bg-white border border-[#E5E1D8] rounded-lg p-5 flex items-center gap-4 shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)]">
                            <div className="w-16 h-16 rounded-lg bg-[#F5F5F5] border border-[#E5E1D8] flex items-center justify-center shrink-0">
                                <FileText size={32} className="text-[#9A8F7C]" strokeWidth={1.5} />
                            </div>

                            {exportTemplate?.file_url ? (
                                <div className="flex flex-col gap-1">
                                    <a
                                        href={exportTemplate.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-medium text-primary underline break-all"
                                    >
                                        View current template
                                    </a>
                                    <p className="text-xs text-[#6B5C42]">
                                        Last updated: {formatDate(exportTemplate.updated_at)}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-sm text-[#6B5C42]">
                                    No custom template uploaded yet. Exports are using the default bundled letterhead.
                                </p>
                            )}
                        </div>
                    )}
                </>
            )}

            {editingPolicy && (
                <EditPolicyModal
                    policy={editingPolicy}
                    onClose={() => setEditingPolicy(null)}
                    onSave={handleSavePolicy}
                />
            )}  
            {openAddCategory &&
                <AddCategoryModal
                    onClose={()=>setOpenAddCategory(false)}
                    onUpdated={setCategories}
                    setSelectedCategory={setSelectedCategory}
                    
                
                />
            }

            {openAddLocation && (
                <AddLocationModal
                    onClose={() => setOpenAddLocation(false)}
                    onUpdated={setLocations}
                    locations={locations}
                />
            )}

            {openAddCenter && (
                <AddCenterModal
                    onClose={() => setOpenAddCenter(false)}
                    onUpdated={setCenters}
                />
            )}

            {selectedCenter && (
                <EditCenterModal
                    center={selectedCenter}
                    onClose={() => setSelectedCenter(null)}
                    onUpdated={setCenters}
                />
            )}

            {viewingAdminsCenter && (
                <ViewAdminsModal
                    center={viewingAdminsCenter}
                    onClose={() => setViewingAdminsCenter(null)}
                />
            )}

            {openEditTemplate && (
                <EditExportTemplateModal
                    template={exportTemplate}
                    onClose={() => setOpenEditTemplate(false)}
                    onUpdated={setExportTemplate}
                />
            )}
        </div>
    );
}