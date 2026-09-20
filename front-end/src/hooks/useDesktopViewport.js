// useDesktopViewport.js
import { useEffect } from "react";

export default function useDesktopViewport(width = 1024) {
  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "viewport";
      document.head.appendChild(meta);
    }
    const original = meta.getAttribute("content");

    meta.setAttribute("content", `width=${width}`);

    return () => {
      meta.setAttribute("content", original || "width=device-width, initial-scale=1");
    };
  }, [width]);
}