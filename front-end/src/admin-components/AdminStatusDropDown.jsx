export default function AdminStatusDropDown({
  title,
  placeholder,
  value,
  options = [],
  onChange
}) {
  return (
    <fieldset className="fieldset">

      {title && (
        <legend className="fieldset-legend font-medium text-sm">
          {title}
        </legend>
      )}

      <select
        className="select bg-white rounded-md text-sm w-full border border-[#DDD9CF] text-black"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      >
        <option value="">
          {placeholder}
        </option>

        {options.map((option) => {
          const isObject =
            typeof option === "object" &&
            option !== null;

          return (
            <option
              key={isObject ? option.value : option}
              value={isObject ? option.value : option}
            >
              {isObject ? option.label : option}
            </option>
          );
        })}
      </select>

    </fieldset>
  );
}