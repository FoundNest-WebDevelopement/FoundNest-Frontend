import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

function disposeScanner(instance) {
  const clearScannerUi = () => {
    instance.clear().catch(() => {});
  };

  try {
    instance.stop().then(clearScannerUi).catch(clearScannerUi);
  } catch {
    clearScannerUi();
  }
}

export default function QRItemFinderModal({ open, setOpen, onItemFound }) {

  const [screen, setScreen] = useState("scanning"); // "scanning" | "detected" | "error"
  const [scannedText, setScannedText] = useState("");
  const [error, setError] = useState("");

  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  const handleClose = () => {
    if (html5QrRef.current) {
      disposeScanner(html5QrRef.current);
      html5QrRef.current = null;
    }
    setScreen("scanning");
    setScannedText("");
    setError("");
    setOpen(false);
  };

  const handleQRDetected = (decodedText) => {
    setScannedText(decodedText);

    // Extract item_id from scanned text
    let itemId = null;

    // Full URL format: ?itemId=138
    const urlMatch = decodedText.match(/itemId=(\d+)/);
    if (urlMatch) itemId = urlMatch[1];

    // SI-XXXXX format
    const siMatch = decodedText.match(/SI-0*(\d+)/i);
    if (!itemId && siMatch) itemId = siMatch[1];

    // Plain number
    if (!itemId && /^\d+$/.test(decodedText)) itemId = decodedText;

    if (itemId) {
      setScreen("detected");
      onItemFound(itemId);
      handleClose();
    } else {
      setError("QR code not recognized. Please scan a valid FoundNest item QR.");
      setScreen("error");
    }
  };

  const handleScanAgain = () => {
    setScannedText("");
    setError("");
    setScreen("scanning");
  };

  useEffect(() => {
    if (!open || screen !== "scanning") return;

    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      const element = document.getElementById("item-finder-qr-reader");
      if (!element) return;
      element.replaceChildren();

      const html5Qrcode = new Html5Qrcode("item-finder-qr-reader");
      html5QrRef.current = html5Qrcode;

      html5Qrcode
        .start(
          { facingMode: "environment" },
          { fps: 10 },
          (decodedText) => {
            disposeScanner(html5Qrcode);
            html5QrRef.current = null;
            handleQRDetected(decodedText);
          },
          () => {}
        )
        .then(() => {
          // Effect was cleaned up while the camera was still starting up.
          if (cancelled) {
            disposeScanner(html5Qrcode);
            html5QrRef.current = null;
          }
        })
        .catch(() => {});
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (html5QrRef.current) {
        disposeScanner(html5QrRef.current);
        html5QrRef.current = null;
      }
    };
  }, [open, screen]);

  return (
    <dialog className={`modal ${open ? "modal-open" : ""}`}>
      <div className="bg-white flex flex-col w-full max-w-md rounded-2xl overflow-hidden">

        {/* HEADER */}
        <div className="h-15 w-full bg-primary flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-qrcode text-white text-xl"></i>
            <p className="text-lg font-semibold text-white">Find Item via QR</p>
          </div>
          <button type="button" onClick={handleClose}>
            <i className="fa-solid fa-xmark text-xl text-white"></i>
          </button>
        </div>

        {/* CONTENT */}
        <div className="px-6 py-6 flex flex-col items-center gap-4">

          {screen === "scanning" && (
            <>
              {/* Scanner area */}
              <div className="relative w-full bg-black rounded-xl overflow-hidden" style={{ height: "280px" }}>
                <div id="item-finder-qr-reader" ref={scannerRef} className="w-full h-full" />

                {/* Custom viewfinder; no qrbox is passed to html5-qrcode. */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 relative shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                  </div>
                </div>

              </div>

              <p className="text-sm text-center text-[#4B2D23]">
                Point the camera at the printed QR code on the physical item to find it in the system.
              </p>

              {/* Scanning status */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
                <p className="text-sm font-medium text-[#4B2D23]">Scanning...</p>
              </div>
            </>
          )}

          {screen === "detected" && (
            <>
              <div className="w-16 h-16 rounded-full border-4 border-green-400 flex items-center justify-center">
                <i className="fa-solid fa-check text-green-400 text-2xl"></i>
              </div>
              <p className="font-bold text-lg text-[#1A1208]">Item Found!</p>
              <p className="text-sm text-center text-gray-500">
                Opening item details...
              </p>
            </>
          )}

          {screen === "error" && (
            <>
              <div className="w-16 h-16 rounded-full border-4 border-red-400 flex items-center justify-center">
                <i className="fa-solid fa-xmark text-red-400 text-2xl"></i>
              </div>
              <p className="font-bold text-lg text-[#1A1208]">QR Code Not Recognized</p>
              <p className="text-sm text-center text-gray-500">{error}</p>
              {scannedText && (
                <p className="text-xs text-gray-400 text-center">
                  Scanned: {scannedText}
                </p>
              )}
            </>
          )}

        </div>

        {/* FOOTER BUTTONS */}
        <div className="h-16 w-full border-t border-[#DDD9CF] flex items-center justify-end px-6 gap-3 shrink-0">
          {screen !== "scanning" && (
            <button
              type="button"
              onClick={handleScanAgain}
              className="flex items-center gap-2 font-medium text-sm text-primary border border-primary px-4 py-2 rounded-md"
            >
              <i className="fa-solid fa-rotate-right text-xs"></i>
              Scan Again
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="font-medium text-sm text-primary border border-primary px-4 py-2 rounded-md"
          >
            Close
          </button>
        </div>

      </div>
    </dialog>
  );
}
