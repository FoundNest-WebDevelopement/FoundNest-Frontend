import { Pencil } from "lucide-react";
import { useState } from "react";
import UserManagementModal from "./UserManagementModal";

export default function UserManagmentTable (
    {
         users,
    onUpdated,
    selectedUser,
    setSelectedUser,
    }
) {

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;
    const safeUsers = Array.isArray(users) ? users : [];
    const totalPages = Math.max(1, Math.ceil(safeUsers.length / itemsPerPage));
    const activePage = Math.min(currentPage, totalPages);
    const startIndex = (activePage - 1) * itemsPerPage;
    const paginatedUsers = safeUsers.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    const formatUsrId = (id) => {
    return `USR-${String(id).padStart(5, "0")}`;
  };
    
    return (
        <>
            <div className="h-fit w-full max-w-full min-w-0 min-h-115 rounded-t-xl bg-white border border-[#DDD9CF] shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden">
                <div className="w-full min-w-0 overflow-x-auto overflow-y-hidden bg-white shadow-sm">

                    <table className="table table-zebra table-sm min-w-295 [&_th]:px-2 [&_td]:px-2 text-center">

                        <thead className="bg-primary text-white text-center">
                            <tr>
                                <th className="w-5"></th>
                                <th className="w-20">USER ID</th>
                                <th className="w-48">FULL NAME</th>
                                <th className="w-32">ROLE</th>
                                <th className="w-32">BULSU EMAIL</th>
                                <th className="w-32">DATE REGISTERED</th>
                                <th className="w-37">STATUS</th>
                                <th className="w-24">ACTIONS</th>
                            </tr>
                        </thead>

                        <tbody>
                            {paginatedUsers?.map((usr, index) => (
                                <tr
                                    key={usr.user_id}
                                    className={
                                        index % 2 === 0
                                            ? "bg-white"
                                            : "bg-[#F5F5F5]"
                                    }
                                >

                                    <td className="align-middle h-15">{startIndex + index + 1}</td>

                                    <td className="w-28 align-middle text-center">{formatUsrId(usr.user_id)}</td>

                    

                                    <td className="truncate max-w-48 align-middle text-center">{usr.first_name? usr.first_name + " " + usr.last_name : "N/A"}</td>

                                    <td className="align-middle text-center">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium 
                                        ${usr.user_role === 'user' && "bg-[#E6F1FB] text-[#2980B9]" }
                                        ${usr.user_role == 'faculty' && "bg-gray-200 text-gray-700"}
                                        ${usr.user_role == 'admin' && "bg-[#FFF3CD] text-[#856404]"}
                                        ${usr.user_role == 'super_admin' && "bg-[#EDE7F6] text-[#6A1B9A]"}
                                    
                
                                        `}
                                        >
                                        {usr.user_role === 'user' && "Student"}
                                        {usr.user_role === 'faculty' && "Faculty"}
                                        {usr.user_role === 'admin' && "Admin"}
                                        {usr.user_role === 'super_admin' && "Super Admin"}
        
                                        </span>
                                    </td>

                                    <td className="truncate max-w-48 align-middle text-center">{usr.email}</td>


                                    <td className="align-middle text-center bg-re"> {new Date(usr.created_at).toLocaleDateString()}</td>

                                    <td className="align-middle text-center">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium 
                                        ${usr.status === true && "bg-green-100 text-green-700" }
                                        ${usr.status == false && "bg-gray-200 text-gray-700"}
                                    
                
                                        `}
                                        >
                                        {usr.status === true && "Active"}
                                            {usr.status === false && "Locked"}
            
                                        </span>
                                    </td>

                                    <td className="align-middle text-center">
                                        <button className=" btn-sm btn-square  text-white border-none cursor-pointer transition-transform duration-100
                                     active:scale-95 disabled:opacity-20 "
                                            disabled={usr.user_role === 'super_admin'}
                                            onClick={() => { setSelectedUser(usr)}}
                                        > 
                                            <Pencil size={18} className="text-primary" />                       
                                        </button>
                                    </td>

                                </tr>
                            ))}
                            {paginatedUsers.length === 0 && (
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
                    Showing {safeUsers.length === 0 ? 0 : startIndex + 1}
                    {" - "}
                    {Math.min(startIndex + itemsPerPage, safeUsers.length)}
                    {" of "}
                    {safeUsers.length}
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

          
            

            {selectedUser &&
                (
                    <UserManagementModal
                    selectedUser={selectedUser}
                    setSelectedUser={setSelectedUser}
                    onUpdated={onUpdated}
                     />
                )

            }
        </>
    )
}