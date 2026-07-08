import { useState, useEffect } from "react";
import { MoreVertical, UserCircle2, Search } from "lucide-react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";
import formatDate from "../utils/formatDate";
import ConfirmDialog from "../global-components/ConfirmDialog";

export default function ViewAdminsModal({ center, onClose }) {
  const API_URL = import.meta.env.VITE_API_URL;

  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);

  const [openAddAdmin, setOpenAddAdmin] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);

  const [confirmAssignUser, setConfirmAssignUser] = useState(null);
  const [confirmRevokeAdmin, setConfirmRevokeAdmin] = useState(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const loadAdmins = async () => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth(
        `${API_URL}/api/offices/${center.office_id}/profile`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch admins.");
      }

      setAdmins(data.admins || []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to load admins.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, [center.office_id]);

  const loadAllUsers = async () => {
    try {
      const response = await fetchWithAuth(`${API_URL}/api/users`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch users.");
      }

      setAllUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to load users.");
    }
  };

  const handleOpenAddAdmin = () => {
    setOpenAddAdmin(true);
    setUserSearch("");
    setSelectedUser(null);
    loadAllUsers();
  };

  const eligibleUsers = allUsers.filter((u) => {
    if (u.user_role === "admin" || u.user_role === "super_admin") return false;

    const query = userSearch.toLowerCase();
    const fullName = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();

    return (
      fullName.includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.student_number?.toLowerCase().includes(query)
    );
  });

  const handleAssignAdmin = async () => {
    if (!selectedUser) return;

    try {
      setIsAssigning(true);

      const response = await fetchWithAuth(
        `${API_URL}/api/users/${selectedUser.user_id}/role`,
        {
          method: "PUT",
          body: JSON.stringify({
            role: "admin",
            officeLocation: center.office_id,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to assign admin.");
      }

      toast.success(
        `${selectedUser.first_name} ${selectedUser.last_name} is now an admin of ${center.office_name}.`,
      );

      setConfirmAssignUser(null);
      setOpenAddAdmin(false);
      setSelectedUser(null);
      await loadAdmins();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to assign admin.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRevokeAdmin = async (admin) => {
    try {
      setIsRevoking(true);

      const response = await fetchWithAuth(
        `${API_URL}/api/users/${admin.user_id}/role`,
        {
          method: "PUT",
          body: JSON.stringify({
            role: "user",
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to revoke admin.");
      }

      toast.success(
        `Revoked admin access for ${admin.first_name} ${admin.last_name}.`,
      );
      setConfirmRevokeAdmin(null);
      await loadAdmins();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to revoke admin.");
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-end z-1040">
        <div className="relative bg-white h-full w-full max-w-md flex flex-col">
          <div className="w-full h-14 bg-primary text-white flex items-center justify-between px-5 shrink-0">
            <p className="font-semibold text-base">
              {center.office_name} Admins
            </p>
            <button onClick={onClose}>
              <i className="fa-solid fa-x text-sm text-white" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
            {isLoading && (
              <p className="text-sm text-[#6B5C42] text-center py-10">
                Loading admins...
              </p>
            )}

            {!isLoading && admins.length === 0 && (
              <p className="text-sm text-[#6B5C42] text-center py-10">
                No admins assigned to this center yet.
              </p>
            )}

            {!isLoading &&
              admins.map((admin, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-[#E5E1D8] last:border-none"
                >
                  <div className="flex items-center gap-3">
                    <UserCircle2
                      size={36}
                      className="text-[#1A1208]"
                      strokeWidth={1.5}
                    />
                    <div>
                      <p className="text-sm font-semibold text-primary">
                        {admin.first_name} {admin.last_name}
                      </p>
                      <p className="text-xs text-[#9A8F7C]">
                        Assigned{" "}
                        {admin.date_assigned
                          ? formatDate(admin.date_assigned)
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 relative">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Active
                    </span>
                    <button
                      onClick={() =>
                        setOpenMenuIndex((prev) =>
                          prev === index ? null : index,
                        )
                      }
                    >
                      <MoreVertical size={16} className="text-[#6B5C42]" />
                    </button>

                    {openMenuIndex === index && (
                      <div className="absolute right-0 top-6 bg-white border border-[#DDD9CF] rounded-md shadow-md text-sm z-10 w-36">
                        <button
                          className="w-full text-left px-3 py-2 text-[#C0392B] hover:bg-[#F5F5F5]"
                          onClick={() => {
                            setOpenMenuIndex(null);
                            setConfirmRevokeAdmin(admin);
                          }}
                        >
                          Revoke Admin
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>

          <div className="p-4 border-t border-[#E5E1D8] flex flex-col gap-2 shrink-0">
            <button
              type="button"
              className="w-full h-10 bg-primary rounded-lg text-white text-sm font-medium transition-transform duration-100 active:scale-95"
              onClick={handleOpenAddAdmin}
            >
              + Add Admin
            </button>
            <button
              type="button"
              className="w-full h-10 bg-white border border-primary rounded-lg text-primary text-sm font-medium transition-transform duration-100 active:scale-95"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {openAddAdmin && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-1050">
          <div className="relative bg-white rounded-lg w-100 max-w-[90vw] flex flex-col max-h-[80vh]">
            <div className="w-full h-10 rounded-t-lg bg-primary text-white flex items-center justify-between px-5 shrink-0">
              <p className="font-semibold">Add Admin</p>
              <button onClick={() => setOpenAddAdmin(false)}>
                <i className="fa-solid fa-x text-sm text-white" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3 overflow-hidden flex-1">
              <div className="flex items-center gap-2 bg-white border border-[#DDD9CF] rounded-lg px-3 py-2">
                <Search size={16} className="text-[#9A8F7C]" />
                <input
                  type="text"
                  placeholder="Search by name, email, or student no..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full text-sm outline-none placeholder:text-[#9A8F7C]"
                />
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col gap-1">
                {eligibleUsers.length === 0 && (
                  <p className="text-sm text-[#6B5C42] text-center py-8">
                    No matching users found.
                  </p>
                )}

                {eligibleUsers.map((u) => (
                  <button
                    key={u.user_id}
                    type="button"
                    onClick={() => setSelectedUser(u)}
                    className={`flex items-center justify-between text-left px-3 py-2 rounded-md border
                                            ${
                                              selectedUser?.user_id ===
                                              u.user_id
                                                ? "border-primary bg-[#FBEFE9]"
                                                : "border-transparent hover:bg-[#F5F5F5]"
                                            }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-[#1A1208]">
                        {u.first_name} {u.last_name}
                      </p>
                      <p className="text-xs text-[#9A8F7C]">{u.email}</p>
                    </div>
                    {selectedUser?.user_id === u.user_id && (
                      <span className="text-xs text-primary font-medium">
                        Selected
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 pt-2 flex gap-2 shrink-0">
              <button
                type="button"
                className="flex-1 h-10 bg-white border border-primary rounded-lg text-primary text-sm font-medium
                                    transition-transform duration-100 active:scale-95"
                onClick={() => setOpenAddAdmin(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 h-10 bg-primary rounded-lg text-white text-sm font-medium
        transition-transform duration-100 enabled:active:scale-95
        disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={!selectedUser}
                onClick={() => {
                  setConfirmAssignUser(selectedUser);
                  setOpenAddAdmin(false);
                }}
              >
                Assign as Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmAssignUser && (
        <ConfirmDialog
          title="Confirm Assign Admin"
          cancelText="Cancel"
          confirmText={isAssigning ? "Assigning..." : "Confirm"}
          description={
            <>
              Assign{" "}
              <span className="font-semibold">
                {confirmAssignUser.first_name} {confirmAssignUser.last_name}
              </span>{" "}
              as admin of{" "}
              <span className="font-semibold">{center.office_name}</span>?
            </>
          }
          onClose={() => setConfirmAssignUser(null)}
          onConfirm={handleAssignAdmin}
        />
      )}

      {confirmRevokeAdmin && (
        <ConfirmDialog
          title="Confirm Revoke Admin"
          cancelText="Cancel"
          confirmText={isRevoking ? "Revoking..." : "Revoke"}
          description={
            <>
              Revoke admin access for{" "}
              <span className="font-semibold">
                {confirmRevokeAdmin.first_name} {confirmRevokeAdmin.last_name}
              </span>
              ?
            </>
          }
          onClose={() => setConfirmRevokeAdmin(null)}
          onConfirm={() => handleRevokeAdmin(confirmRevokeAdmin)}
        />
      )}
    </>
  );
}
