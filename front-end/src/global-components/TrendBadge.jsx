import { TrendingUp, TrendingDown } from "lucide-react";

// Shows "vs previous period" as a small colored pill.
// - undefined: this metric never gets a comparison at all (e.g. it's a live
//   snapshot, not scoped to a date range) — render nothing.
// - null: a comparison ran, but the previous period had zero for this metric,
//   so a "% change" is undefined (would be "infinity% up") — show "New"
//   instead of a nonsensical number.
// - number: a real percent change — green + up arrow, or red + down arrow.
export default function TrendBadge({ percent }) {
    if (percent === undefined) return null;

    if (percent === null) {
        return (
            <span className="inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap bg-blue-100 text-blue-700">
                New
            </span>
        );
    }

    const isUp = percent >= 0;

    return (
        <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap
                ${isUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}
        >
            {Math.abs(percent)}%
            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        </span>
    );
}
