export default function Button({
  icon: Icon,
  label,
  onClick,
  isSolid,
  isIcon,
  isBorder,
  isShadow,
  disabled,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex gap-3  p-2 rounded-md  items-center font-medium cursor-pointer transition-transform duration-100 justify-center 
     enabled:active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
        ${isSolid? "bg-primary text-white" : "text-[#1A1208]"}
        ${isBorder? "border border-primary text-primary" : ""}
        ${isShadow? "shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)]" : ""}`}
        
    >
      {isIcon && (
        <Icon size={20} />
      )}
      <p className="text-xs">{label}</p>
    </button>
  );
}
