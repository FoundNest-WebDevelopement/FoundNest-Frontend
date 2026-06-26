export default function AdminTextArea({
  title,
  placeholder,
  value,
  onChange = () => {},
  error,
  titlePrimary,
  disabled,
}) {
  return (
    <fieldset className="fieldset">

      <legend className={`fieldset-legend font-medium text-sm ${titlePrimary? "text-primary" : "text-black"}`}>
        {title}
      </legend>

      <div className={`rounded-md ${error ? "p-1 border border-red-600" : ""}`}>

        <textarea
          className="textarea h-20 bg-white rounded-md w-full border border-[#DDD9CF] text-sm"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />

      </div>

    </fieldset>
  );
}