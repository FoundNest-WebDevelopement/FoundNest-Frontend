export default function TextArea({
  title,
  placeholder,
  value,
  onChange = () => {},
  error
}) {
  return (
    <fieldset className="fieldset">

      <legend className="fieldset-legend">
        {title}
      </legend>

      <div className={`rounded-md ${error ? "p-1 border border-red-600" : ""}`}>

        <textarea
          className="textarea h-20 bg-white rounded-md text-xs w-full"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />

      </div>

    </fieldset>
  );
}