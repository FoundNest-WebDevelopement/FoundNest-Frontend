import { useState } from "react";
import { ChevronDown, Calendar } from "lucide-react";

const PRESETS = [
    { key: "all", label: "All Time" },
    { key: "month", label: "This Month" },
    { key: "6months", label: "Last 6 Months" },
    { key: "year", label: "Last Year" },
    { key: "custom", label: "Custom Range" },
];

function toDateStr(d) {
    return d.toISOString().slice(0, 10);
}

function getPresetRange(key) {
    const now = new Date();
    const end = toDateStr(now);
    let start;

    if (key === "month") {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (key === "6months") {
        start = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    } else if (key === "year") {
        start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    } else {
        return { startDate: null, endDate: null };
    }

    return { startDate: toDateStr(start), endDate: end };
}

// Emits { startDate, endDate } as "YYYY-MM-DD" strings, or nulls for "All Time".
export default function DateRangeFilter({ onChange }) {
    const [preset, setPreset] = useState("all");
    const [open, setOpen] = useState(false);
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");

    const selectPreset = (key) => {
        setPreset(key);
        if (key === "custom") return;
        setOpen(false);
        onChange(getPresetRange(key));
    };

    const applyCustom = () => {
        if (!customStart || !customEnd) return;
        setOpen(false);
        onChange({ startDate: customStart, endDate: customEnd });
    };

    const currentLabel = PRESETS.find((p) => p.key === preset)?.label ?? "All Time";

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 bg-white border border-[#DDD9CF] rounded-lg px-4 py-2 text-sm text-[#1A1208] cursor-pointer hover:bg-[#F9F9F7]"
            >
                <Calendar size={16} className="text-[#6B5C42]" />
                {currentLabel}
                <ChevronDown size={16} className="text-[#6B5C42]" />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 mt-2 w-60 bg-white border border-[#DDD9CF] rounded-lg shadow-lg z-50 p-2">
                        {PRESETS.map((p) => (
                            <button
                                key={p.key}
                                type="button"
                                onClick={() => selectPreset(p.key)}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-[#F5F5F5] ${
                                    preset === p.key ? "bg-[#FBEFE9] text-primary font-medium" : "text-[#1A1208]"
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}

                        {preset === "custom" && (
                            <div className="flex flex-col gap-2 px-3 pt-2 pb-1 border-t border-[#EEE] mt-1">
                                <label className="text-xs text-gray-500">
                                    From
                                    <input
                                        type="date"
                                        value={customStart}
                                        max={customEnd || undefined}
                                        onChange={(e) => setCustomStart(e.target.value)}
                                        className="w-full border border-[#DDD9CF] rounded-md px-2 py-1 text-sm mt-1"
                                    />
                                </label>
                                <label className="text-xs text-gray-500">
                                    To
                                    <input
                                        type="date"
                                        value={customEnd}
                                        min={customStart || undefined}
                                        max={toDateStr(new Date())}
                                        onChange={(e) => setCustomEnd(e.target.value)}
                                        className="w-full border border-[#DDD9CF] rounded-md px-2 py-1 text-sm mt-1"
                                    />
                                </label>
                                <button
                                    type="button"
                                    onClick={applyCustom}
                                    disabled={!customStart || !customEnd}
                                    className="mt-1 bg-primary text-white text-sm rounded-md py-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Apply
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
