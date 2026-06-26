export default function AdminDonationDropDown({
  title,
  placeholder,
  value = "",
  options = [],
  onChange = () => {},
  reqField = false,
  disabled
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
        className="select bg-white rounded-md text-sm w-full border border-[#DDD9CF] text-black"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        required={reqField}
      >
        <option value="">
          {placeholder}
        </option>

        {safeOptions.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </fieldset>
  );
}