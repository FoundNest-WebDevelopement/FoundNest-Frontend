import { Download, QrCode, Plus, Table } from "lucide-react"
import AdminButton from "../admin-components/AdminButton"
import AdminLocationDropDown from "../admin-components/AdminLocationDropDown"
import { useEffect, useState } from "react";
import AdminCategoriesDropdown from "../admin-components/AdminCategoriesDropdown";
import AdminStatusDropDown from "../admin-components/AdminStatusDropDown";
import AdminDateInput from "../admin-components/AdminDateInput";
import ItemManagementTable from "../admin-components/ItemManagementTable";
import FoundItemModal from "../admin-components/FoundItemModal";
import { FOUND_REPORT_STATUS } from "../../../back-end/constants/found_item_status";


export default function ItemManagement() {
    const API_URL = import.meta.env.VITE_API_URL;

    //test
    const adminId = localStorage.getItem("admin_id");
    console.log(adminId)
    console.log(localStorage);

    const [openLogItem, setOpenLogItem] = useState(false);
    const [categories, setCategories] = useState([]);
    
    const [reports, setReports] = useState([]);
    const statuses = Object.values(FOUND_REPORT_STATUS);

    //LOCATIONS STORAGE
     const [gates, setGates] = useState([]);
    const [sharedSpaces, setSharedSpaces] = useState([]);
    const [locations, setLocations] = useState([]);

    const allLocations = [
  ...locations?.map((building) => ({
    id: building.office_id,
    name: building.office_name,
    type: "college",
  })),

  ...sharedSpaces?.map((space) => ({
    id: space.shared_space_id,
    name: space.shared_space_name,
    type: "shared-space",
  })),

  ...gates?.map((gate) => ({
    id: gate.gate_id,
    name: gate.gate_name,
    type: "gate",
  })),
];



    //TEMP VARIABLES FILTER STORAGE
    const [searchTemp, setSearchTemp] = useState("");
    const [dateFoundTemp, setDateFoundTemp] = useState("");
    const [locationTemp, setLocationTemp] = useState("");
    const [categoryTemp, setCategoryTemp] = useState("");
    const [statusTemp, setStatusTemp] = useState("");

    //SEARCH AND FILTER VARIABLES 
    const [search, setSearch] = useState("");
    const [dateFound, setDateFound] = useState("");
    const [location, setLocation] = useState("");
    const [category, setCategory] = useState("");
    const [status, setStatus] = useState("");

    //SEARCH AND FILTER FUNCTION 
    const filteredReports = reports.filter((report) => {
        const query = search.toLowerCase();

        const matchesSearch =
            !query ||
            report.item_name?.toLowerCase().includes(query) ||
            report.category_name?.toLowerCase().includes(query) ||
            report.location_found?.toLowerCase().includes(query) ||
            report.reported_by?.toLowerCase().includes(query);

        const matchesCategory =
            !category ||
            String(report.category_id) === String(category);

        const matchesLocation =
            !location ||
            String(report.office_id) === String(location);

        const matchesStatus =
            !status ||
            report.status === status;

        const reportDate = new Date(report.found_date)
            .toISOString()
            .split("T")[0];
        const matchesDate =
            !dateFound || reportDate === dateFound;


        return (
            matchesSearch &&
            matchesCategory &&
            matchesLocation &&
            matchesDate &&
            matchesStatus
        );
    });

    //REPORTS AND OTHER FETCH

    useEffect(() => {
        fetch(`${API_URL}/api/categories`)
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
                setCategories(data);
            })
            .catch((err) => {
                console.error(err);
            });
    }, []);
   useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${API_URL}/api/found-reports`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
        .then((res) => res.json())
        .then((data) => {
            console.log(data);
            setReports(data);
        })
        .catch((err) => {
            console.error(err);
        });
}, []);
    useEffect(() => {
        fetch(`${API_URL}/api/offices`)
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
                setLocations(data);
            })
            .catch((err) => {
                console.error(err);
            });
    }, []);

    useEffect(() => {
        fetch(`${API_URL}/api/gates`)
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
                setGates(data);
            })
            .catch((err) => {
                console.error(err);
            });
    }, []);



    useEffect(() => {
        fetch(`${API_URL}/api/shared-spaces`)
            .then((res) => res.json())
            .then((data) => {
                console.log(data);
                setSharedSpaces(data);
            })
            .catch((err) => {
                console.error(err);
            });
    }, []);

    // HAMDLE CLEAR FILTER
    const handleClearFilters = () => {
        setSearch("");
        setLocation("");
        setCategory("");
        setStatus("");
        setDateFound("");

        setSearchTemp("");
        setLocationTemp("");
        setCategoryTemp("");
        setStatusTemp("");
        setDateFoundTemp("");
    }

    // HAMDLE APPLY FILTER
    const handleApplyFilters = () => {
        setSearch(searchTemp);
        setLocation(locationTemp);
        setCategory(categoryTemp);
        setStatus(statusTemp);
        setDateFound(dateFoundTemp);
    }

    return (
        <>
            <div className="min-h-screen w-full bg-[#F5F5F5] px-5 pt-5 xl:px-10 xl:pt-7 flex flex-col items-center gap-3">

                <div className="flex h-10 w-full ">
                    <div className="flex flex-1 border border-[#DDD9CF]  rounded-md shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)]">
                        <input
                            type="text"
                            placeholder="Search"
                            className="input input-bordered w-full"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="h-full w-fit ml-10 xl:ml-35 flex items-center gap-1 xl:gap-5">
                        <AdminButton icon={Download} label="Export CSV" isBorder={true} isShadow={true} isIcon={true} />
                        <AdminButton icon={QrCode} label="Log via QR" isBorder={true} isShadow={true} isIcon={true} />
                        <AdminButton icon={Plus} label="Log New Item" isSolid={true} isBorder={true} isShadow={true} isIcon={true} onClick={() => { setOpenLogItem(true) }} />
                    </div>
                </div>
                <div className="py-1 px-4 border  border-[#DDD9CF] w-full shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] rounded-md ">

                    <div className="flex w-full h-full gap-2 items-center justify-center">
                        <div className="flex-1">
                            <AdminLocationDropDown placeholder="All Locations" value={locationTemp} onChange={setLocationTemp} options={locations} />
                        </div>
                        <div className="flex-1">
                            <AdminCategoriesDropdown placeholder="All Categories" value={categoryTemp} onChange={setCategoryTemp} options={categories} />
                        </div>
                        <div className="flex-1">
                            <AdminStatusDropDown placeholder="All Status" value={statusTemp} onChange={setStatusTemp} options={statuses} />
                        </div>
                        <div className="flex-1">
                            <AdminDateInput value={dateFoundTemp} onChange={setDateFoundTemp} />
                        </div>
                        <div className="h-full w-fit flex items-center justify-center  ml-20 gap-1">
                            <AdminButton isIcon={false} isSolid={true} label="Apply Filters " isBorder={true} isShadow={true} onClick={handleApplyFilters} />
                            <AdminButton isIcon={false} label="Clear " isBorder={false} isShadow={false} onClick={handleClearFilters} />
                        </div>
                    </div>

                </div>
              <div className="w-full min-w-0">
                  
                    <ItemManagementTable
                        reports={filteredReports}
                        categories={categories}
                        locations={locations}
                        onUpdated={setReports}
                        allLocations={allLocations}
                    />
    
              </div>
            </div>
            {openLogItem &&
                (
                    <>
                        <FoundItemModal
                            open={openLogItem}
                            setOpen={setOpenLogItem}
                            categories={categories}
                            locations={locations}
                            allLocations={allLocations}
                        />
                    </>
                )

            }
        
        </>
    )
}

