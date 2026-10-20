import Icon from "../../user-native/Icon";

// PhotoPickerModal of the native app: dimmed overlay with a bottom sheet of photo sources.
export default function PhotoSheet({ hasPhoto, onTake, onChoose, onRemove, onClose, title = "Upload Item Photo" }) {
  const row = "w-full flex items-center gap-3.5 py-3.5 border-b border-[#F0F0F0] text-left active:opacity-70";

  return (
    <div className="fixed inset-0 z-[5000] bg-black/40 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-3xl bg-white rounded-t-[24px] px-5 pt-5 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[17px] font-bold text-[#1a1a1a] text-center mb-4">{title}</p>

        <button type="button" className={row} onClick={onTake}>
          <Icon name="camera-outline" size={22} color="#1a1a1a" />
          <span className="text-[16px] text-[#1a1a1a]">Take Photo</span>
        </button>
        <button type="button" className={row} onClick={onChoose}>
          <Icon name="image-outline" size={22} color="#1a1a1a" />
          <span className="text-[16px] text-[#1a1a1a]">Choose from Library</span>
        </button>
        {hasPhoto && (
          <button type="button" className={row} onClick={onRemove}>
            <Icon name="trash-outline" size={22} color="#C0392B" />
            <span className="text-[16px] text-[#C0392B]">Remove Current Photo</span>
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full h-[50px] rounded-xl bg-[#F5F5F5] text-[16px] font-semibold text-[#1a1a1a] flex items-center justify-center active:opacity-80"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
