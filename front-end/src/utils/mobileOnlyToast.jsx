import hotToast from "react-hot-toast";
import Toast from "../components/Toast";

export function showMobileOnlyToast() {
    if (window.matchMedia("(min-width: 769px)").matches) {
        hotToast.custom(() => (
            <Toast
                message="Optimized for mobile and tablet. FoundNest uses a tablet-width layout — a full desktop view isn't available."
                
            />
        ));
    }
}
