import { useState } from "react";
import { createPortal } from "react-dom";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import { toast } from "react-toastify";

const toLocalISODate = (d = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

export default function ExportModal({
    title = "Export Data",
    endpoint,
    filenamePrefix = "export",
    onClose,
    onUpdate,
    queryParams = {},
    officeName,
    scopeExport = false,
    filteredIds = [],
    exportDisabled = false,
    exportDisabledReason = ""
}) {
    const API_URL = import.meta.env.VITE_API_URL;

    const today = toLocalISODate();

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [format, setFormat] = useState("csv");
    const [exportAll, setExportAll] = useState(false);
    const [scope, setScope] = useState("filtered");
    const [isExporting, setIsExporting] = useState(false);
    const [serverError, setServerError] = useState("");

    const [touched, setTouched] = useState({ start: false, end: false });

    const errors = { start: "", end: "" };

    if (!scopeExport && !exportAll) {
        if (!startDate) {
            if (touched.start) errors.start = "Start date is required.";
        } else if (startDate > today) {
            errors.start = "Start date cannot be in the future.";
        }

        if (!endDate) {
            if (touched.end) errors.end = "End date is required.";
        } else if (endDate > today) {
            errors.end = "End date cannot be in the future.";
        } else if (startDate && startDate > endDate) {
            errors.end = "End date must be on or after the start date.";
        }
    }

    const noFilteredItems = scopeExport && scope === "filtered" && filteredIds.length === 0;

    const isValid = scopeExport
        ? !noFilteredItems
        : exportAll || Boolean(startDate && endDate && !errors.start && !errors.end);

    const canExport = isValid && !exportDisabled;

    const handleExportAllChange = (e) => {
        setExportAll(e.target.checked);
        setServerError("");
    };

    const handleStartChange = (e) => {
        setStartDate(e.target.value);
        setServerError("");
    };

    const handleEndChange = (e) => {
        setEndDate(e.target.value);
        setServerError("");
    };

    const handleExport = async () => {
        // Safety net in case the button is triggered while invalid
        if (!canExport) {
            setTouched({ start: true, end: true });
            return;
        }

        // Export All covers the full history up to today instead of requiring a picked range.
        const EARLIEST_DATE = "1970-01-01";
        const effectiveStart = exportAll ? EARLIEST_DATE : startDate;
        const effectiveEnd = exportAll ? today : endDate;

        try {
            setIsExporting(true);
            setServerError("");

            const params = new URLSearchParams({
                format,
                ...queryParams,
                ...(scopeExport
                    ? { scope, ...(scope === "filtered" ? { ids: filteredIds.join(",") } : {}) }
                    : { start_date: effectiveStart, end_date: effectiveEnd }),
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
            link.download = scopeExport
                ? `${filenamePrefix}-${scope === "all" ? "ALL" : "FILTERED"}.${format}`
                : exportAll
                    ? `${filenamePrefix}-ALL.${format}`
                    : `${filenamePrefix}-${startDate}-to-${endDate}.${format}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            onUpdate?.();

            toast.success("Exported successfully.");
            onClose();
        } catch (err) {
            console.error(err);
            setServerError(err.message || "Failed to generate report.");
            toast.error(err.message || "Failed to generate report.");
        } finally {
            setIsExporting(false);
        }
    };

    const inputClass = (hasError) =>
        `border rounded-md px-3 py-2 text-sm outline-none disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed ${
            hasError
                ? "border-[#C0392B] focus:border-[#C0392B]"
                : "border-[#DDD9CF] focus:border-primary"
        }`;

    return createPortal(
        <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1040]"
            onClick={() => !isExporting && onClose()}
        >
            <div
                className="relative bg-white rounded-lg w-100 max-w-[90vw]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-full h-10 rounded-t-lg bg-primary text-white flex items-center justify-between px-5">
                    <p className="font-semibold">{title}</p>
                    <button onClick={onClose}>
                        <i className="fa-solid fa-x text-sm text-white" />
                    </button>
                </div>

                <div className="p-4">
                    {officeName && (
                        <p className="text-xs text-[#6B5C42] mb-3">
                            Exporting data for <span className="font-semibold text-[#1A1208]">{officeName}</span>
                        </p>
                    )}

                    {exportDisabled && exportDisabledReason && (
                        <p className="text-xs text-[#C0392B] mb-3 bg-[#FBEAEA] border border-[#C0392B]/30 rounded-md px-3 py-2">
                            {exportDisabledReason}
                        </p>
                    )}

                    {scopeExport ? (
                        <div className="flex flex-col gap-2 mb-4">
                            <p className="text-sm font-semibold text-[#1A1208]">Export Scope</p>
                            <label className="flex items-center gap-2 text-sm text-[#1A1208] cursor-pointer select-none">
                                <input
                                    type="radio"
                                    name="export-scope"
                                    checked={scope === "filtered"}
                                    disabled={exportDisabled}
                                    onChange={() => setScope("filtered")}
                                    className="accent-primary cursor-pointer"
                                />
                                Current Filtered View ({filteredIds.length} Item{filteredIds.length === 1 ? "" : "s"})
                            </label>
                            <label className="flex items-center gap-2 text-sm text-[#1A1208] cursor-pointer select-none">
                                <input
                                    type="radio"
                                    name="export-scope"
                                    checked={scope === "all"}
                                    disabled={exportDisabled}
                                    onChange={() => setScope("all")}
                                    className="accent-primary cursor-pointer"
                                />
                                All Items (All Time)
                            </label>
                            {noFilteredItems && (
                                <p className="text-xs text-[#C0392B]">No items match the current filters.</p>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold text-[#1A1208]">Report Period</p>
                                <label className="flex items-center gap-1.5 text-sm text-[#6B5C42] cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={exportAll}
                                        onChange={handleExportAllChange}
                                        className="accent-primary cursor-pointer"
                                    />
                                    Export All
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4 items-start">
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="export-start-date" className="text-sm font-medium text-[#1A1208]">
                                        Start Date <span className="text-[#C0392B]">*</span>
                                    </label>
                                    <input
                                        id="export-start-date"
                                        type="date"
                                        value={startDate}
                                        max={endDate || today}
                                        disabled={exportAll}
                                        onChange={handleStartChange}
                                        onBlur={() => setTouched((t) => ({ ...t, start: true }))}
                                        aria-invalid={Boolean(errors.start)}
                                        aria-describedby={errors.start ? "export-start-error" : undefined}
                                        className={inputClass(errors.start)}
                                    />
                                    {errors.start && (
                                        <p id="export-start-error" className="text-xs text-[#C0392B]">
                                            {errors.start}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="export-end-date" className="text-sm font-medium text-[#1A1208]">
                                        End Date <span className="text-[#C0392B]">*</span>
                                    </label>
                                    <input
                                        id="export-end-date"
                                        type="date"
                                        value={endDate}
                                        min={startDate || undefined}
                                        max={today}
                                        disabled={exportAll}
                                        onChange={handleEndChange}
                                        onBlur={() => setTouched((t) => ({ ...t, end: true }))}
                                        aria-invalid={Boolean(errors.end)}
                                        aria-describedby={errors.end ? "export-end-error" : undefined}
                                        className={inputClass(errors.end)}
                                    />
                                    {errors.end && (
                                        <p id="export-end-error" className="text-xs text-[#C0392B]">
                                            {errors.end}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

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

                    {serverError && <p className="text-xs text-[#C0392B] mb-2">{serverError}</p>}

                    <div className="flex gap-2">
                        <button
                            type="button"
                            className="flex-1 h-10 bg-white border border-primary rounded-lg text-primary text-sm font-medium
                                transition-transform duration-100 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={isExporting}
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="flex-1 h-10 bg-primary rounded-lg text-white text-sm font-medium
                                transition-transform duration-100 enabled:active:scale-95
                                disabled:opacity-40 disabled:cursor-not-allowed"
                            disabled={isExporting || !canExport}
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