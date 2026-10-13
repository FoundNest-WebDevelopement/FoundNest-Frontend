export default function DateInput({
  title,
  value,
  onChange,
  error,
  disabled,
}) {
  return (
    <fieldset className="fieldset">

      <legend className="fieldset-legend">
        {title}
      </legend>

      <div className={`rounded-md ${error ? "p-1 border border-red-600" : ""}`}>

        <input
          type="date"
          className="input bg-white text-xs rounded-md w-full disabled:opacity-80"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />

      </div>

    </fieldset>
  );
}