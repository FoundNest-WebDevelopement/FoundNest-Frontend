export default function PhotoSheet({ hasPhoto, onTake, onChoose, onRemove, onClose }) {
  const row =
    "w-full flex items-center gap-3 rounded-xl border border-[#eee] px-4 py-3 text-sm font-semibold text-left";

  return (
    <div className="fixed inset-0 bg-black/20 flex items-end justify-center z-50" onClick={onClose}>
      <div
        className="bg-white w-full rounded-t-3xl p-4 pb-25 flex flex-col gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={row} onClick={onTake}>
          <i className="fa-solid fa-camera w-5 text-center text-primary" />
          Take Photo
        </button>
        <button type="button" className={row} onClick={onChoose}>
          <i className="fa-regular fa-image w-5 text-center text-primary" />
          Choose from Library
        </button>
        {hasPhoto && (
          <button type="button" className={`${row} text-[#C62828]`} onClick={onRemove}>
            <i className="fa-regular fa-trash-can w-5 text-center" />
            Remove Photo
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl py-3 text-sm font-semibold text-primary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}