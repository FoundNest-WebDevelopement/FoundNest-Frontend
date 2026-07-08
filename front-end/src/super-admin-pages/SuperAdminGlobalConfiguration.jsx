import { useState, useEffect } from "react";
import { Search, Plus } from "lucide-react";

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

const TABS = [
    { label: "Policies", value: "POLICIES" },
    { label: "Locations", value: "LOCATIONS" },
    { label: "Categories", value: "CATEGORIES" },
    { label: "Centers", value: "CENTERS" },
];

export default function SuperAdminGlobalConfiguration() {
    const API_URL = import.meta.env.VITE_API_URL;

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
    const [openAddLocation, setOpenAddLocation] = useState(false);

    const [centers, setCenters] = useState([]);
    const [selectedCenter, setSelectedCenter] = useState(null);
    const [viewingAdminsCenter, setViewingAdminsCenter] = useState(null);
    const [isLoadingCenters, setIsLoadingCenters] = useState(false);
    const [centerSearch, setCenterSearch] = useState("");
    const [openAddCenter, setOpenAddCenter] = useState(false);


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

        return {
            id: row.policy_id,
            title: row.policy_name,
            description: row.policy_details,
            valueType: row.value_type,
            unit: row.unit,
            value,
            updatedAt: row.last_action_at ? formatDate(row.last_action_at) : formatDate(row.created_at),
            updatedBy: row.first_name ? `${row.first_name} ${row.last_name}` : "N/A",
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
            console.log(data);


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

    const filteredPolicies = policies?.filter((policy) =>

        policy.title.toLowerCase().includes(search.toLowerCase())
    );

    const filteredCategories = categories?.filter((category) => {
    const query = categorySearch.toLowerCase();

    const formattedCategoryId =
        `CAT-${String(category.category_id).padStart(5, "0")}`.toLowerCase();

    const paddedCategoryId = String(category.category_id).padStart(5, "0");

    return (
        category.category_name?.toLowerCase().includes(query) ||
        formattedCategoryId.includes(query) ||
        paddedCategoryId.includes(query)
    );
});

    const filteredLocations = locations.filter((loc) =>
        loc.location_name?.toLowerCase().includes(locationSearch.toLowerCase())
    );

    const filteredCenters = centers.filter((center) =>
        center.office_name?.toLowerCase().includes(centerSearch.toLowerCase())
    );

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
                            <p className="text-sm text-[#6B5C42] col-span-2 text-center py-10">
                                <WebLoading
                                    marginBottom="mb-90"
                                />
                            </p>
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
                        <div className="flex items-center gap-2 bg-white border border-[#E5E1D8] rounded-lg px-3 py-2 w-full max-w-xs shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)]">
                            <Search size={16} className="text-[#9A8F7C]" />
                            <input
                                type="text"
                                placeholder="Search locations..."
                                value={locationSearch}
                                onChange={(e) => setLocationSearch(e.target.value)}
                                className="w-full text-sm outline-none placeholder:text-[#9A8F7C]"
                            />
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
                        <p className="text-sm text-[#6B5C42] text-center py-10">
                            Loading locations...
                        </p>
                    )}

                    {!isLoadingLocations && filteredLocations.length === 0 && (
                        <p className="text-sm text-[#6B5C42] text-center py-10">
                            No locations found.
                        </p>
                    )}

                    {!isLoadingLocations && filteredLocations.length > 0 && (
                        <LocationTable
                            locations={filteredLocations}
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
                        <div className="flex items-center gap-2 bg-white border border-[#E5E1D8] rounded-lg px-3 py-2 w-full max-w-xs shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)]">
                            <Search size={16} className="text-[#9A8F7C]" />
                            <input
                                type="text"
                                placeholder="Search categories..."
                                value={categorySearch}
                                onChange={(e) => setCategorySearch(e.target.value)}
                                className="w-full text-sm outline-none placeholder:text-[#9A8F7C] "
                            />
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
                        <div className="flex items-center gap-2 bg-white border border-[#E5E1D8] rounded-lg px-3 py-2 w-full max-w-xs shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)]">
                            <Search size={16} className="text-[#9A8F7C]" />
                            <input
                                type="text"
                                placeholder="Search centers..."
                                value={centerSearch}
                                onChange={(e) => setCenterSearch(e.target.value)}
                                className="w-full text-sm outline-none placeholder:text-[#9A8F7C]"
                            />
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
                        <p className="text-sm text-[#6B5C42] text-center py-10">
                            Loading centers...
                        </p>
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
        </div>
    );
}