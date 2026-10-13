import { Info } from "lucide-react"

export default function Toast({ message, icon, solid }) {
  const accent = solid ? "#FFFFFF" : "#990000"

  return (
    <div
      className={`flex items-center gap-2.5 py-3 px-5 rounded-3xl max-w-[85vw]
        ${solid
          ? "bg-[#990000] shadow-[0_4px_8px_rgba(0,0,0,0.2)]"
          : "bg-white border-[0.5px] border-black/[0.08] shadow-[0_3px_6px_rgba(0,0,0,0.15)]"}`}
    >
      <div className="flex items-center justify-center shrink-0">
        {icon ?? <Info size={20} fill={accent} color={solid ? "#990000" : "#FFFFFF"} />}
      </div>
      <p className="text-sm font-semibold" style={{ color: accent }}>
        {message}
      </p>
    </div>
  )
}