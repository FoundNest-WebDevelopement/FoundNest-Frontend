import { Archive } from "lucide-react";

export default function ArchiveDialog({
  open,
  onClose,
  onConfirm,
  isLoading = false,
  isArchiving = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-1020">
      <div className="relative bg-white rounded-lg w-100 h-fit flex flex-col">
        <div className="w-full h-10 rounded-t-lg bg-primary text-white flex items-center justify-between px-5">
          <p className="font-semibold">Archived Item</p>

          <button onClick={onClose}>
            <i className="fa-solid fa-x text-xs xl:text-sm text-white"></i>
          </button>
        </div>

        <div className="flex flex-col flex-1 p-3 gap-3">
          <div className="w-full flex flex-col justify-center items-center">
            <Archive size={40} className="text-[#7F8C8D]" />
            <p className="text-md font-medium">Archive Item?</p>
          </div>

          <div className="text-sm text-justify">
            <p>
              Archiving this item will immediately hide it from the public feed
              and update its status to{" "}
              <span className="font-semibold">'Archived'</span>. The record will
              remain stored in the system and{" "}
              <span className="font-semibold">
                can be restored at any time.
              </span>
            </p>
          </div>

          <div className="w-full h-full flex items-center text-xs flex-1 text-[#6B5C42] italic">
            <p>
              Archiving this listing will be recorded in the system under your
              administrator account.
            </p>
          </div>

          <hr className="border-(--color-tertiary) my-2 opacity-30" />

          <div className="flex gap-2">
            <button
              className="w-full h-10 flex-1 bg-white rounded-lg text-primary border border-primary text-sm font-medium transition-transform duration-100 active:scale-95"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              className="w-full h-10 flex-1 disabled:opacity-40 bg-primary rounded-lg text-white text-sm font-medium transition-transform duration-100 active:scale-95"
              onClick={onConfirm}
              disabled={isArchiving || isLoading}
            >
              {isArchiving ? "Archiving..." : "Confirm Archive"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
