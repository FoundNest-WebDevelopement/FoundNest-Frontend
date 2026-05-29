import { useState } from "react"
import { Pencil, X } from "lucide-react"

// const data = [
//     {
//         id: "FN-001",
//         photo: "https://placehold.co/100x100",
//         itemName: "iPhone 13",
//         category: "Electronics",
//         location: "Library",
//         dateFound: "May 20, 2026",
//         status: "unclaimed",
//         linkedReport: "LR-101",
//         reportedBy: "Juan Dela Cruz"
//     },
//     {
//         id: "FN-002",
//         photo: "https://placehold.co/100x100",
//         itemName: "Black Backpack",
//         category: "Bags",
//         location: "Gymnasium",
//         dateFound: "May 18, 2026",
//         status: "claimed",
//         linkedReport: "LR-102",
//         reportedBy: "Maria Santos"
//     },
//     {
//         id: "FN-003",
//         photo: "https://placehold.co/100x100",
//         itemName: "Casio Watch",
//         category: "Accessories",
//         location: "Cafeteria",
//         dateFound: "May 17, 2026",
//         status: "unclaimed",
//         linkedReport: "LR-103",
//         reportedBy: "Carlo Reyes"
//     }
// ]

export default function AdminTable({ reports }) {

    const [selectedImage, setSelectedImage] = useState(null)

    return (
        <>
            <div className="overflow-x-auto  bg-white shadow-sm">

                <table className="table table-zebra table-sm [&_th]:px-2 [&_td]:px-2">

                    <thead className="bg-primary text-white text-center">
                        <tr>
                            <th className="w-16"></th>
                            <th className="w-28">ITEM ID</th>
                            <th className="w-24">PHOTO</th>
                            <th className="w-48">ITEM NAME</th>
                            <th className="w-32">CATEGORY</th>
                            <th className="w-40">LOCATION</th>
                            <th className="w-32">DATE FOUND</th>
                            <th className="w-32">STATUS</th>
                            <th className="w-40">LINKED REPORT</th>
                            <th className="w-40">REPORTED BY</th>
                            <th className="w-24">ACTIONS</th>
                        </tr>
                    </thead>

                    <tbody>
                        {reports.map((item, index) => (
                            <tr
                                key={item.id}
                                className={
                                    index % 2 === 0
                                        ? "bg-white"
                                        : "bg-[#F5F5F5]"
                                }
                            >

                                <td className="align-middle">{index + 1}</td>

                                <td className="w-28 align-middle text-center">{item.item_id}</td>

                                <td className="align-middle text-center">
                                    <img
                                        src={item.image_url}
                                        alt={item.image_url}
                                        className="w-12 h-12 object-cover rounded-lg cursor-pointer hover:scale-105 transition"
                                        onClick={() => setSelectedImage(item.image_url)}
                                    />
                                </td>

                                <td className="truncate max-w-48 align-middle text-center">{item.item_name}</td>

                                <td className="align-middle text-center">{item.category_name}</td>

                                <td className="align-middle text-center">{item.location_found}</td>

                                <td className="align-middle text-center"> {new Date(item.found_date).toLocaleDateString()}</td>

                                <td className="align-middle text-center">
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium
                                        ${item.status === "claimed"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-gray-200 text-gray-700"
                                            }`}
                                    >
                                        {item.status === "claimed"
                                            ? "Claimed"
                                            : "Unclaimed"}
                                    </span>
                                </td>

                                <td className="align-middle text-center">{item.linked_report}</td>

                                <td className="align-middle text-center">{item.reported_by}</td>

                                <td className="align-middle text-center">
                                    <button className=" btn-sm btn-square  text-white border-none ">
                                        <Pencil size={18} className="text-primary" />
                                    </button>
                                </td>

                            </tr>
                        ))}
                    </tbody>

                </table>

            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

                    <div className="relative bg-white p-3 rounded-2xl">

                        <button
                            className="absolute top-2 right-2 btn btn-sm btn-circle"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X size={16} />
                        </button>

                        <img
                            src={selectedImage}
                            alt="Preview"
                            className="max-w-125 max-h-125 rounded-xl"
                        />

                    </div>

                </div>
            )}
        </>
    )
}