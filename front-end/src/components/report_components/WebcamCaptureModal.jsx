import { useEffect, useRef, useState } from "react";
import Icon from "../../user-native/Icon";

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

  // Fullscreen black camera view with a round close button and a shutter, like WebCameraModal in the native app
  return (
    <div className="fixed inset-0 z-[6000] bg-black flex items-center justify-center">
      {error ? (
        <div className="flex flex-col items-center justify-center px-8 gap-4">
          <p className="text-white text-[16px] text-center">{error}</p>
          <button type="button" onClick={onClose} className="p-2 text-white/70 text-sm">
            Cancel
          </button>
        </div>
      ) : (
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
      )}

      <button
        type="button"
        onClick={onClose}
        aria-label="Close camera"
        className="absolute top-10 left-5 w-11 h-11 rounded-full bg-black/50 flex items-center justify-center"
      >
        <Icon name="close" size={26} color="#FFFFFF" />
      </button>

      {!error && (
        <div className="absolute bottom-10 inset-x-0 flex justify-center">
          <button
            type="button"
            onClick={handleCapture}
            disabled={!isReady}
            aria-label="Take photo"
            className="w-[72px] h-[72px] rounded-full bg-white border-4 border-white/40 flex items-center justify-center disabled:opacity-50"
          >
            <span className="w-14 h-14 rounded-full bg-white border-2 border-black" />
          </button>
        </div>
      )}
    </div>
  );
}
