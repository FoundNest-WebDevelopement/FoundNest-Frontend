export default function AdminButton({
  icon: Icon,
  label,
  onClick,
  isSolid,
  isIcon,
  isBorder,
  isShadow,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex gap-3  p-2 rounded-md  items-center font-medium 
        ${isSolid? "bg-primary text-white" : "text-[#1A1208]"}
        ${isBorder? "border border-primary" : ""}
        ${isShadow? "shadow-[0_4px_4px_0px_rgba(0,0,0,0.25)]" : ""}`}
        
    >
      {isIcon && (
        <Icon size={20} />
      )}
      <p className="text-xs">{label}</p>
    </button>
  );
}
