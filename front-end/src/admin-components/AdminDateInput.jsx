export default function AdminDateInput({
  title,
  value,
  onChange,
  error
}) {
  return (
    <fieldset className="fieldset">

      <legend className="fieldset-legend font-medium text-sm">
        {title}
      </legend>

      <div className={`rounded-md ${error ? "p-1 border border-red-600" : ""}`}>

        <input
          type="date"
          className="input bg-white text-sm rounded-md w-full border border-[#DDD9CF]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />

      </div>

    </fieldset>
  );
}