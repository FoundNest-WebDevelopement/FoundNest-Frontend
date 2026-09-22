export default function ActionButton({ variant = "solid", danger = false, disabled = false, onClick, children }) {
  const look =
    variant === "solid"
      ? "bg-primary text-white px-8 disabled:bg-[#A0A0A0]"
      : danger
        ? "border border-[#C62828] text-[#C62828] px-5 disabled:opacity-50"
        : "border border-primary text-primary px-5 disabled:opacity-50";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-[10px] py-2.5 text-sm font-semibold transition-transform duration-100 enabled:active:scale-95 ${look}`}
    >
      {children}
    </button>
  );
}