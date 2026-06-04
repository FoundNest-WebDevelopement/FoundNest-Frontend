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

        <option  value="">
          {placeholder}
        </option>

        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}

      </select>

    </fieldset>
  );
}