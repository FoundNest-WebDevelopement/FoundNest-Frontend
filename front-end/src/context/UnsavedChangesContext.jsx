import { createContext, useCallback, useContext, useRef, useState } from "react";
import AlertDialog from "../components/AlertDialog";

const UnsavedChangesContext = createContext(null);

export function UnsavedChangesProvider({ children }) {
    const isDirtyRef = useRef(false);
    const [pending, setPending] = useState(null);

    const setDirty = useCallback((dirty) => {
        isDirtyRef.current = dirty;
    }, []);

    // Returns true if navigation may proceed immediately, false if it was
    // intercepted and a confirmation dialog is now pending.
    const requestNavigation = useCallback((runNavigation) => {
        if (!isDirtyRef.current) {
            runNavigation();
            return true;
        }
        setPending(() => runNavigation);
        return false;
    }, []);

    const confirmDiscard = () => {
        const runNavigation = pending;
        setPending(null);
        isDirtyRef.current = false;
        runNavigation?.();
    };

    const cancelDiscard = () => setPending(null);

    return (
        <UnsavedChangesContext.Provider value={{ setDirty, requestNavigation }}>
            {children}

            {pending && (
                <AlertDialog
                    message="You have unsaved changes. Discard them and leave, or keep editing?"
                    b1Label="Keep Editing"
                    b2Label="Discard"
                    b1OnClick={cancelDiscard}
                    b2OnClick={confirmDiscard}
                />
            )}
            
        </UnsavedChangesContext.Provider>
    );
}

export function useUnsavedChangesGuard() {
    const ctx = useContext(UnsavedChangesContext);
    if (!ctx) {
        throw new Error("useUnsavedChangesGuard must be used within an UnsavedChangesProvider");
    }
    return ctx;
}
