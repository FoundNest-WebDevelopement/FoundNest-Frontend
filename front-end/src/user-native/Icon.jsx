import ionicons from "../assets/native/Ionicons.json";
import materialIcons from "../assets/native/MaterialIcons.json";
import feather from "../assets/native/Feather.json";
import materialCommunity from "../assets/native/MaterialCommunityIcons.subset.json";

// Same icon fonts / glyph maps the native app uses (@expo/vector-icons), so every icon
// name used in the native source maps 1:1 to the web.
const FAMILIES = {
  // box: glyph box height as a multiple of the font size (Ionicons' metrics make its box ~1.1x)
  ion: { font: "Ionicons", glyphs: ionicons, box: 1.1 },
  material: { font: "Material Icons", glyphs: materialIcons, box: 1 },
  feather: { font: "Feather", glyphs: feather, box: 1 },
  mci: { font: "Material Community Icons", glyphs: materialCommunity, box: 1 },
};

export default function Icon({ name, size = 24, color = "currentColor", family = "ion", className = "", style }) {
  const { font, glyphs, box } = FAMILIES[family];
  const codePoint = glyphs[name];
  if (codePoint === undefined) {
    if (import.meta.env.DEV) console.warn(`Unknown ${font} glyph: ${name}`);
    return null;
  }

  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 select-none not-italic font-normal ${className}`}
      style={{
        fontFamily: `"${font}"`,
        fontSize: size,
        lineHeight: `${Math.round(size * box)}px`,
        width: size,
        height: Math.round(size * box),
        color,
        textAlign: "center",
        ...style,
      }}
    >
      {String.fromCodePoint(codePoint)}
    </span>
  );
}
