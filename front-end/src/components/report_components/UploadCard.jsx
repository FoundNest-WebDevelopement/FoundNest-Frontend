import { Astroid, Expand, Image, ImageOff, ImageOffIcon, X } from "lucide-react";
import { useState } from "react";

function Spinner({ className = "h-8 w-8" }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-[3px] border-primary border-t-transparent ${className}`}
    />
  );
}

export default function UploadCard({ image, isLoading, viewOnly, canScan, onScan, onOpenPicker }) {
  const hasImage = image && image !== "REMOVE";
const [selectedPhoto, setSelectedPhoto] = useState(null)


  return (
    <div className="flex justify-center pb-2.5">
      <div className="w-full max-w-112.5 bg-white rounded-[28px] py-5 px-5 flex flex-col items-center shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
        {!viewOnly && (
          <>
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


            <button
              type="button"
              onClick={onScan}
              disabled={!canScan}
              className="mt-3.5 flex items-center gap-2 rounded-[10px] border border-primary px-5 py-2 text-sm font-semibold text-primary disabled:opacity-40 disabled:border-[#CCCCCC] disabled:text-[#A0A0A0] enabled:active:scale-95 transition-transform duration-100"
            >
              <Astroid className="size-4" />
              Scan Image
            </button>
          </>
        )}
        {viewOnly && (

          
          <>

          {isLoading ? (
                <div className="h-20 w-20 rounded-full border-[1.5px] border-dashed border-[#CCC] flex items-center justify-center">
                  <Spinner />
                </div>
              ) : hasImage? 
          (
            <>
            <div className=" flex flex-col gap-4 items-center justify-center">
              <div className="relative h-27.5 w-27.5" onClick={() => setSelectedPhoto(image)}>
                  <img src={image} alt="Item" className="h-full w-full rounded-[20px] object-cover" />
                  <button
                                            type="button"
                                            onClick={() => setSelectedPhoto(image)}
                                            className="absolute bottom-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/70 text-white text-xs"
                                        >
                                            <Expand size={16} className="text-white" />
                                        </button>
                </div>
                <p className="font-medium text-(--color-tertiary)">Item Photo</p>
            </div>
            </>
          )
          :
          (
            <>
            <div className="flex flex-col gap-2 items-center justify-center">
                    <div className="h-20 w-20 rounded-full border-[1.5px] border-dashed border-(--color-tertiary)/40 flex items-center justify-center">
                      <div className="h-15 w-15 rounded-full  flex items-center justify-center">
                        <ImageOffIcon strokeWidth={2} className="text-(--color-tertiary)/40" />
                      </div>

                    </div>
                    <p className="font-medium text-(--color-tertiary)">No Photo Attached</p>
                  </div>
            </>
          )

          }
          </>
        )
        }
      </div>
       {selectedPhoto &&
                <div className="fixed  inset-0 w-screen h-screen bg-black/75 backdrop-blur-sm flex items-center justify-center z-4001">
                    <div className="relative w-full h-full flex items-center ">
                        <button
                            className="absolute top-2 right-2 text-3xl text-white z-10 rounded-full bg-black/20 p-2"
                            onClick={() => setSelectedPhoto(null)}
                        >
                            <X />
                        </button>

                        <div className="w-full h-full flex items-center justify-center">
                            <img src={selectedPhoto} className="max-w-100 h-100" />

                        </div>
                    </div>
                </div>

            }
    </div>
  );
}