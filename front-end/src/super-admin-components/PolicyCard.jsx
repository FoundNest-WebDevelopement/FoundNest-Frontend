export default function PolicyCard({ policy, onEdit }) {
    const renderValue = () => {
        if (policy.valueType === "steps") {
            return (
                <div className="flex flex-col gap-2 mt-1">
                    {policy.value.map((step, index) => (
                        <div key={index} className="flex gap-2">
                            <span className="font-semibold text-xs text-primary shrink-0">
                                {index + 1}.
                            </span>
                            <div>
                                <p className="text-sm font-medium text-[#1A1208]">{step.title}</p>
                                <p className="text-xs text-[#6B5C42]">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        const displayValue =
            policy.valueType === "text" ? policy.value : `${policy.value} ${policy.unit}`;

        return (
            <p className="text-sm text-[#1A1208]">
                <span className="font-semibold">Current:</span> {displayValue}
            </p>
        );
    };

    return (
        <>
        <div className="bg-white rounded-lg border border-[#E5E1D8] shadow-[0_2px_6px_0px_rgba(0,0,0,0.06)] p-5 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
                <p className="font-semibold text-base text-[#1A1208]">{policy.title}</p>
                <p className="text-sm text-[#6B5C42]">{policy.description}</p>
            </div>

            {renderValue()}

            <p className="text-xs text-[#9A8F7C]">
                Last updated {policy.updatedAt} by {policy.updatedBy}
            </p>

            <button
                type="button"
                onClick={() => onEdit(policy)}
                className="w-fit px-4 py-1.5 rounded-md border border-primary text-primary text-sm font-medium
                    transition-transform duration-100 active:scale-95"
            >
                Edit Policy
            </button>
        </div>
        </>
    );
}