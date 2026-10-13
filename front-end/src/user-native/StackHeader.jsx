import Icon from "./Icon";

// The red header the native app draws itself on pushed screens (back arrow + title),
// e.g. Item Details, Account Details, Report History, QR screens.
// Most screens use a 70px row; Item Details uses 56px.
export default function StackHeader({ title, onBack, height = 70, children }) {
  return (
    <div className="sticky top-0 z-[4000] bg-primary px-4">
      <div className="flex items-center" style={{ height }}>
        {onBack && (
          <button type="button" onClick={onBack} aria-label="Back" className="mr-2 flex items-center justify-center">
            <Icon name="arrow-back" size={28} color="#FFFFFF" />
          </button>
        )}
        <p className="ml-1 text-[22px] font-bold text-white truncate">{title}</p>
        {children}
      </div>
    </div>
  );
}
