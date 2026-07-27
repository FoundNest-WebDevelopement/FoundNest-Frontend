import { Download } from "lucide-react"
import { useEffect, useState } from "react";
import Button from "../global-components/Button";
import UserManagmentTable from "../super-admin-components/UserMangementTable";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";
import WebLoading from "../global-components/WebLoading";
import { useLocation, useSearchParams } from "react-router-dom";



export default function SuperAdminUserMangement() {

    const API_URL = import.meta.env.VITE_API_URL;

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

    const [selectedUser, setSelectedUser] = useState(null);

    const [openExportActivity, setPpenExportActivity] = useState(false);

     const [isExporting, setIsExporting] = useState(null);

    const [users, setUsers] = useState([]);

    const [isLoading, setIsLoading] = useState(false);


     useEffect(() => {
        setIsLoading(true);
        fetchWithAuth(`${API_URL}/api/users`)
            .then((res) => res.json())
            .then((data) => {
                setUsers(data);
                setIsLoading(false);
            })
            .catch((err) => {
                console.error(err);
            });
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
            return (
                matchesSearch &&
                matchesRole 
            );
    });

    const handleExportCSV = async () => {
    try {
        setIsExporting(true);
        const response = await fetchWithAuth(`${API_URL}/api/export/users`);

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Failed to export users.");
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `USERS - ${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("User exported successfully.");
    } catch (error) {
        console.error(error);
        toast.error(error.message);
    }finally{
        setIsExporting(false);
    }
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
                            onClick={handleExportCSV}
                             />
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
                        <>
                            <WebLoading
                              
                            />
                            
                        </>
                    )

                }
            </div>
           {/* {openExportActivity &&
                           <ConfirmDialog
                               title="Export Activity Log"
                               Icon={Download}
                               iconColor="text-primary"
                               description={
                                   <>
                                       Export the activity log for <span className="font-bold">{fullName}</span> ({formatUsrId(selectedUser.user_id)}) as a CSV file?
                                   </>
                               }
                               confirmText={isExporting ? "Exporting..." : "Export"}
                               cancelText="Cancel"
                               onClose={() => setOpenExportActivity(false)}
                               onConfirm={handleExportActivity}
                               disabled={isExporting}
                           />
                       } */}
        </>
    );
}

