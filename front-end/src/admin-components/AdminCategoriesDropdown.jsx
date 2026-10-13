export default function AdminCategoriesDropdown({
  title,
  placeholder,
  value = "",
  options = [],
  onChange = () => {},
  reqField,
  disabled,
  isFilter = false,
}) {
  const safeOptions = Array.isArray(options) ? options : [];

  return (
    <fieldset className="fieldset">

      {title && (
        <legend className="fieldset-legend text-sm font-medium">
          {title}
          {reqField && <span className="text-primary">*</span>}
        </legend>
      )}

      <select
        className={`select bg-white rounded-md text-sm w-full border border-[#DDD9CF]
          ${value === "" ? isFilter? "text-black" : "text-black/40" : "text-black"}
          disabled:opacity-60 disabled:cursor-not-allowed
        `}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        required
      >
        {placeholder && (
          <option value="">
            {placeholder}
          </option>
        )}

        {safeOptions.map((option) => (
          <option
            key={option.category_id}
            value={option.category_id}
            className="text-black"
          >
            {option.category_name}
          </option>
        ))}
      </select>

    </fieldset>
  );
}
