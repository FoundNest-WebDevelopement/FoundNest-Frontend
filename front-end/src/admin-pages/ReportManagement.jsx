import { useState, useEffect } from "react"
import AdminButton from "../admin-components/AdminButton"
import AdminCategoriesDropdown from "../admin-components/AdminCategoriesDropdown"
import AdminDateInput from "../admin-components/AdminDateInput"
import AdminStatusDropDown from "../admin-components/AdminStatusDropDown"
import { Plus, Download } from "lucide-react"
import { LOST_REPORT_STATUS } from "../constants/lost_item_status";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import LostReportTable from "../admin-components/LostReportTable"
import LostReportModal from "../admin-components/LostReportModal"
import { useNavigate } from "react-router-dom";
import { useSearchParams, useLocation } from "react-router-dom";
import AdminAllLocationDropDown from "../admin-components/AdminAllLocationDropDown"
import WebLoading from "../global-components/WebLoading"
import AdminDropDown from "../admin-components/AdminDropdown"
import ExportModal from "../global-components/ExportModal"



export default function ReportManagement() {


    //API URL
    const API_URL = import.meta.env.VITE_API_URL;
    const userId = localStorage.getItem("user_id");


    //Redirect states
    const [searchParams] = useSearchParams();
    const useLoc = useLocation();

    const [selectedItem, setSelectedItem] = useState(null);

    const navigatedReportId = searchParams.get("reportId");


    //TEMP VARIABLES FILTER STORAGE
    const [searchTemp, setSearchTemp] = useState("");
    const [dateLostTemp, setDateLostTemp] = useState("");
    const [locationTemp, setLocationTemp] = useState("");
    const [categoryTemp, setCategoryTemp] = useState("");
    const [statusTemp, setStatusTemp] = useState("open");
    const [reportTypeTemp, setReportTypeTemp] = useState("All Report");

    //LOG LOST REPORT TOGGLE
    const [openLogItem, setOpenLogItem] = useState(false);
    const [isExportReportOpen, setIsExportReportOpen] = useState(false);

    const [isLoadingReports, setIsLoadingReports] = useState(false);


    //SEARCH AND FILTER VARIABLES 
    const [search, setSearch] = useState("");
    const [dateLost, setDateLost] = useState("");
    const [location, setLocation] = useState("");
    const [category, setCategory] = useState("");
    const [status, setStatus] = useState("open");
    const [reportType, setReportType] = useState("All Report");

    //DROPDOWN LIST
    const statuses = Object.values(LOST_REPORT_STATUS);
    const [categories, setCategories] = useState([]);
    const [gates, setGates] = useState([]);
    const [sharedSpaces, setSharedSpaces] = useState([]);
    const [locations, setLocations] = useState([]);


    //REPORTS
    const [reports, setReports] = useState([]);

    //ALL LOCATIONS

    const allLocations = [


        {
            id: "cant-remember",
            name: "Can't remember",
            type: "unknown",
        },

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

    const REPORT_TYPE = [


        {
            id: "all-report",
            name: "All Report",
            type: "unknown",
        },
        {
            id: "own-report",
            name: "Own Report",
            type: "unknown",
        },
    ]

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


    const getLostReports = async () => {
        setIsLoadingReports(true);

        try {
            const res = await fetchWithAuth(`${API_URL}/api/lost-reports`);

            if (!res.ok) {
                throw new Error("Failed to fetch lost reports");
            }

            const data = await res.json();
            setReports(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching lost reports:", err);
            setReports([]);
        } finally {
            setIsLoadingReports(false);
        }
    };

    useEffect(() => {
        getLostReports();
    }, []);


    useEffect(() => {
        if (!navigatedReportId || reports.length === 0) return;

        const report = reports.find(
            r =>
                String(r.lost_report_id) ===
                String(navigatedReportId)
        );

        if (report) {
            setSelectedItem(report);
        }
    }, [navigatedReportId, reports, useLoc.key]);

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
        setStatus("open");
        setDateLost("");
        setReportType("All Report");

        setSearchTemp("");
        setLocationTemp("");
        setCategoryTemp("");
        setStatusTemp("open");
        setDateLostTemp("");
        setReportTypeTemp("All Report");
    }

    // HAMDLE APPLY FILTER
    const handleApplyFilters = () => {
        setSearch(searchTemp);
        setLocation(locationTemp);
        setCategory(categoryTemp);
        setStatus(statusTemp);
        setDateLost(dateLostTemp);
        setReportType(reportTypeTemp);

    }

    //FILRTER REPORTS
    const filteredReports = reports.filter((report) => {
        const query = search.toLowerCase();



        const formattedReportId =
            `RPT-${String(report.lost_report_id).padStart(5, "0")}`.toLowerCase();

        const paddedReportId =
            String(report.lost_report_id).padStart(5, "0");

        const locationMatch = Array.isArray(report.location_lost)
            ? report.location_lost.some(location =>
                location.toLowerCase().includes(query)
            )
            : report.location_lost?.toLowerCase().includes(query);

        const matchesSearch =
            !query ||
            String(report.lost_report_id).includes(query) ||
            paddedReportId.includes(query) ||
            formattedReportId.includes(query) ||
            report.item_name?.toLowerCase().includes(query) ||
            report.category_name?.toLowerCase().includes(query) ||
            locationMatch ||
            report.reported_by?.toLowerCase().includes(query);

        const matchesCategory =
            !category ||
            String(report.category_id) === String(category);



        const matchesLocation =
            !location ||
            report.location_lost
                ?.toLowerCase()
                .includes(location.toLowerCase());

        const matchesStatus =
            !status ||
            report.status === status;

        const reportDate = new Date(report.lost_date)
            .toISOString()
            .split("T")[0];
        const matchesDate =
            !dateLost || reportDate === dateLost;

        const matchReportType =
            !reportType ||
            reportType === 'All Report' ||
            (reportType === 'Own Report' && String(report.user_id) === String(userId));



        return (
            matchesSearch &&
            matchesCategory &&
            matchesLocation &&
            matchesDate &&
            matchesStatus &&
            matchReportType
        );
    });


    const handleExportCSV = async () => {
        try {


            const response = await fetchWithAuth(
                `${API_URL}/api/lost-reports/export/csv`
            );

            if (!response.ok) {
                throw new Error("Failed to export CSV");
            }

            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `lost-reports-${new Date().toISOString().split("T")[0]
                }.csv`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error(error);
            alert("Failed to export CSV");
        }
    };






    return (

        <>
            <div className="min-h-screen w-full bg-[#F5F5F5] px-5 pt-5 xl:px-10 xl:pt-7 flex flex-col items-center gap-3">

                {!isLoadingReports ? (
                    <>
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
                                <AdminButton icon={Download} label="Export CSV" isBorder={true} isShadow={true} isIcon={true}
                                    onClick={() => setIsExportReportOpen(true)} />
                                <AdminButton icon={Plus} label="New Report" isSolid={true} isBorder={true} isShadow={true} isIcon={true}
                                    onClick={() => setOpenLogItem(true)} />
                            </div>
                        </div>
                        <div className="py-1 px-4 border  border-[#DDD9CF] w-full shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] rounded-md ">

                            <div className="flex w-full h-full gap-2 items-center justify-center">
                                <div className="flex-1">
                                    <AdminAllLocationDropDown placeholder="All Locations" value={locationTemp} onChange={setLocationTemp} options={allLocations} hidePlaceholder={false} />
                                </div>
                                <div className="flex-1">
                                    <AdminCategoriesDropdown placeholder="All Categories" value={categoryTemp} onChange={setCategoryTemp} options={categories} />
                                </div>
                                <div className="flex-1">
                                    <AdminStatusDropDown placeholder="All Status" value={statusTemp} onChange={setStatusTemp} options={statuses} />
                                </div>
                                <div className="flex-1">
                                    <AdminDropDown placeholder="All Location" value={reportTypeTemp} onChange={setReportTypeTemp} options={REPORT_TYPE} />
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

                            <LostReportTable
                                reports={filteredReports}
                                onUpdated={setReports}
                                setSelectedItem={setSelectedItem}
                                selectedItem={selectedItem}
                                categories={categories}
                                sharedSpaces={sharedSpaces}
                                gates={gates}
                                locations={locations}
                            />

                        </div>
                    </>
                )
                    :
                    (
                        <>
                            <WebLoading />
                        </>
                    )

                }
            </div>
            {openLogItem &&
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
                            onUpdated={setReports}
                            setSelectedItem={setSelectedItem}
                        />
                    </>
                )
            }

            {isExportReportOpen &&
                <ExportModal
                    title="Export Lost Reports"
                    endpoint="/api/export/lost-reports"
                    filenamePrefix="LOST_REPORTS"
                    onClose={() => setIsExportReportOpen(false)}
                  onUpdate={getLostReports}
                />
            }
        </>

    )
}