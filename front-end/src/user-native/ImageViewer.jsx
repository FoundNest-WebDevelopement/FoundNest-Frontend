import { useEffect } from "react";
import Icon from "./Icon";

// Fullscreen image viewer.
//  - default: ImageViewerModal of the native app (88% black overlay, tap anywhere to dismiss)
//  - withClose: the variant on Item Details (95% black overlay + round close button)
export default function ImageViewer({ uri, visible, onClose, withClose = false }) {
  useEffect(() => {
    if (!visible) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, onClose]);

  if (!visible || !uri) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className={`fixed inset-0 z-[5000] flex items-center justify-center ${
        withClose ? "bg-black/95 px-4" : "bg-black/[0.88]"
      }`}
    >
      {withClose && (
        <button
          type="button"
          aria-label="Close"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute right-4 top-3 z-[2] w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
        >
          <Icon name="close" size={28} color="#FFFFFF" />
        </button>
      )}
      <img
        src={uri}
        alt=""
        className={withClose ? "w-full h-full object-contain" : "w-[90%] h-[80%] object-contain"}
      />
    </div>
  );
}
