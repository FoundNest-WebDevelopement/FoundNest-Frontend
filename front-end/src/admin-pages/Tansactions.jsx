import { useState, useEffect } from "react"
import AdminButton from "../admin-components/AdminButton"
import AdminCategoriesDropdown from "../admin-components/AdminCategoriesDropdown"
import AdminDateInput from "../admin-components/AdminDateInput"
import AdminLocationDropDown from "../admin-components/AdminLocationDropDown"
import AdminStatusDropDown from "../admin-components/AdminStatusDropDown"
import { Plus, Download } from "lucide-react"
import { fetchWithAuth } from "../utils/fetchWithAuth";
import TransactionTable from "../admin-components/TransactionTable"
import { useSearchParams, useLocation } from "react-router-dom";
import WebLoading from "../global-components/WebLoading"
import ExportModal from "../global-components/ExportModal"



export default function Transactions() {
    //API URL
    const API_URL = import.meta.env.VITE_API_URL;

    const userId = localStorage.getItem("user_id");
    
    //SEARCH PARAMS
    const [searchParams] = useSearchParams();
    const useLoc     = useLocation();
    const navigatedClaimId = searchParams.get("claimId");

    const statuses = [
  { label: "Completed", value: true },
  { label: "Reverted", value: false }
];

        //Record State
    const [selectedRecord, setSelectedRecord] = useState(null);

        const [isExportTransactionOpen, setIsExportTransactionOpen] = useState(false);

    //TEMP VARIABLES FILTER STORAGE
    const [searchTemp, setSearchTemp] = useState("");
    const [dateClaimedTemp, setDateClaimedTemp] = useState("");
    const [locationTemp, setLocationTemp] = useState("");
    const [categoryTemp, setCategoryTemp] = useState("");
    const [statusTemp, setStatusTemp] = useState("true");

    //LOG LOST REPORT TOGGLE
    const [openLogItem, setOpenLogItem] = useState(false);

    const [isLoadingTxn, setIsLoadingTxn] = useState(false);

    //SEARCH AND FILTER VARIABLES 
    const [search, setSearch] = useState("");
    const [dateClaimed, setDateClaimed] = useState("");
    const [location, setLocation] = useState("");
    const [category, setCategory] = useState("");
    const [status, setStatus] = useState("true");

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
    const getClaimRecords = async () => {
    setIsLoadingTxn(true);

    try {
        const res = await fetchWithAuth(`${API_URL}/api/claim-records`);
        const data = await res.json();

        setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
        console.error("Error fetching claim records:", err);
        setRecords([]);
    } finally {
        setIsLoadingTxn(false);
    }
};

useEffect(() => {
    getClaimRecords();
}, []);
    //Handle Navigated Transaction
    useEffect(() => {
        if (!navigatedClaimId || records.length === 0) return;

        const selectedTransaction  = records.find(
            c =>
                String(c.claim_id) ===
                String(navigatedClaimId)
        );

        if (selectedTransaction ) {
            setSelectedRecord(selectedTransaction );
        }
    }, [navigatedClaimId, records, useLoc.key]);
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
        setDateClaimed("");

        setSearchTemp("");
        setLocationTemp("");
        setCategoryTemp("");
        setStatusTemp("true");
        setDateClaimedTemp("");
    }

    // HAMDLE APPLY FILTER
    const handleApplyFilters = () => {
        setSearch(searchTemp);
        setLocation(locationTemp);
        setCategory(categoryTemp);
        setStatus(statusTemp);
        setDateClaimed(dateClaimedTemp);
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

     //FILRTER RECORDS
        const filteredRecords = records.filter((records) => {
            const query = search.toLowerCase();

            const formattedClaimId =
  `TXN-${String(records.claim_id).padStart(5, "0")}`.toLowerCase();

const paddedClaimId =
  String(records.claim_id).padStart(5, "0");

            const matchesSearch =
                !query ||
                records.item_name?.toLowerCase().includes(query) ||
                paddedClaimId.includes(query) ||
                formattedClaimId.includes(query) ||
                records.category_name?.toLowerCase().includes(query) ||
                records.processed_by?.toLowerCase().includes(query);

            const matchesCategory =
                !category ||
                String(records.category_id ) === String(category);

            const matchesLocation =
                !location ||
                String(records.office_id) === String(location);

            const matchesStatus =
            !status ||
            records.claimant_status === (status === "true");

                
            const claimDate = new Date(records.claim_date)
                .toISOString()
                .split("T")[0];
            const matchesDate =
                !dateClaimed || claimDate === dateClaimed;


            return (
                matchesSearch &&
                matchesCategory &&
                matchesDate &&
                matchesStatus
            );
    });

    //HANDLE EXPORT CSV
    const handleExportTransactions = async () => {
  const token = localStorage.getItem("token");

  const response = await fetchWithAuth(
    `${API_URL}/api/export/transactions/csv`
  );

  const blob = await response.blob();

  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "transactions.csv";
  document.body.appendChild(a);
  a.click();

  a.remove();
  window.URL.revokeObjectURL(url);
};


    return (

        <>
            <div className="min-h-screen w-full bg-[#F5F5F5] px-5 pt-5 xl:px-10 xl:pt-7 flex flex-col items-center gap-3">
                {!isLoadingTxn? 
                    (
                        <>
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
                                            onClick={()=>setIsExportTransactionOpen(true)}
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
                            <AdminDateInput value={dateClaimedTemp} onChange={setDateClaimedTemp} />
                        </div>
                        <div className="h-full w-fit flex items-center justify-center  ml-20 gap-1">
                            <AdminButton isIcon={false} isSolid={true} label="Apply Filters " isBorder={true} isShadow={true} onClick={handleApplyFilters} />
                            <AdminButton isIcon={false} label="Clear " isBorder={false} isShadow={false} onClick={handleClearFilters} />
                        </div>
                    </div>

                </div>
                <div className="w-full min-w-0">


                    <TransactionTable
                    reports={filteredRecords}
                    onUpdated={setRecords}
                    setSelectedRecord={setSelectedRecord}
                    selectedRecord={selectedRecord}
                />

                </div>
                        </>
                    )
                    :
                    (
                        <>
                        <WebLoading/>
                        </>
                    )

                }
            </div>
            
                {isExportTransactionOpen &&
                                <ExportModal
                                    title="Export Transactions"
                                    endpoint="/api/export/transactions"
                                    filenamePrefix="TRANSACTIONS"
                                    onClose={() => setIsExportTransactionOpen(false)}
                                  onUpdate={getClaimRecords}
                                  queryParams={{userId}}
                                />
                            }
        </>

    )
}