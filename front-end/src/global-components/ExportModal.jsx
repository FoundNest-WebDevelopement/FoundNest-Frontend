import { useState } from "react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";

export default function ExportModal({ 
    title = "Export Data", 
    endpoint, 
    filenamePrefix = "export", 
    onClose,
    onUpdate,
    queryParams = {}
}) {
    const API_URL = import.meta.env.VITE_API_URL;

    const today = new Date().toISOString().split("T")[0];

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [format, setFormat] = useState("csv");
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState("");

    const handleExport = async () => {
        if (!startDate || !endDate) {
            setError("Start date and end date are required.");
            return;
        }

        const todayCheck = new Date();
        todayCheck.setHours(23, 59, 59, 999);

        if (new Date(startDate) > new Date(endDate)) {
            setError("Start date must be before end date.");
            return;
        }

        if (new Date(startDate) > todayCheck || new Date(endDate) > todayCheck) {
            setError("Report dates cannot be in the future.");
            return;
        }

        try {
            setIsExporting(true);
            setError("");

            const params = new URLSearchParams({
                start_date: startDate,
                end_date: endDate,
                format,
                ...queryParams,
            });
            // Dynamically uses the endpoint passed via props
            const response = await fetchWithAuth(
                `${API_URL}${endpoint}?${params.toString()}`
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || `Failed to generate ${format.toUpperCase()}.`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            // Dynamically names the file based on props
            link.download = `${filenamePrefix}-${startDate}-to-${endDate}.${format}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            onUpdate?.()

            toast.success("Exported successfully.");
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to generate report.");
            toast.error(err.message || "Failed to generate report.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1040]">
            <div className="relative bg-white rounded-lg w-[400px] max-w-[90vw]">
                <div className="w-full h-10 rounded-t-lg bg-primary text-white flex items-center justify-between px-5">
                    <p className="font-semibold">{title}</p>
                    <button onClick={onClose}>
                        <i className="fa-solid fa-x text-sm text-white" />
                    </button>
                </div>

                <div className="p-4">
                    <p className="text-sm font-semibold text-[#1A1208] mb-2">Report Period</p>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-[#1A1208]">
                                Start Date <span className="text-[#C0392B]">*</span>
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                max={today}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-[#1A1208]">
                                End Date <span className="text-[#C0392B]">*</span>
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                max={today}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 mb-4">
                        <label className="text-sm font-medium text-[#1A1208]">Format</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setFormat("pdf")}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium border transition-transform active:scale-95
                                    ${format === "pdf" ? "bg-primary text-white border-primary" : "bg-white text-[#6B5C42] border-[#DDD9CF]"}`}
                            >
                                PDF
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormat("csv")}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium border transition-transform active:scale-95
                                    ${format === "csv" ? "bg-primary text-white border-primary" : "bg-white text-[#6B5C42] border-[#DDD9CF]"}`}
                            >
                                CSV
                            </button>
                        </div>
                    </div>

                    {error && <p className="text-xs text-[#C0392B] mb-2">{error}</p>}

                    <div className="flex gap-2">
                        <button
                            type="button"
                            className="flex-1 h-10 bg-white border border-primary rounded-lg text-primary text-sm font-medium
                                transition-transform duration-100 active:scale-95"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="flex-1 h-10 bg-primary rounded-lg text-white text-sm font-medium
                                transition-transform duration-100 enabled:active:scale-95
                                disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={isExporting || !startDate || !endDate}
                            onClick={handleExport}
                        >
                            {isExporting ? "Exporting..." : "Export"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}