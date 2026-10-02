import { createContext, useCallback, useContext, useRef, useState } from "react";
import AlertDialog from "../components/AlertDialog";

const UnsavedChangesContext = createContext(null);

export function UnsavedChangesProvider({ children }) {
    const isDirtyRef = useRef(false);
    const isBlockingRef = useRef(false);
    const [pending, setPending] = useState(null);

    const setDirty = useCallback((dirty) => {
        isDirtyRef.current = dirty;
    }, []);

    // While blocking is active (e.g. an AI scan in progress), navigation
    // can't proceed at all — not even with a "discard and leave" choice.
    const setBlocking = useCallback((blocking) => {
        isBlockingRef.current = blocking;
    }, []);

    // Returns true if navigation may proceed immediately, false if it was
    // intercepted and a confirmation dialog is now pending, or "blocked" if
    // navigation was refused outright.
    const requestNavigation = useCallback((runNavigation) => {
        if (isBlockingRef.current) {
            return "blocked";
        }
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
        <UnsavedChangesContext.Provider value={{ setDirty, setBlocking, requestNavigation }}>
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
