export default function LocationGroup({ group, selectedLocations, open, onToggleOpen, onToggleItem, disabled, readOnly }) {
  const count = group.items.filter((i) => selectedLocations.includes(i.name)).length;

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onToggleOpen}
        disabled={disabled}
        className="flex items-center justify-between p-2.5 text-xs font-medium bg-[#F2F2F2] rounded-md disabled:opacity-40"
      >
        <span>
          {group.title}
          {count > 0 && ` (${count})`}
        </span>
        <i className={`fa-solid fa-chevron-${open ? "up" : "down"} text-[10px] text-primary`} />
      </button>

      {open && (
        <div className="flex flex-wrap gap-2 pt-2 px-1">
          {group.items.map((item) => (
            <label
              key={item.key}
              className="cursor-pointer flex items-center gap-2 text-xs p-2 rounded-md font-medium w-fit bg-[#f9f9f9] border border-[#eee] has-checked:border-primary"
            >
              <input
                type="checkbox"
                checked={selectedLocations.includes(item.name)}
                onChange={() => onToggleItem(item.name)}
                disabled={readOnly}
                className="w-3.5 h-3.5 accent-primary cursor-pointer"
              />
              {item.name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}