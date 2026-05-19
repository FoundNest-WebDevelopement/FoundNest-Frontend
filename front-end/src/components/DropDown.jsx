export default function DropDown({
  title,
  placeholder,
  value,
  options = [],
  onChange
}) {
  return (
    <fieldset className="fieldset">

      <legend className="fieldset-legend">
        {title}
      </legend>

      <select
        className="select bg-white rounded-md text-xs w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      >

        <option disabled hidden value="">
          {placeholder}
        </option>

        {options.map((option) => (
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