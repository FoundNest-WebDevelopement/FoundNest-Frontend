import { Info } from "lucide-react";

export default function AdminConfirmDialog({
  title = "Discard Changes?",
  description,
  confirmText = "Discard",
  cancelText = "Keep Editing",
  onClose,
  onConfirm,
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
            <Info size={40} className="text-[#4A5568]" />
          </div>

          <p className="text-sm text-center">{description}</p>

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
              className="flex-1 h-10 bg-primary rounded-lg text-white text-sm font-medium transition-transform duration-100 active:scale-95"
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