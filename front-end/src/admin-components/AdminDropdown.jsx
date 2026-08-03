export default function AdminDropDown({title,
  placeholder,
  value = "",
  options = [],
  onChange = () => {},
  reqField,
  disabled,
  hidePlaceholder = true,
}) {
  const safeOptions = Array.isArray(options) ? options : [];

  return (
    <fieldset className="fieldset">

      {title && (
        <legend className={`fieldset-legend font-medium text-sm`}>
          {title}
           {reqField&&<span className="text-primary">*</span>}
        </legend>
      )}

      <select
        className="select bg-white rounded-md text-sm w-full border border-[#DDD9CF] text-black" 
        value={value}
        onChange={(e) =>{ onChange(e.target.value)}}
        disabled={disabled}
        required
      >


        {safeOptions.map((option, index) => (
          <option
            key={index}
            value={option.name}
          >
            {option.name}
          </option>
        ))}

      </select>

    </fieldset>
    )
}