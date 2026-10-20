import { useState } from "react";
import Icon from "./Icon";

// <img> that never shows the browser's broken-image glyph + alt text. If the source is
// missing or fails to load (404, revoked blob, blocked host...) the same box is rendered
// as a neutral placeholder, so layouts keep their size. Sizing/cropping is left entirely
// to `className` (object-cover for thumbnails, object-contain for full previews).
export default function SafeImage({ src, alt = "", className = "", iconSize = 28, placeholderClassName = "", ...rest }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const failed = !src || failedSrc === src;

  if (failed) {
    return (
      <span
        role="img"
        aria-label={alt ? `${alt} (image unavailable)` : "Image unavailable"}
        className={`${className} ${placeholderClassName} flex items-center justify-center bg-[#EDE0D4] overflow-hidden`}
      >
        <Icon family="mci" name="image-off-outline" size={iconSize} color="#B0A09A" />
      </span>
    );
  }

  return <img src={src} alt={alt} decoding="async" className={className} onError={() => setFailedSrc(src)} {...rest} />;
}
