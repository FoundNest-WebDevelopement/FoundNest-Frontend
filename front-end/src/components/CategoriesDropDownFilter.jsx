export default function CategoriesDropDownFilter({
  defaultOption,
  value,
  options = [],
  onChange
}) {
  return (
    <fieldset className="fieldset">
      <select
        className={`select bg-[#F2F2F2] rounded-md text-xs w-full ${
          value ? "text-black" : "text-black/40"
        }`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      >
        <option value="" disabled>
          {defaultOption}
        </option>

        {options.map((option) => (
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
