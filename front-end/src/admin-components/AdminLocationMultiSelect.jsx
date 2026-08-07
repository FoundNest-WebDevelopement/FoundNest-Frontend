import { useState } from "react";

export default function AdminLocationMultiSelect({
    value = [],
    onChange,
    locations = [],
    sharedSpaces = [],
    gates = [],
    disabled = false,
    reqField = false,
}) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [showBuildings, setShowBuildings] = useState(false);
    const [showSharedSpaces, setShowSharedSpaces] = useState(false);
    const [showGates, setShowGates] = useState(false);

    const selectedLocations = Array.isArray(value) ? value : [];

    const handleLocationChange = (locationName) => {
        const current = [...selectedLocations];

        if (locationName === "Can't Remember") {
            if (current.includes("Can't Remember")) {
                onChange([]);
            } else {
                onChange(["Can't Remember"]);
            }

            setShowBuildings(false);
            setShowSharedSpaces(false);
            setShowGates(false);
            return;
        }

        const withoutCantRemember = current.filter(
            item => item !== "Can't Remember"
        );

        if (withoutCantRemember.includes(locationName)) {
            onChange(
                withoutCantRemember.filter(
                    item => item !== locationName
                )
            );
        } else {
            onChange([...withoutCantRemember, locationName]);
        }
    };

    const buttonLabel =
        selectedLocations.length === 0
            ? "Select Location"
            : selectedLocations.length === 1
            ? selectedLocations[0]
            : `Locations (${selectedLocations.length})`;

    return (
        <div className="dropdown w-full">
            <p className="text-sm font-medium mt-2">
                Location Lost
                {reqField && (
                    <span className="text-primary"> *</span>
                )}
            </p>

            <button
                type="button"
                disabled={disabled}
                onClick={() => setShowDropdown(prev => !prev)}
                className={`p-2.5 px-3 mt-2 flex justify-between w-full rounded-md border border-[#DDD9CF] bg-white text-sm
                    ${showDropdown && "border-black"}
                    ${disabled && "opacity-50 cursor-not-allowed"}
                `}
            >
                {buttonLabel}

                <i
                    className={`fa-solid fa-caret-${
                        showDropdown ? "up" : "down"
                    } text-[8px]`}
                />
            </button>

            {showDropdown && (
                <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg">

                    {/* Buildings */}

                    <button
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                        disabled={selectedLocations.includes("Can't Remember")}
                        onClick={() => setShowBuildings(!showBuildings)}
                    >
                        Buildings
                    </button>

                    {showBuildings && (
                        <div className="pl-6 pb-2">
                            {locations.map(building => (
                                <label
                                    key={building.office_id}
                                    className="flex gap-2 py-1"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedLocations.includes(
                                            building.office_name
                                        )}
                                        onChange={() =>
                                            handleLocationChange(
                                                building.office_name
                                            )
                                        }
                                    />

                                    {building.office_name}
                                </label>
                            ))}
                        </div>
                    )}

                    {/* Shared Spaces */}

                    <button
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                        disabled={selectedLocations.includes("Can't Remember")}
                        onClick={() =>
                            setShowSharedSpaces(!showSharedSpaces)
                        }
                    >
                        Shared Spaces
                    </button>

                    {showSharedSpaces && (
                        <div className="pl-6 pb-2">
                            {sharedSpaces.map(space => (
                                <label
                                    key={space.shared_space_id}
                                    className="flex gap-2 py-1"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedLocations.includes(
                                            space.shared_space_name
                                        )}
                                        onChange={() =>
                                            handleLocationChange(
                                                space.shared_space_name
                                            )
                                        }
                                    />

                                    {space.shared_space_name}
                                </label>
                            ))}
                        </div>
                    )}

                    {/* Gates */}

                    <button
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                        disabled={selectedLocations.includes("Can't Remember")}
                        onClick={() => setShowGates(!showGates)}
                    >
                        Gates
                    </button>

                    {showGates && (
                        <div className="pl-6 pb-2">
                            {gates.map(gate => (
                                <label
                                    key={gate.gate_id}
                                    className="flex gap-2 py-1"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedLocations.includes(
                                            gate.gate_name
                                        )}
                                        onChange={() =>
                                            handleLocationChange(
                                                gate.gate_name
                                            )
                                        }
                                    />

                                    {gate.gate_name}
                                </label>
                            ))}
                        </div>
                    )}

        

                    <div className="border-t">
                        <label className="flex gap-2 px-4 py-3">
                            <input
                                type="checkbox"
                                checked={selectedLocations.includes(
                                    "Can't Remember"
                                )}
                                onChange={() =>
                                    handleLocationChange("Can't Remember")
                                }
                            />

                            Can't Remember
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}