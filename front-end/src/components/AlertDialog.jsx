// Confirm / alert dialog. Mirrors ConfirmDiscardModal of the native app:
// dimmed overlay, centered 78%-wide white box, left-aligned message, then either
// two buttons (cancel | confirm) or a single full-width confirm button.
// Only used by Standard User screens.
export default function AlertDialog({ message, b1Label, b2Label, b1OnClick, b2OnClick }) {
  const showCancel = Boolean(b1Label);
  const showConfirm = Boolean(b2Label);
  const single = !showCancel || !showConfirm;

  return (
    <div className="fixed inset-0 z-[5000] bg-black/45 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="w-[78%] max-w-sm bg-white rounded-[14px] overflow-hidden">
        <p className="text-[15px] font-semibold text-[#1a1a1a] text-left px-5 pt-[22px] pb-[18px] leading-[22px]">
          {message}
        </p>

        <div className="h-px bg-black/10" />

        <div className="flex h-[50px]">
          {single ? (
            <button
              type="button"
              onClick={showConfirm ? b2OnClick : b1OnClick}
              className="flex-1 flex items-center justify-center bg-[#8B0000] text-white text-[15px] font-semibold active:opacity-70"
            >
              {b2Label || b1Label}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={b1OnClick}
                className="flex-1 flex items-center justify-center bg-[#F0EEEE] text-[#1a1a1a] text-[15px] font-semibold active:opacity-70"
              >
                {b1Label}
              </button>
              <div className="w-px bg-black/10" />
              <button
                type="button"
                onClick={b2OnClick}
                className="flex-1 flex items-center justify-center bg-[#8B0000] text-white text-[15px] font-semibold active:opacity-70"
              >
                {b2Label}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
