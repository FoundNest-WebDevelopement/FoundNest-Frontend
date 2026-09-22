export default function Field({ label, htmlFor, required, error, hint, count, max, children }) {
  return (
    <div className="mt-5">
      <label htmlFor={htmlFor} className="block text-[17px] font-extrabold mb-2">
        {label}
        {required && <span className="text-primary"> *</span>}
      </label>
      {children}
      <div className="flex items-start justify-between gap-2 mt-1 min-h-4">
        {error ? (
          <p role="alert" className="text-[13px] text-[#C62828]">
            {error}
          </p>
        ) : (
          <p className="text-[13px] text-[#8C7A70]">{hint}</p>
        )}
        {max != null && (
          <p className={`text-xs shrink-0 ml-auto ${count >= max ? "text-[#C62828]" : "text-[#8C7A70]"}`}>
            {count}/{max}
          </p>
        )}
      </div>
    </div>
  );
}
