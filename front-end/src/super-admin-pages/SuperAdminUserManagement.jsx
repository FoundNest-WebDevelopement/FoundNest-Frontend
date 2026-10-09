import { Download } from "lucide-react"
import { useEffect, useState } from "react";
import Button from "../global-components/Button";
import UserManagmentTable from "../super-admin-components/UserMangementTable";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";
import WebLoading from "../global-components/WebLoading";
import { useLocation, useSearchParams } from "react-router-dom";
import ExportModal from "../global-components/ExportModal";
import AdminDateInput from "../admin-components/AdminDateInput";

const toLocalISODate = (d = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

export default function SuperAdminUserMangement() {

    const API_URL = import.meta.env.VITE_API_URL;

    const today = toLocalISODate();

    const [search, setSearch] = useState("");

    //Redirect states
    const [searchParams] = useSearchParams();
    const useLoc     = useLocation();

    const navigatedUserId = searchParams.get("userId");

    const FILTERS = [
    { label: "All", value: null },
    { label: "Students", value: "user" },
    { label: "Faculty", value: "faculty" },
    { label: "Admins", value: "admin" },
];

    const [activeFilter, setActiveFilter] = useState(FILTERS[0].value);

    const [collegeFilter, setCollegeFilter] = useState("");

    const [statusFilter, setStatusFilter] = useState("");

    const [dateFrom, setDateFrom] = useState("");

    const [dateTo, setDateTo] = useState("");

    const [selectedUser, setSelectedUser] = useState(null);

    const [isExportModalOpen, setIsExportModalOpen] = useState(false);


     const [isExporting, setIsExporting] = useState(null);

    const [users, setUsers] = useState([]);

    const [isLoading, setIsLoading] = useState(false);


 const fetchUsers = async () => {
    try {
        setIsLoading(true);

        const res = await fetchWithAuth(`${API_URL}/api/users`);

        if (!res.ok) {
            throw new Error("Failed to fetch users");
        }

        const data = await res.json();

        setUsers(data);
    } catch (err) {
        console.error("Error fetching users:", err);
    } finally {
        setIsLoading(false);
    }
};

useEffect(() => {
    fetchUsers();
}, []);


    useEffect(() => {
        if (!navigatedUserId || users.length === 0) return;

        const user = users.find(
            u =>
                String(u.user_id) ===
                String(navigatedUserId)
        );

        if (user) {
            setSelectedUser(user);
        }
    }, [navigatedUserId, users,  useLoc.key]);

     const colleges = Array.from(
        new Set(users?.map((u) => u.college_name).filter(Boolean))
    ).sort();

     const filteredUsers= users?.filter((users) => {
            const query = search.toLowerCase();

            const formattedUserId =
  `USR-${String(users.user_id).padStart(5, "0")}`.toLowerCase();

const paddedUserId =
  String(users.user_id).padStart(5, "0");

  const userFullName = users.first_name + " " +  users.last_name;
            const matchesSearch =
                !query ||
                users.first_name?.toLowerCase().includes(query) ||
                users.last_name?.toLowerCase().includes(query) ||
                userFullName?.toLowerCase().includes(query) ||
                paddedUserId.includes(query) ||
                formattedUserId.includes(query) ||
                users.email?.includes(query);

            const matchesRole =
            activeFilter === null ||
            users.user_role === activeFilter;

            const matchesCollege =
            !collegeFilter ||
            users.college_name === collegeFilter;

            const matchesStatus =
            !statusFilter ||
            (statusFilter === "active" ? users.status === true : users.status === false);

            const registeredDate = users.created_at ? toLocalISODate(new Date(users.created_at)) : "";
            const matchesDate =
            (!dateFrom || (registeredDate && registeredDate >= dateFrom)) &&
            (!dateTo || (registeredDate && registeredDate <= dateTo));

            return (
                matchesSearch &&
                matchesRole &&
                matchesCollege &&
                matchesStatus &&
                matchesDate
            );
    });

    const handleClearFilters = () => {
        setSearch("");
        setActiveFilter(FILTERS[0].value);
        setCollegeFilter("");
        setStatusFilter("");
        setDateFrom("");
        setDateTo("");
    };



    

    return (
        <>
            <div className="min-h-screen w-full bg-[#F5F5F5] px-5 pt-5 xl:px-10 xl:pt-7 flex flex-col items-center gap-3 ">

                {!isLoading ? 

                    (
                        <>
                        <div className="flex h-10 w-full ">
                    <div className="xl:w-80 border border-[#DDD9CF]  rounded-md shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)]">
                        <input
                            type="text"
                            placeholder="Search"
                            className="input input-bordered w-full"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}


                        />
                    </div>
                    <div className="flex mx-5 h-full flex-1 justify-center items-center gap-4">
                            {FILTERS.map((filter) => (
                                <button
                                    key={filter.label}
                                    onClick={() => setActiveFilter(filter.value)}
                                    className={`px-4 h-full rounded-full text-xs ${
                                        activeFilter === filter.value
                                            ? "bg-primary text-white"
                                            : "text-black"
                                    }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                            
                    </div>
                    <div className="h-full w-fit  flex items-center gap-1 xl:gap-5 shrink-0">
                        <Button icon={Download} label={isExporting? "Exporting..." : "Export Users"} isBorder={true} isShadow={true} isIcon={true}  disabled={isExporting}
                            onClick={()=>setIsExportModalOpen(true)}
                             />
                    </div>
                </div>

                <div className="bg-white border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.1)] rounded-md px-4 py-3 w-full flex items-center gap-3 flex-wrap">
                    <select
                        value={collegeFilter}
                        onChange={(e) => setCollegeFilter(e.target.value)}
                        className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm text-[#4B2D23] outline-none flex-1 min-w-32"
                    >
                        <option value="">All Colleges</option>
                        {colleges.map((college) => (
                            <option key={college} value={college}>{college}</option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm text-[#4B2D23] outline-none flex-1 min-w-32"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="locked">Locked</option>
                    </select>

                    <div className="text-[#DDD9CF] text-xl font-light select-none">|</div>

                    <div className="flex-1">
                        <AdminDateInput placeholder="Start Date" value={dateFrom} onChange={setDateFrom} max={dateTo || today} />
                    </div>
                    <div className="flex-1">
                        <AdminDateInput placeholder="End Date" value={dateTo} onChange={setDateTo} min={dateFrom || undefined} max={today} />
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                        <button
                            onClick={handleClearFilters}
                            className="text-primary text-sm font-semibold hover:underline cursor-pointer whitespace-nowrap"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                <div className="w-full min-w-0">

                    <UserManagmentTable
                        users={filteredUsers}
                        onUpdated={setUsers}
                        setSelectedUser={setSelectedUser}
                        selectedUser={selectedUser}
                    />

                </div>
                        </>
                    )
                    :
                    (
                            <WebLoading />
                    )

                }
            </div>
           {isExportModalOpen &&
            <ExportModal
                title="Export Users"
                endpoint="/api/export/users"
                filenamePrefix="USERS"
                onClose={() => setIsExportModalOpen(false)}
                onUpdate={fetchUsers}
            />
           }
    
        </>
    );
}

