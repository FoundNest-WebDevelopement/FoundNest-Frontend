export default function AdminCategoriesDropdown({
  title,
  placeholder,
  value = "",
  options = [],
  onChange = () => {},
  reqField,
  disabled,
}) {
  const safeOptions = Array.isArray(options) ? options : [];

  return (
    <fieldset className="fieldset">

      {title && (
        <legend className={`fieldset-legend text-sm font-medium `}>
          {title}
          {reqField&&<span className="text-primary">*</span>}
        </legend>
      )}

     <select
  className={`select bg-white rounded-md text-sm w-full border border-[#DDD9CF]
    disabled:opacity-60 disabled:cursor-not-allowed
    ${value === "" ? "text-black/60" : "text-black"}
  `}
  value={value}
  disabled={disabled}
  onChange={(e) => onChange(e.target.value)}
  required
>
  {placeholder && (
    <option value="" disabled>
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
