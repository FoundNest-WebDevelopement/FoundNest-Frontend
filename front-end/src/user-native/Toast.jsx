import Icon from "./Icon";

// Toast of the native app: pill with an icon and a 14px/600 message.
//  - default red background / white content (`solid`), or
//  - white background / red content (the "inverted" variant)
// Rendered through react-hot-toast; the extra bottom margin lifts it to the native offset.
export default function Toast({ message, icon, solid, type = "info" }) {
  const accent = solid ? "#FFFFFF" : "#990000";

  return (
    <div
      // Toaster (main.jsx) anchors toasts 100px above the bottom edge. Phones: sit just above the tab bar /
      // Report button. Desktop (no tab bar): pull the toast down to ~28px from the bottom.
      // They are also portalled outside the Standard User wrapper, so they carry its font themselves
      style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', lineHeight: "normal" }}
      className={`mb-[6px] lg:-mb-[72px] flex items-center gap-2.5 py-3 px-5 rounded-3xl max-w-[85vw] ${
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
