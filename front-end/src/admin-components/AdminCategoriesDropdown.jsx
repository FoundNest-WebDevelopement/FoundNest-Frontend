export default function AdminCategoriesDropdown({
  title,
  placeholder,
  value = "",
  options = [],
  onChange = () => {}
}) {
  const safeOptions = Array.isArray(options) ? options : [];

  return (
    <fieldset className="fieldset">

      {title && (
        <legend className="fieldset-legend text-sm font-medium">
          {title}
        </legend>
      )}

      <select
        className="select bg-white rounded-md text-sm w-full border border-[#DDD9CF] text-black" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      >

        <option disabled hidden value="">
          {placeholder}
        </option>

        {safeOptions.map((option) => (
          <option
            key={option.category_id}
            value={option.category_id}
          >
            {option.category_name}
          </option>
        ))}

      </select>

    </fieldset>
  );
}
