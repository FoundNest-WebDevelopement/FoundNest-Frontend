import Icon from "../user-native/Icon";

// Strength tiers for a match score percentage (0–100).
export function getMatchStrength(percentage) {
  if (percentage >= 90) return { label: "Very High", color: "#2E7D32" };
  if (percentage >= 80) return { label: "High", color: "#558B2F" };
  if (percentage >= 70) return { label: "Moderate", color: "#E08A00" };
  return { label: "Low", color: "#C0392B" };
}

export function formatMatchPercent(score) {
  const n = Number(score);
  if (score == null || score === "" || !Number.isFinite(n)) return null;
  return `${Math.round(n)}%`;
}

// The API can report IMAGE_MATCH even when the lost report has no photo, so
// only treat it as an image match if there is a lost-report image to compare.
export function effectiveMatchType(match) {
  const hasLostImage = !!(match?.lost_item_image || match?.lost_image_url);
  return match?.match_type === "IMAGE_MATCH" && !hasLostImage ? "TEXT_MATCH" : match?.match_type;
}

export function matchTypeLabel(matchType) {
  if (matchType === "IMAGE_MATCH") return "Image match";
  if (matchType === "TEXT_MATCH") return "Text match";
  return null;
}

// Pill showing how strongly a found item matches a lost report, e.g. image icon + "74%".
// Renders nothing when there is no score. Pass `className` to position it.
export default function MatchScoreBadge({ score, matchType, className = "" }) {
  const percent = formatMatchPercent(score);
  if (percent === null) return null;
  const { color } = getMatchStrength(Number(score));

  return (
    <span
      className={`inline-flex items-center self-start gap-1 rounded-[20px] px-2 py-[3px] text-[11px] font-bold text-white ${className}`}
      style={{ backgroundColor: color }}
    >
      <Icon name={matchType === "TEXT_MATCH" ? "document-text" : "image"} size={12} color="#FFFFFF" />
      {percent}
    </span>
  );
}

// "Image match score" row with a progress bar showing how close the match is.
export function MatchIndicator({ match }) {
  const score = Number(match?.match_score_percentage);
  if (match?.match_score_percentage == null || !Number.isFinite(score)) return null;
  const { color } = getMatchStrength(score);
  const type = effectiveMatchType(match);
  const typeLabel = matchTypeLabel(type);

  return (
    <div className="bg-white rounded-2xl px-3.5 py-3 mb-2" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[14px] font-semibold text-[#1a1a1a]">{typeLabel ? `${typeLabel} score` : "Match score"}</p>
        <MatchScoreBadge score={score} matchType={type} />
      </div>
      <div className="h-2 rounded-full bg-[#EDE0D4] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(0, Math.min(100, score))}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
