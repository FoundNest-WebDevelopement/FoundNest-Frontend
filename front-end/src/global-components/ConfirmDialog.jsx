import { Info } from "lucide-react";

export default function ConfirmDialog({
  title = "Discard Changes?",
  description,
  confirmText = "Discard",
  cancelText = "Keep Editing",
  onClose,
  onConfirm,
  Icon = Info,
  iconColor = "text-[#4A5568]" ,
  message,
  disabled,
  
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-1040">
      <div className="relative bg-white rounded-lg w-100 max-w-[90vw]">
        {/* Header */}
        <div className="w-full h-10 rounded-t-lg bg-primary text-white flex items-center justify-between px-5">
          <p className="font-semibold">{title}</p>

          <button onClick={onClose}>
            <i className="fa-solid fa-x text-sm text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="flex justify-center mb-4">
            {/* Renders the passed Icon dynamically */}
            <Icon size={40} className={iconColor} />
          </div>

          <div className="flex flex-col gap-2">
              <p className={`text-sm text-center font-medium ${message && "text-center"}`}>{description}</p>
                {message &&
                <p className="text-xs text-center text-[#6B5C42] ">{message}</p>
                }
          </div>

          <hr className="border-(--color-tertiary) my-4 opacity-30" />

          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 h-10 bg-white border border-primary rounded-lg text-primary text-sm font-medium transition-transform duration-100 active:scale-95"
              onClick={onClose}
            >
              {cancelText}
            </button>

            <button
              type="button"
              className="flex-1 h-10 bg-primary rounded-lg text-white text-sm font-medium transition-transform duration-100 active:scale-95 disabled:opacity-40
              disabled:cursor-not-allowed"
              disabled={disabled}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}