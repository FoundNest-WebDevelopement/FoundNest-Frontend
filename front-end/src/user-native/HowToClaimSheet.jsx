import { useEffect, useRef, useState } from "react";
import { fetchWithAuth } from "../utils/fetchWithAuth";

const API_URL = import.meta.env.VITE_API_URL;
const CLAIM_POLICY_NAME = "Item Claim Process";
const DISMISS_THRESHOLD = 120;

function parseSteps(policyValue) {
  try {
    const steps = typeof policyValue === "string" ? JSON.parse(policyValue) : policyValue;
    return Array.isArray(steps) ? steps : [];
  } catch {
    return [];
  }
}

// Drag-to-dismiss "How to Claim?" bottom sheet (HowToClaimSheet in the native app).
// Steps come from the "Item Claim Process" policy.
export default function HowToClaimSheet({ visible, onClose }) {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const dragRef = useRef(0);

  useEffect(() => {
    if (!visible) {
      setShown(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetchWithAuth(`${API_URL}/api/policies`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch claim process.");
        const policy = Array.isArray(data) ? data.find((p) => p.policy_name === CLAIM_POLICY_NAME) : null;
        const fresh = policy ? parseSteps(policy.policy_value) : [];
        if (!cancelled && fresh.length > 0) setSteps(fresh);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    // slide up on the next frame so the transition runs
    const frame = requestAnimationFrame(() => setShown(true));
    document.documentElement.style.overflow = "hidden";

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      document.documentElement.style.overflow = "";
    };
  }, [visible]);

  if (!visible) return null;

  const close = () => {
    setShown(false);
    setTimeout(onClose, 220);
  };

  const onPointerDown = (e) => {
    startY.current = e.clientY;
    dragRef.current = 0;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragging) return;
    const dy = e.clientY - startY.current;
    if (dy > 0) {
      dragRef.current = dy;
      setDragY(dy);
    }
  };
  const onPointerUp = (e) => {
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // pointer already released
    }
    if (dragRef.current > DISMISS_THRESHOLD) close();
    dragRef.current = 0;
    setDragY(0);
  };

  return (
    <div className="fixed inset-0 z-[5000]">
      <div
        onClick={close}
        className="absolute inset-0 bg-black/40 transition-opacity duration-200"
        style={{ opacity: shown ? Math.max(0, 1 - dragY / 800) : 0 }}
      />
      <div className="absolute inset-x-0 bottom-0 max-w-3xl mx-auto">
        <div
          className="bg-white rounded-t-[24px] px-6 pb-10 pt-3 max-h-[65vh] overflow-y-auto"
          style={{
            transform: shown ? `translateY(${dragY}px)` : "translateY(100%)",
            transition: dragging ? "none" : "transform 260ms ease-out",
          }}
        >
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="w-full flex flex-col items-center pt-2.5 pb-[18px] touch-none cursor-grab"
          >
            <div className="w-10 h-1 rounded-sm bg-black/15 mb-3.5" />
            <p className="text-[20px] font-extrabold text-[#1a1a1a] text-center">How to Claim?</p>
          </div>

          {steps.length > 0 ? (
            steps.map((step, index) => (
              <div key={index}>
                <p className="text-[15px] font-bold text-[#1a1a1a] mb-1.5">
                  Step {index + 1}: {step.title}
                </p>
                <p className="text-[14px] text-black/65 leading-[22px] mb-[18px] text-justify">{step.description}</p>
              </div>
            ))
          ) : loading ? (
            <div className="flex justify-center my-5">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <p className="text-[14px] text-black/65 leading-[22px] mb-[18px] text-center italic">
              Claim steps are unavailable. Please try again later.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
