import { Link } from "react-router-dom";
import image from "../assets/pana.png";

export default function NotFoundPage() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-primary px-6 flex items-center justify-center">

            <span
                className="
                    absolute
                    left-1/2 top-1/2
                    -translate-x-1/2 -translate-y-1/2
                    text-[16rem] sm:text-[22rem] md:text-[28rem]
                    font-black
                    leading-none
                    text-white/5
                    select-none
                    pointer-events-none
                "
            >
                404
            </span>

            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/5" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-white/5" />

            <div className="relative z-10 w-full max-w-lg text-center">

                <div className="flex justify-center">
                    <img
                        src={image}
                        alt="Page not found illustration"
                        className="w-full max-w-sm sm:max-w-md drop-shadow-xl"
                    />
                </div>

                <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-white">
                    Oops! Page not found
                </h1>

                <p className="mt-3 mx-auto max-w-md text-sm sm:text-base leading-relaxed text-white/70">
                    The page you're looking for doesn't exist or may have
                    been moved to another location.
                </p>

                <Link
                    to="/"
                    className="
                        inline-flex items-center justify-center
                        mt-7 px-7 py-3
                        rounded-xl
                        bg-white text-primary
                        font-semibold
                        shadow-lg
                        transition-all duration-200
                        hover:bg-white/90
                        hover:-translate-y-0.5
                        active:translate-y-0
                    "
                >
                    Back to Home
                </Link>
            </div>
        </div>
    );
}