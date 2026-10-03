import { useRef, useState } from "react";

export default function AdminDateInput({
  title,
  placeholder,
  value,
  onChange,
  error,
  reqField,
  max,
  min,
  disabled,
}) {
  const inputRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    const input = inputRef.current;

    if (!input || disabled) return;

    if (isOpen) {
      // Close the native calendar
      input.blur();
      setIsOpen(false);
    } else {
      // Open the native calendar
      input.focus();

      try {
        input.showPicker();
        setIsOpen(true);
      } catch {
        // Browser does not support showPicker
      }
    }
  };

  const handleChange = (e) => {
    onChange(e.target.value);
    setIsOpen(false);
  };

  const handleBlur = () => {
    setIsOpen(false);
  };

  return (
    <fieldset className="fieldset">
      {title && (
        <legend className="fieldset-legend font-medium text-sm">
          {title}
          {reqField && <span className="text-primary">*</span>}
        </legend>
      )}

      <div
        className={`relative rounded-md ${
          error ? "p-1 border border-red-600" : ""
        }`}
      >
        <input
          ref={inputRef}
          type="date"
          className={`input bg-white text-sm rounded-md w-full border border-[#DDD9CF] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
            placeholder && !value ? "[&::-webkit-datetime-edit]:text-transparent" : ""
          }`}
          value={value || ""}
          disabled={disabled}
          onChange={handleChange}
          onBlur={handleBlur}
          max={max}
          min={min}
        />

        {placeholder && !value && (
          <span className="absolute inset-y-0 left-3 flex items-center text-sm text-[#9B9589] pointer-events-none">
            {placeholder}
          </span>
        )}

        {!disabled && (
          <div
            className="absolute inset-0 cursor-pointer"
            onMouseDown={(e) => {
              // Prevent the overlay from stealing focus
              e.preventDefault();
            }}
            onClick={handleClick}
          />
        )}
      </div>
    </fieldset>
  );
}