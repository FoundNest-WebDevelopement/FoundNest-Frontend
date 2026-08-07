import { ArchiveRestore } from "lucide-react";

export default function RestoreDialog({
  open,
  onClose,
  onConfirm,
  isRestoring = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-1020">
      <div className="relative bg-white rounded-lg w-100 h-fit flex flex-col">
        <div className="w-full h-10 rounded-t-lg bg-primary text-white flex items-center justify-between px-5">
          <p className="font-semibold">Restore Listing</p>

          <button onClick={onClose}>
            <i className="fa-solid fa-x text-xs xl:text-sm text-white"></i>
          </button>
        </div>

        <div className="flex flex-col flex-1 p-3 gap-3">
          <div className="w-full flex flex-col justify-center items-center">
            <ArchiveRestore size={40} className="text-[#0288D1]" />
            <p className="text-md font-medium">Restore Listing?</p>
          </div>

          <div className="text-sm text-justify">
            <p>
              This will change its status back to{" "}
              <span className="font-semibold">"Unclaimed"</span> and make it
              visible again in the active item listings.
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
              disabled={isRestoring}
            >
              {isRestoring ? "Restoring..." : "Confirm Restore"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
