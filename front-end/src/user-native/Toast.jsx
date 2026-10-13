import Icon from "./Icon";

// Toast of the native app: pill with an icon and a 14px/600 message.
//  - default red background / white content (`solid`), or
//  - white background / red content (the "inverted" variant)
// Rendered through react-hot-toast; the extra bottom margin lifts it to the native offset.
export default function Toast({ message, icon, solid, type = "info" }) {
  const accent = solid ? "#FFFFFF" : "#990000";

  return (
    <div
      className={`mb-[50px] flex items-center gap-2.5 py-3 px-5 rounded-3xl max-w-[85vw] ${
        solid
          ? "bg-[#990000] shadow-[0_4px_8px_rgba(0,0,0,0.2)]"
          : "bg-white border-[0.5px] border-black/[0.08] shadow-[0_3px_6px_rgba(0,0,0,0.15)]"
      }`}
    >
      <div className="flex items-center justify-center shrink-0">
        {icon ?? <Icon name={type === "success" ? "checkmark-circle" : "information-circle"} size={20} color={accent} />}
      </div>
      <p className="text-[14px] font-semibold" style={{ color: accent }}>
        {message}
      </p>
    </div>
  );
}
