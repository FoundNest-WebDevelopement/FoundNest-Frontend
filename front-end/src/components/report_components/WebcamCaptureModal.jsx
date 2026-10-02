import { useEffect, useRef, useState } from "react";

export default function WebcamCaptureModal({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setIsReady(true);
      } catch (err) {
        console.error(err);
        if (err.name === "NotAllowedError") {
          setError("Camera access was denied. Please allow camera permission and try again.");
        } else if (err.name === "NotFoundError") {
          setError("No camera was found on this device.");
        } else {
          setError("Unable to access the camera.");
        }
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <div className="fixed inset-y-0 left-1/2 w-full max-w-3xl -translate-x-1/2 bg-black/70 flex items-center justify-center z-[6000] px-4">
      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <p className="font-semibold text-base">Take Photo</p>
          <button type="button" onClick={onClose} className="text-gray-400">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="relative bg-black aspect-[3/4] flex items-center justify-center">
          {error ? (
            <p className="text-white text-sm text-center px-6">{error}</p>
          ) : (
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
          )}
        </div>

        <div className="flex items-center gap-2.5 px-4 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-primary border border-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCapture}
            disabled={!isReady || !!error}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-primary disabled:opacity-50"
          >
            Capture
          </button>
        </div>
      </div>
    </div>
  );
}
