import { useRef, useState } from "react";

export default function AdminDateInput({
  title,
  value,
  onChange,
  error,
  reqField,
  max,
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
          className="input bg-white text-sm rounded-md w-full border border-[#DDD9CF] cursor-pointer"
          value={value || ""}
          disabled={disabled}
          onChange={handleChange}
          onBlur={handleBlur}
          max={max}
        />

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