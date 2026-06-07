import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function QRScanModal({ open, setOpen, onUseData }) {
  const API_URL = import.meta.env.VITE_API_URL;

  const [screen, setScreen] = useState("scanning"); // "scanning" | "detected"
  const [qrResult, setQrResult] = useState(null);
  const [error, setError] = useState("");

  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);
  const isStartedRef = useRef(false);

  // Start scanner when modal opens and screen is scanning
useEffect(() => {
  if (!open || screen !== "scanning") return;

  // Wait for DOM to be ready
  const timer = setTimeout(() => {
    const element = document.getElementById("admin-qr-reader");
    if (!element) return;

    const html5Qrcode = new Html5Qrcode("admin-qr-reader");
    html5QrRef.current = html5Qrcode;
    isStartedRef.current = false;

    html5Qrcode
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          if (isStartedRef.current) {
            html5Qrcode.stop().catch(() => {});
            isStartedRef.current = false;
          }
          await handleQRDetected(decodedText);
        },
        () => {}
      )
      .then(() => {
        isStartedRef.current = true;
      })
      .catch(() => {});
  }, 300);

  return () => {
    clearTimeout(timer);
    if (isStartedRef.current && html5QrRef.current) {
      html5QrRef.current.stop().catch(() => {});
      isStartedRef.current = false;
    }
    html5QrRef.current = null;
  };
}, [open, screen]);

const handleQRDetected = async (decodedText) => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api/qr-items/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ qr_data: decodedText }),
    });

    const data = await res.json();

    if (res.ok && data.found) {
      // Parse the qr_data JSON string
      let parsedQrData = {};
      try {
        parsedQrData = JSON.parse(data.item.qr_data);
      } catch {
        parsedQrData = {};
      }

      setQrResult({
        ...data.item,
        ownerName: parsedQrData.ownerName || "",
        studentNumber: parsedQrData.studentNumber || "",
        courseSection: parsedQrData.courseSection || "",
        contactNumber: parsedQrData.contactNumber || "",
      });
      setScreen("detected");
    } else {
      setError(data.message || "QR code not found.");
      setScreen("detected");
    }
  } catch (err) {
    setError("Something went wrong. Please try again.");
    setScreen("detected");
  }
};

  const handleScanAgain = () => {
    setQrResult(null);
    setError("");
    setScreen("scanning");
  };

  const handleUseData = () => {
    if (onUseData && qrResult) {
      onUseData(qrResult);
    }
    setOpen(false);
  };

  const handleClose = () => {
    if (html5QrRef.current && isStartedRef.current) {
      html5QrRef.current.stop().catch(() => {});
      isStartedRef.current = false;
    }
    html5QrRef.current = null;
    setScreen("scanning");
    setQrResult(null);
    setError("");
    setOpen(false);
  };

  return (
    <dialog className={`modal ${open ? "modal-open" : ""}`}>
      <div className="bg-white flex flex-col w-full max-w-md rounded-2xl overflow-hidden">

        {/* HEADER */}
        <div className="h-15 w-full bg-primary flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-qrcode text-white text-xl"></i>
            <p className="text-lg font-semibold text-white">Scan Item QR Code</p>
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
                <div id="admin-qr-reader" ref={scannerRef} className="w-full h-full" />

                {/* Corner brackets overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                  </div>
                </div>
              </div>

              <p className="text-sm text-center text-[#4B2D23]">
                Point the camera at the item's QR tag. Item details will auto-fill once detected.
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
              {error ? (
                <>
                  {/* Error state */}
                  <div className="w-16 h-16 rounded-full border-4 border-red-400 flex items-center justify-center">
                    <i className="fa-solid fa-xmark text-red-400 text-2xl"></i>
                  </div>
                  <p className="font-bold text-lg text-[#1A1208]">QR Code Not Found</p>
                  <p className="text-sm text-center text-gray-500">{error}</p>
                </>
              ) : (
                <>
                  {/* Success checkmark */}
                  <div className="w-16 h-16 rounded-full border-4 border-green-400 flex items-center justify-center">
                    <i className="fa-solid fa-check text-green-400 text-2xl"></i>
                  </div>

                  <div className="text-center">
                    <p className="font-bold text-lg text-[#1A1208]">QR Code Detected!</p>
                    <p className="text-xs text-gray-500 mt-1">
                      The following details were read from the item's QR tag.
                    </p>
                  </div>

                  {/* Owner Info */}
                  <div className="w-full bg-[#F5F5F5] rounded-lg px-4 py-3 flex flex-col gap-2">
                    <InfoRow label="OWNER NAME" value={qrResult?.ownerName || qrResult?.owner_name || "—"} />
                    <InfoRow label="STUDENT NUMBER" value={qrResult?.studentNumber || qrResult?.student_number || "—"} />
                    <InfoRow label="COURSE & SECTION" value={qrResult?.courseSection || qrResult?.course_section || "—"} />
                    <InfoRow label="CONTACT NUMBER" value={qrResult?.contactNumber || qrResult?.contact_number || "—"} />
                  </div>

                  {/* Item Description */}
                  <div className="w-full">
                    <p className="font-semibold text-sm text-[#1A1208] mb-2">Item Description</p>
                    <div className="flex flex-col gap-2">
                      {qrResult?.image_url && (
                        <InfoRow
                          label="ITEM PHOTO"
                          value={
                            <a href={qrResult.image_url} target="_blank" rel="noreferrer" className="text-primary text-xs underline">
                              View photo
                            </a>
                          }
                        />
                      )}
                      <InfoRow label="CATEGORY" value={qrResult?.category || qrResult?.category_name || "—"} />
                      <InfoRow label="ITEM NAME" value={qrResult?.itemName || qrResult?.item_name || "—"} />
                      <InfoRow label="DESCRIPTION" value={qrResult?.description || "—"} />
                      <InfoRow label="CONTENTS" value={qrResult?.contents || "N/A"} />
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* FOOTER BUTTONS */}
        <div className="h-16 w-full border-t border-[#DDD9CF] flex items-center justify-end px-6 gap-3 shrink-0">
          <button
            type="button"
            onClick={handleScanAgain}
            className="flex items-center gap-2 font-medium text-sm text-primary border border-primary px-4 py-2 rounded-md"
          >
            <i className="fa-solid fa-rotate-right text-xs"></i>
            Scan Again
          </button>
          {screen === "detected" && !error && (
            <button
              type="button"
              onClick={handleUseData}
              className="font-medium text-sm text-white bg-primary px-4 py-2 rounded-md"
            >
              Use This Data
            </button>
          )}
        </div>

      </div>
    </dialog>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex gap-3">
      <p className="text-xs font-semibold text-gray-500 w-36 shrink-0">{label}</p>
      <p className="text-xs text-[#1A1208] flex-1">{typeof value === "string" ? value : value}</p>
    </div>
  );
}