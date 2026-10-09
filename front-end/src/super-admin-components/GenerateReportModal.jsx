import { useState } from "react";
import { createPortal } from "react-dom";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";

export default function GenerateReportModal({ centers, onClose, defaultOfficeId = "all", lockOffice = false }) {
    const API_URL = import.meta.env.VITE_API_URL;

    // Local calendar date — not toISOString(), which converts to UTC first and
    // silently shifts the date back a day in timezones ahead of UTC (e.g. Manila).
    const today = (() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    })();

    const EARLIEST_DATE = "1970-01-01";

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [exportAll, setExportAll] = useState(false);
    const [officeId, setOfficeId] = useState(defaultOfficeId);
    const [format, setFormat] = useState("csv");
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState("");

    const handleExportAllChange = (e) => {
        setExportAll(e.target.checked);
        setError("");
    };

    const handleExport = async () => {
        if (!exportAll) {
            if (!startDate || !endDate) {
                setError("Start date and end date are required, or check \"Export All Time\".");
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
        }

        const effectiveStart = exportAll ? EARLIEST_DATE : startDate;
        const effectiveEnd = exportAll ? today : endDate;

        try {
            setIsExporting(true);
            setError("");

            const params = new URLSearchParams({
                start_date: effectiveStart,
                end_date: effectiveEnd,
                office_id: officeId,
                format,
            });

            const response = await fetchWithAuth(
                `${API_URL}/api/system-reports/generate?${params.toString()}`
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to generate report.");
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `system-report-${exportAll ? "ALL" : `${startDate}-to-${endDate}`}.${format}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success("Report exported successfully.");
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to generate report.");
            toast.error(err.message || "Failed to generate report.");
        } finally {
            setIsExporting(false);
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-1040"
            onClick={() => !isExporting && onClose()}
        >
            <div
                className="relative bg-white rounded-lg w-100 max-w-[90vw]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-full h-10 rounded-t-lg bg-primary text-white flex items-center justify-between px-5">
                    <p className="font-semibold">Export Report</p>
                    <button onClick={onClose}>
                        <i className="fa-solid fa-x text-sm text-white" />
                    </button>
                </div>

                <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-[#1A1208]">Report Period</p>
                        <label className="flex items-center gap-1.5 text-sm text-[#6B5C42] cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={exportAll}
                                onChange={handleExportAllChange}
                                className="accent-primary cursor-pointer"
                            />
                            Export All Time
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-[#1A1208]">
                                Start Date {!exportAll && <span className="text-[#C0392B]">*</span>}
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                max={today}
                                disabled={exportAll}
                                onChange={(e) => { setStartDate(e.target.value); setError(""); }}
                                className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none focus:border-primary
                                    disabled:bg-[#F5F5F5] disabled:text-[#6B5C42] disabled:cursor-not-allowed"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-[#1A1208]">
                                End Date {!exportAll && <span className="text-[#C0392B]">*</span>}
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                max={today}
                                disabled={exportAll}
                                onChange={(e) => { setEndDate(e.target.value); setError(""); }}
                                className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none focus:border-primary
                                    disabled:bg-[#F5F5F5] disabled:text-[#6B5C42] disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 mb-4">
                        <label className="text-sm font-medium text-[#1A1208]">
                            Center <span className="text-[#C0392B]">*</span>
                        </label>
                        <select
                            value={officeId}
                            disabled={lockOffice}
                            onChange={(e) => { setOfficeId(e.target.value); setError(""); }}
                            className="border border-[#DDD9CF] rounded-md px-3 py-2 text-sm outline-none focus:border-primary
                                disabled:bg-[#F5F5F5] disabled:text-[#6B5C42] disabled:cursor-not-allowed"
                        >
                            {!lockOffice && <option value="all">All Centers</option>}
                            {centers.map((c) => (
                                <option key={c.office_id} value={c.office_id}>
                                    {c.office_name}
                                </option>
                            ))}
                        </select>
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
                            disabled={isExporting || (!exportAll && (!startDate || !endDate))}
                            onClick={handleExport}
                        >
                            {isExporting ? "Exporting..." : "Export"}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}