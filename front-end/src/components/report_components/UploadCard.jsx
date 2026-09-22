import { Astroid } from "lucide-react";

function Spinner({ className = "h-8 w-8" }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-[3px] border-primary border-t-transparent ${className}`}
    />
  );
}

export default function UploadCard({ image, isLoading, viewOnly, canScan, onScan, onOpenPicker }) {
  const hasImage = image && image !== "REMOVE";

  

  return (
    <div className="flex justify-center pb-2.5">
      <div className="w-full max-w-112.5 bg-white rounded-[28px] py-5 px-5 flex flex-col items-center shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
        <button
          type="button"
          onClick={onOpenPicker}
          disabled={isLoading || viewOnly}
          aria-label={hasImage ? "Change photo" : "Add photo"}
          className="mb-5 flex items-center justify-center disabled:cursor-default"
        >
          {isLoading ? (
            <div className="h-20 w-20 rounded-full border-[1.5px] border-dashed border-[#CCC] flex items-center justify-center">
              <Spinner />
            </div>
          ) : hasImage ? (
            <div className="relative h-27.5 w-27.5">
              <img src={image} alt="Item" className="h-full w-full rounded-[20px] object-cover" />
              {!viewOnly && (
                <span className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary border-2 border-white flex items-center justify-center">
                  <i className="fa-solid fa-pen text-white text-[11px]" />
                </span>
              )}
            </div>
          ) : (
            <div className="h-20 w-20 rounded-full border-[1.5px] border-dashed border-primary flex items-center justify-center">
              <div className="h-15 w-15 rounded-full bg-primary flex items-center justify-center">
                <i className="fa-solid fa-plus text-white text-2xl" />
              </div>
            </div>
          )}
        </button>
        <p className="text-[17px] font-semibold text-[#6B5A52] text-center mb-3.5">
          {isLoading ? "Analyzing image..." : "Upload Item Photo (Optional)"}
        </p>
        <p className="text-[13px] text-[#8C7A70] text-center leading-5.5 px-3">
          *FoundNest AI will help auto-fill details based on your photo.
        </p>
        <p className="text-xs text-[#8C7A70] text-center mt-1">PNG, JPG or WEBP up to 10MB</p>

        {!viewOnly && (
          <button
            type="button"
            onClick={onScan}
            disabled={!canScan}
            className="mt-3.5 flex items-center gap-2 rounded-[10px] border border-primary px-5 py-2 text-sm font-semibold text-primary disabled:opacity-40 disabled:border-[#CCCCCC] disabled:text-[#A0A0A0] enabled:active:scale-95 transition-transform duration-100"
          >
            <Astroid className="size-4" />
            Scan Image
          </button>
        )}
      </div>
    </div>
  );
}