export default function HourInput(
    {title,
  value,
  onChange,
  error,
disabled
}
){
    return(
        <>
     <fieldset className="fieldset">

      <legend className="fieldset-legend">
        {title}
      </legend>

      <div className={`rounded-md ${error ? "p-1 border border-red-600" : ""}`}>

        <input
          type="time"
          className="input bg-white text-xs rounded-md w-full disabled:opacity-80"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />

      </div>

    </fieldset>
        </>
    )
}