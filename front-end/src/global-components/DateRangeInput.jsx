import { useState } from "react";
import { Calendar, X } from "lucide-react";

function todayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function formatLabel(str) {
    const [y, m, d] = str.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export default function DateRangeInput({
    startDate,
    endDate,
    onChange,
    maxDate,
    placeholder = "Select date range",
    className = "",
}) {
    const [open, setOpen] = useState(false);
    const [draftStart, setDraftStart] = useState(startDate || "");
    const [draftEnd, setDraftEnd] = useState(endDate || "");

    const resolvedMax = maxDate || todayStr();
    const hasValue = Boolean(startDate && endDate);

    const openPanel = () => {
        setDraftStart(startDate || "");
        setDraftEnd(endDate || "");
        setOpen(true);
    };

    const apply = () => {
        if (!draftStart || !draftEnd) return;
        onChange(draftStart, draftEnd);
        setOpen(false);
    };

    const clear = (e) => {
        e.stopPropagation();
        setDraftStart("");
        setDraftEnd("");
        onChange("", "");
        setOpen(false);
    };

    return (
        <div className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => (open ? setOpen(false) : openPanel())}
                className="flex items-center gap-2 w-full border border-[#DDD9CF] rounded-md px-3 py-2 text-sm text-left bg-white cursor-pointer"
            >
                <Calendar size={16} className="text-[#9A8F7C] shrink-0" />
                <span className={hasValue ? "text-[#4B2D23] truncate" : "text-[#9A8F7C] truncate"}>
                    {hasValue ? `${formatLabel(startDate)} - ${formatLabel(endDate)}` : placeholder}
                </span>
                {hasValue && (
                    <X
                        size={14}
                        onClick={clear}
                        className="ml-auto text-[#9A8F7C] hover:text-[#4B2D23] shrink-0"
                        aria-label="Clear date range"
                    />
                )}
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} />
                    <div className="absolute left-0 mt-2 w-60 bg-white border border-[#DDD9CF] rounded-lg shadow-lg z-50 p-3 flex flex-col gap-2">
                        <label className="text-xs text-gray-500">
                            From
                            <input
                                type="date"
                                value={draftStart}
                                max={draftEnd || resolvedMax}
                                onChange={(e) => setDraftStart(e.target.value)}
                                className="w-full border border-[#DDD9CF] rounded-md px-2 py-1 text-sm mt-1"
                            />
                        </label>
                        <label className="text-xs text-gray-500">
                            To
                            <input
                                type="date"
                                value={draftEnd}
                                min={draftStart || undefined}
                                max={resolvedMax}
                                onChange={(e) => setDraftEnd(e.target.value)}
                                className="w-full border border-[#DDD9CF] rounded-md px-2 py-1 text-sm mt-1"
                            />
                        </label>
                        <button
                            type="button"
                            onClick={apply}
                            disabled={!draftStart || !draftEnd}
                            className="mt-1 bg-primary text-white text-sm rounded-md py-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Apply
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
