import { useState } from "react";
import Icon from "../../user-native/Icon";
import ImageViewer from "../../user-native/ImageViewer";
import SafeImage from "../../user-native/SafeImage";

function Spinner() {
  return <span className="inline-block h-9 w-9 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />;
}

// Photo card of the report forms (the `card` / `uploadTarget` / ScanImageButton parts of the
// native ReportScreen). Tapping a photo opens it fullscreen; the pencil badge changes it.
export default function UploadCard({
  image,
  isLoading,
  viewOnly,
  canScan,
  onScan,
  onOpenPicker,
  title = "Upload Item Photo (Optional)",
}) {
  const hasImage = image && image !== "REMOVE";
  const [viewerOpen, setViewerOpen] = useState(false);

  const handleTargetClick = () => {
    if (hasImage) {
      setViewerOpen(true);
      return;
    }
    if (!viewOnly) onOpenPicker();
  };

  return (
    <div className="flex flex-col items-center px-5 pb-2.5">
      <div
        className="w-full max-w-[450px] lg:max-w-none bg-white rounded-[28px] py-5 px-5 flex flex-col items-center"
        style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}
      >
        <button
          type="button"
          onClick={handleTargetClick}
          disabled={isLoading || (viewOnly && !hasImage)}
          aria-label={hasImage ? "View photo" : "Add photo"}
          className="mb-5 flex items-center justify-center active:opacity-70"
        >
          {isLoading ? (
            <span className="h-20 w-20 rounded-full border-[1.5px] border-dashed border-[#CCC] flex items-center justify-center">
              <Spinner />
            </span>
          ) : hasImage ? (
            <span className="relative block w-[110px] h-[110px]">
              <SafeImage src={image} alt="Item" className="w-full h-full rounded-[20px] object-cover" />
              {viewOnly ? (
                <span className="absolute bottom-2 right-2 bg-black/45 rounded-md p-1 flex">
                  <Icon name="expand-outline" size={18} color="#FFFFFF" />
                </span>
              ) : (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Change photo"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenPicker();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation();
                      onOpenPicker();
                    }
                  }}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#900000] border-2 border-white flex items-center justify-center active:opacity-80"
                >
                  <Icon family="material" name="edit" size={16} color="#FFFFFF" />
                </span>
              )}
            </span>
          ) : viewOnly ? (
            <span className="h-20 w-20 rounded-full border-[1.5px] border-dashed border-[#CCCCCC] flex items-center justify-center">
              <Icon family="material" name="image-not-supported" size={28} color="#B0A09A" />
            </span>
          ) : (
            <span className="h-20 w-20 rounded-full border-[1.5px] border-dashed border-[#900000] flex items-center justify-center">
              <span className="h-[60px] w-[60px] rounded-full bg-[#900000] flex items-center justify-center">
                <Icon family="material" name="add" size={32} color="#FFFFFF" />
              </span>
            </span>
          )}
        </button>

        <p className="text-[17px] font-semibold text-[#6B5A52] text-center mb-3.5">
          {isLoading ? "Analyzing image..." : viewOnly ? (hasImage ? "Item Photo" : "No Photo Attached") : title}
        </p>

        {!viewOnly && (
          <>
            <p className="text-[13px] text-[#8C7A70] text-center leading-[22px] px-3">
              *FoundNest AI will help auto-fill details based on your photo.
            </p>

            <button
              type="button"
              onClick={onScan}
              disabled={!canScan}
              className="mt-3.5 flex items-center justify-center gap-2.5 py-3 px-6 rounded-[10px] bg-[#900000] disabled:bg-[#A0A0A0] disabled:opacity-70 active:opacity-80"
            >
              <Icon name="sparkles-outline" size={22} color="#FFFFFF" />
              <span className="text-[15px] font-semibold text-white">Scan Image</span>
            </button>
          </>
        )}
      </div>

      <ImageViewer uri={hasImage ? image : null} visible={viewerOpen} onClose={() => setViewerOpen(false)} />
    </div>
  );
}
