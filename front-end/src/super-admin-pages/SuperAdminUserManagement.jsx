import { Download } from "lucide-react"
import { useEffect, useState } from "react";
import Button from "../global-components/Button";
import UserManagmentTable from "../super-admin-components/UserMangementTable";
import { fetchWithAuth } from "../utils/fetchWithAuth";



export default function SuperAdminUserMangement() {

    const API_URL = import.meta.env.VITE_API_URL;

    const [search, setSearch] = useState("");

    const FILTERS = [
    { label: "All", value: null },
    { label: "Students", value: "user" },
    { label: "Faculty", value: "faculty" },
    { label: "Admins", value: "admin" },
];

    const [activeFilter, setActiveFilter] = useState(FILTERS[0].value);

    const [selectedUser, setSelecterUser] = useState(null);

    const [users, setUsers] = useState([]);


     useEffect(() => {
        fetchWithAuth(`${API_URL}/api/users`)
            .then((res) => res.json())
            .then((data) => {
                setUsers(data);
                console.log(data);
            })
            .catch((err) => {
                console.error(err);
            });
    }, []);

     const filteredUsers= users.filter((users) => {
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

            // const matchesLocation =
            //     !location ||
            //     String(records.office_id) === String(location);

            // const matchesStatus =
            // !status ||
            // records.claimant_status === (status === "true");

                
            // const claimDate = new Date(records.claim_date)
            //     .toISOString()
            //     .split("T")[0];
            // const matchesDate =
            //     !dateClaimed || claimDate === dateClaimed;


            return (
                matchesSearch &&
                matchesRole 
            );
    });

    

    return (
        <>
            <div className="min-h-screen w-full bg-[#F5F5F5] px-5 pt-5 xl:px-10 xl:pt-7 flex flex-col items-center gap-3">

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
                    <div className="h-full w-fit  flex items-center gap-1 xl:gap-5">
                        <Button icon={Download} label="Export Users" isBorder={true} isShadow={true} isIcon={true} 
                            // onClick={handleExportCSV}
                             />
                    </div>
                </div>

                <div className="w-full min-w-0">

                    <UserManagmentTable
                        users={filteredUsers}
                        onUpdated={setUsers}
                        setSelectedUser={setSelecterUser}
                        selectedUser={selectedUser}
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
                            setSelectedItem={setSelectedItem}
                        />
                    </>
                )

            } */}
        </>
    );
}

