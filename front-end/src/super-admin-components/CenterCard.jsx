export default function CenterCard({ center, onEdit, onViewAdmins }) {
    const formatCtrId = (id) => {
        return `CTR-${String(id).padStart(3, "0")}`;
    };

    const formatActiveSince = (dateStr) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <div className="bg-white rounded-lg border border-[#E5E1D8] shadow-[0_2px_6px_0px_rgba(0,0,0,0.06)] p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <img
                        src={center.image_url || "/default-office.png"}
                        alt={center.office_name}
                        className="w-12 h-12 rounded-full object-cover border border-[#E5E1D8]"
                    />
                    <div>
                        <p className="font-semibold text-base text-[#1A1208]">{center.office_name}</p>
                        <p className="text-xs text-[#9A8F7C]">{formatCtrId(center.office_id)}</p>
                    </div>
                </div>

                <span
                    className={`px-3 py-1 rounded-full text-xs font-medium
                        ${center.status === true && "bg-green-100 text-green-700"}
                        ${center.status == false && "bg-gray-200 text-gray-700"}
                    `}
                >
                    {center.status === true && "Active"}
                    {center.status === false && "Inactive"}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                    <p className="text-xs text-[#9A8F7C]">Location</p>
                    <p className="text-[#1A1208]">{center.location_name || "N/A"}</p>
                </div>
                <div>
                    <p className="text-xs text-[#9A8F7C]">Active Since</p>
                    <p className="text-[#1A1208]">{formatActiveSince(center.created_at)}</p>
                </div>
                <div>
                    <p className="text-xs text-[#9A8F7C]">Location Description</p>
                    <p className="text-[#1A1208]">{center.floor || "N/A"}</p>
                </div>
                <div>
                    <p className="text-xs text-[#9A8F7C]">No. of Admins</p>
                    <p className="text-[#1A1208]">{center.admin_count ?? 0}</p>
                </div>
            </div>

            <div>
                <p className="text-xs text-[#9A8F7C]">Operating Hours</p>
                <p className="text-sm text-[#1A1208]">{center.operating_hours || "N/A"}</p>
            </div>

            <hr className="border-(--color-tertiary) opacity-30" />

            <div className="flex gap-2">
                <button
                    type="button"
                    className="flex-1 h-9 bg-white border border-primary rounded-md text-primary text-sm font-medium
                        transition-transform duration-100 active:scale-95"
                    onClick={() => onViewAdmins(center)}
                >
                    View Admins
                </button>
                <button
                    type="button"
                    className="flex-1 h-9 bg-white border border-primary rounded-md text-primary text-sm font-medium
                        transition-transform duration-100 active:scale-95"
                    onClick={() => onEdit(center)}
                >
                    Edit Center
                </button>
            </div>
        </div>
    );
}