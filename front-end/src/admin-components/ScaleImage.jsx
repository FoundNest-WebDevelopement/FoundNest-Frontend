import { X } from "lucide-react";

export default function ScaleImage({
    selectedImage,
    setSelectedImage,
}){
    return(
        <>
           <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-1000">
                    <div className="relative rounded-2xl h-125">
                        <button
                            className="absolute -top-10 -right-10 btn btn-sm btn-circle text-white "
                            onClick={() => setSelectedImage(null)}
                        >
                            <X size={16} />
                        </button>
                        <img
                            src={selectedImage}
                            alt="Preview"
                            className="h-full w-full  "
                        />
                    </div>
                </div>
        </>
    )
}