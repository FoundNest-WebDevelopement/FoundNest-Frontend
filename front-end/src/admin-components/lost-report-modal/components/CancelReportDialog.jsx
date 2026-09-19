import { useEffect, useState } from "react";
import { X } from "lucide-react";

// Admin-facing wording. The label is what gets sent to the backend and what
// the modal later shows under "Report Cancelled" (selectedItem.cancel_reason).
export const CANCEL_REASONS = [
    { id: 1, label: "I found it myself!", isActive: true },
    { id: 2, label: "Reporter is no longer looking for it", isActive: true },
    { id: 3, label: "Duplicate report", isActive: true },
];

export default function CancelReportDialog({
    reportLabel,
    onClose,
    onConfirm,
    isCancelling = false,
}) {
    // Dialog is conditionally rendered by the parent, so this resets on every open.
    const [selectedReason, setSelectedReason] = useState("");

    // Escape closes the dialog (unless a request is in flight)
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape" && !isCancelling) onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose, isCancelling]);

    const handleConfirm = () => {
        if (!selectedReason || isCancelling) return;
        onConfirm(selectedReason);
    };

    return (
        <div
            className="fixed inset-0 z-200 bg-black/40 flex items-center justify-center p-6"
            onClick={() => !isCancelling && onClose()}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="cancel-report-title"
                className="w-full max-w-md xl:max-w-lg bg-white rounded-xl shadow-xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 px-6 pt-6">
                    <div>
                        <h2
                            id="cancel-report-title"
                            className="text-lg xl:text-xl font-semibold text-black"
                        >
                            Cancel this report?
                        </h2>
                        <p className="text-xs xl:text-sm text-[#6B5C42] mt-1">
                            Choose why {reportLabel} is being cancelled. The reason is saved on the report.
                        </p>
                    </div>
                    <button
                        type="button"
                        aria-label="Close"
                        onClick={onClose}
                        disabled={isCancelling}
                        className="text-[#6B5C42] hover:text-black disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed shrink-0"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Reasons */}
                <fieldset
                    disabled={isCancelling}
                    className="px-6 py-5 flex flex-col gap-2"
                >
                    <legend className="sr-only">Reason for cancelling</legend>
                    {CANCEL_REASONS.filter((reason) => reason.isActive).map((reason) => {
                        const checked = selectedReason === reason.label;
                        return (
                            <label
                                key={reason.id}
                                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-primary/40
                                    ${checked
                                        ? "border-primary bg-primary/5 text-black font-medium"
                                        : "border-[#DDD9CF] hover:bg-gray-50 text-black"}
                                    ${isCancelling ? "opacity-60 cursor-not-allowed" : ""}`}
                            >
                                <input
                                    type="radio"
                                    name="cancel-reason"
                                    value={reason.label}
                                    checked={checked}
                                    onChange={(e) => setSelectedReason(e.target.value)}
                                    className="accent-primary h-4 w-4"
                                />
                                {reason.label}
                            </label>
                        );
                    })}
                </fieldset>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#DDD9CF] bg-[#FAF8F3]">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isCancelling}
                        className="h-10 px-5 rounded-lg border border-primary text-primary text-sm font-medium bg-white cursor-pointer transition-transform duration-100 enabled:active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Keep Report
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!selectedReason || isCancelling}
                        className="h-10 px-5 rounded-lg bg-primary text-white text-sm font-medium cursor-pointer transition-transform duration-100 enabled:active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isCancelling ? "Cancelling..." : "Confirm Cancel"}
                    </button>
                </div>
            </div>
        </div>
    );
}