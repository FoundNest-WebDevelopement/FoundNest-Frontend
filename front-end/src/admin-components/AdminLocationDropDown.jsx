export default function AdminLocationDropDown({
  title,
  placeholder,
  value = "",
  options = [],
  hidden,
  disabled,
  disableField,
  reqField,
  onChange = () => {}
}) {
  const safeOptions = Array.isArray(options) ? options : [];

  return (
    <fieldset className="fieldset">

      {title && (
        <legend className="fieldset-legend font-medium text-sm">
          {title}
           {reqField&&<span className="text-primary">*</span>}
        </legend>
      )}

      <select
        className="select bg-white rounded-md text- w-full border border-[#DDD9CF] text-black disabled:opacity-40" 
        value={value}
        disabled={disableField}
        onChange={(e) =>{ onChange(e.target.value)}}
        required
      >

        <option hidden={hidden} disabled={disabled} value="">
          {placeholder}
        </option>

        {safeOptions.map((option) => (
          <option
            key={option.office_id}
            value={option.office_id}
          >
            {option.office_name}
          </option>
        ))}

      </select>

    </fieldset>
  );
}
