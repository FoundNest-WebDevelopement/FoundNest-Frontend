import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

// Building blocks for the native app's forms (report / edit report / QR item screens).
// Values mirror the StyleSheet entries of ReportScreen.jsx.

export function RequiredMark() {
  return <span className="text-[#C62828]"> *</span>;
}

// Red full-width bar with the form title (styles.title)
export function FormTitle({ children }) {
  return <p className="bg-primary text-[22px] font-bold text-white p-5 lg:hidden">{children}</p>;
}

// Red bar with back arrow, used when editing / viewing an existing report (styles.titleRow)
export function FormTitleRow({ children, onBack }) {
  return (
    <div className="bg-primary flex items-center px-4 py-4 lg:hidden">
      <button type="button" onClick={onBack} aria-label="Back" className="mr-2.5 p-0.5 flex items-center">
        <Icon family="material" name="arrow-back" size={24} color="#FFFFFF" />
      </button>
      <p className="flex-1 text-[22px] font-bold text-white">{children}</p>
    </div>
  );
}

// "Item Description" / "When & Where" (styles.subTitle)
export function SubTitle({ children }) {
  return (
    <p className="border-b border-black text-[17px] font-black text-[#1a1a1a] pt-5 pr-5 pb-[15px] pl-2.5 mx-2.5 mb-5 lg:mx-5 lg:pl-0">
      {children}
    </p>
  );
}

export function SectionTitle({ children, required = false }) {
  return (
    <p className="text-[17px] font-extrabold text-[#1a1a1a] pl-5 mt-5 mb-2">
      {children}
      {required && <RequiredMark />}
    </p>
  );
}

export function FieldError({ message }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-[13px] text-[#C62828] mx-5 mt-1">
      {message}
    </p>
  );
}

const boxBase = "block w-full bg-white rounded-lg px-3 text-[16px] text-black border outline-none placeholder:text-[#8C7A70]";
// disabled (e.g. while the AI is filling the form) darkens the field; a read-only view does not
const disabledLook = "disabled:bg-[#E2D7CC] disabled:text-[#888888] disabled:border-[#C5B8AC]";

// Single / multi line text field (styles.picker, styles.multilineInput)
export function TextBox({ multiline = false, error = false, viewOnly = false, className = "", ...props }) {
  const border = error ? "border-[#C62828]" : "border-black/[0.08]";
  return (
    <div className="px-5">
      {multiline ? (
        <textarea className={`${boxBase} ${viewOnly ? "" : disabledLook} h-[140px] pt-3 resize-none ${border} ${className}`} {...props} />
      ) : (
        <input className={`${boxBase} ${viewOnly ? "" : disabledLook} h-[50px] ${border} ${className}`} {...props} />
      )}
    </div>
  );
}

// Select box that looks like react-native-element-dropdown: closed field with a
// keyboard-arrow-down icon and an opened list of rows below it.
// variant "qr" is the QR Item forms' flavour (#D6D6D6 border, thicker error border).
export function Dropdown({ value, options, onChange, placeholder, disabled = false, error = false, variant = "report", flush = false, viewOnly = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [open]);

  const selected = options.find((o) => String(o.value) === String(value));

  return (
    <div className={`${flush ? "" : "px-5"} relative`} ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full h-[50px] bg-white rounded-lg px-3 flex items-center justify-between text-left ${
          variant === "qr"
            ? error
              ? "border-[1.5px] border-[#C62828]"
              : "border border-[#D6D6D6]"
            : `border ${error ? "border-[#C62828]" : "border-black/[0.08]"}`
        } ${disabled && !viewOnly ? "bg-[#E2D7CC]" : ""}`}
      >
        <span className={`text-[16px] truncate ${selected ? "text-[#1a1a1a]" : "text-[#8C7A70]"}`}>
          {selected ? selected.label : placeholder}
        </span>
        {!disabled && <Icon family="material" name="keyboard-arrow-down" size={24} color="#8B0000" />}
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute ${flush ? "left-0 right-0" : "left-5 right-5"} top-full mt-px z-20 bg-white rounded-lg border ${variant === "qr" ? "border-black/[0.08]" : "border-black/[0.12]"} max-h-[280px] overflow-y-auto`}
          style={{ boxShadow: "0 3px 4px rgba(0,0,0,0.1)" }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={String(option.value) === String(value)}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`block w-full text-left py-3.5 px-4 text-[16px] text-[#1a1a1a] border-b-[0.5px] border-[#ECECEC] last:border-b-0 ${
                String(option.value) === String(value) ? "bg-[rgba(139,0,0,0.1)]" : "bg-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// "Page 1 out of 2" + action buttons row (styles.nextSection)
export function NextSection({ label, children, tight = false }) {
  return (
    <div
      className={`flex items-center justify-between mx-5 mt-5 border-t flex-wrap ${
        tight ? "py-6 gap-3 border-black/15" : "py-[30px] border-black/[0.24]"
      }`}
    >
      <p className={tight ? "text-[15px] font-medium text-[#212121]" : "font-bold text-[14px]"}>{label}</p>
      <div className="flex gap-2.5">{children}</div>
    </div>
  );
}
