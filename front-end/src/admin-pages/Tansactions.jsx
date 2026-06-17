import { useState, useEffect } from "react"
import AdminButton from "../admin-components/AdminButton"
import AdminCategoriesDropdown from "../admin-components/AdminCategoriesDropdown"
import AdminDateInput from "../admin-components/AdminDateInput"
import AdminLocationDropDown from "../admin-components/AdminLocationDropDown"
import AdminStatusDropDown from "../admin-components/AdminStatusDropDown"
import { Plus, Download } from "lucide-react"
import { fetchWithAuth } from "../utils/fetchWithAuth";
import TransactionTable from "../admin-components/TransactionTable"



export default function Transactions() {
    //API URL
    const API_URL = import.meta.env.VITE_API_URL;

    const statuses = [
  { label: "Completed", value: true },
  { label: "Reverted", value: false }
];

    //TEMP VARIABLES FILTER STORAGE
    const [searchTemp, setSearchTemp] = useState("");
    const [dateLostTemp, setDateLostTemp] = useState("");
    const [locationTemp, setLocationTemp] = useState("");
    const [categoryTemp, setCategoryTemp] = useState("");
    const [statusTemp, setStatusTemp] = useState("");

    //LOG LOST REPORT TOGGLE
    const [openLogItem, setOpenLogItem] = useState(false);

    //SEARCH AND FILTER VARIABLES 
    const [search, setSearch] = useState("");
    const [dateLost, setDateLost] = useState("");
    const [location, setLocation] = useState("");
    const [category, setCategory] = useState("");
    const [status, setStatus] = useState("");

    //DROPDOWN LIST
    const [categories, setCategories] = useState([]);
    const [gates, setGates] = useState([]);
    const [sharedSpaces, setSharedSpaces] = useState([]);
    const [locations, setLocations] = useState([]);

    //CLAIM RECORDS
    const [records, setRecords] = useState([]);

    //CAEGORIES FETCH
    useEffect(() => {
        fetch(`${API_URL}/api/categories`)
            .then((res) => res.json())
            .then((data) => {
                setCategories(data);
            })
            .catch((err) => {
                console.error(err);
            });
    }, []);
    //  Claim Records  FETCH
    useEffect(() => {
        fetchWithAuth(`${API_URL}/api/claim-records`)
            .then((res) => res.json())
            .then((data) => {
                setRecords(data);
                console.log(data);
            })
            .catch((err) => {
                console.error(err);
            });
    }, []);
    //OFFICES FETCH
    useEffect(() => {
        fetch(`${API_URL}/api/offices`)
            .then((res) => res.json())
            .then((data) => {
                setLocations(data);
            })
            .catch((err) => {
                console.error(err);
            });
    }, []);
    //GATES FETCH
    useEffect(() => {
        fetch(`${API_URL}/api/gates`)
            .then((res) => res.json())
            .then((data) => {
                setGates(data);
            })
            .catch((err) => {
                console.error(err);
            });
    }, []);
    //SHARED SPACES FETCH
    useEffect(() => {
        fetch(`${API_URL}/api/shared-spaces`)
            .then((res) => res.json())
            .then((data) => {
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
        setDateLost("");

        setSearchTemp("");
        setLocationTemp("");
        setCategoryTemp("");
        setStatusTemp("");
        setDateLostTemp("");
    }

    // HAMDLE APPLY FILTER
    const handleApplyFilters = () => {
        setSearch(searchTemp);
        setLocation(locationTemp);
        setCategory(categoryTemp);
        setStatus(statusTemp);
        setDateLost(dateLostTemp);
    }

      //CAEGORIES FETCH
            useEffect(() => {
                    fetch(`${API_URL}/api/categories`)
                        .then((res) => res.json())
                        .then((data) => {
                            setCategories(data);
                        })
                        .catch((err) => {
                            console.error(err);
                        });
                }, []);

    //  //FILRTER RECORDS
    //     const filteredRecords = records.filter((records) => {
    //         const query = search.toLowerCase();

    //         const locationMatch = Array.isArray(records.location_lost)
    //         ? records.location_lost.some(location =>
    //             location.toLowerCase().includes(query)
    //             )
    //         : records.location_lost?.toLowerCase().includes(query);

    //         const matchesSearch =
    //             !query ||
    //             records.item_name?.toLowerCase().includes(query) ||
    //             records.category_name?.toLowerCase().includes(query) ||
    //             locationMatch ||
    //             records.reported_by?.toLowerCase().includes(query);

    //         const matchesCategory =
    //             !category ||
    //             String(records.category_id) === String(category);

    //         const matchesLocation =
    //             !location ||
    //             String(records.office_id) === String(location);

    //         const matchesStatus =
    //             !status ||
    //             records.status === status;
                
    //         const reportDate = new Date(records.lost_date)
    //             .toISOString()
    //             .split("T")[0];
    //         const matchesDate =
    //             !dateLost || reportDate === dateLost;


    //         return (
    //             matchesSearch &&
    //             matchesCategory &&
    //             matchesLocation &&
    //             matchesDate &&
    //             matchesStatus
    //         );
    // });


    return (

        <>
            <div className="min-h-screen w-full bg-[#F5F5F5] px-5 pt-5 xl:px-10 xl:pt-7 flex flex-col items-center gap-3">
                <div className="flex h-10 w-full gap-2 ">
                 
                    <div className="flex flex-1 border border-[#DDD9CF]  rounded-md shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] ">
                        <input
                            type="text"
                            placeholder="Search by TXN ID, claimant, or item name..."
                            className="input input-bordered w-full"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}


                        />
                        
                    </div>
                    <div className="h-full w-fit ml-40 xl:ml-60 flex items-center  ">
                                            <AdminButton icon={Download} label="Export CSV" isBorder={true} isShadow={true} isIcon={true} 
                                            />
                
                                        </div>

                </div>
                <div className="py-1 px-4 border  border-[#DDD9CF] w-full shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] rounded-md ">

                    <div className="flex w-full h-full gap-2 items-center justify-center">
                           <div className="flex-1">
                            <AdminStatusDropDown placeholder="All Status" value={statusTemp} onChange={setStatusTemp} options={statuses}/>
                        </div>
                        <div className="flex-1">
                            <AdminCategoriesDropdown placeholder="All Categories" value={categoryTemp} onChange={setCategoryTemp} options={categories} />
                        </div>
                     
                        <div className="flex-1">
                            <AdminDateInput value={dateLostTemp} onChange={setDateLostTemp} />
                        </div>
                        <div className="h-full w-fit flex items-center justify-center  ml-20 gap-1">
                            <AdminButton isIcon={false} isSolid={true} label="Apply Filters " isBorder={true} isShadow={true} onClick={handleApplyFilters} />
                            <AdminButton isIcon={false} label="Clear " isBorder={false} isShadow={false} onClick={handleClearFilters} />
                        </div>
                    </div>

                </div>
                <div className="w-full min-w-0">


                    <TransactionTable
                    reports={records}
                    onUpdated={setRecords}
                />

                </div>
            </div>
            {/* {openLogItem &&
                (
                    <>
                        <LostReportModal
                        open={openLogItem}
                        setOpen={setOpenLogItem}
                        categories={categories}
                        locations={locations}
                        allLocations={allLocations}
                        sharedSpaces={sharedSpaces}
                        gates={gates}
                        setOpen={setOpenLogItem}
                        onUpdated={setReports}
                        />
                    </>
                )

            } */}

        </>

    )
}