// Smooth in-page navigation that respects the reduced-motion preference and keeps the URL hash
export function scrollToSection(id, event) {
  const el = document.getElementById(id);
  if (!el) return;
  event?.preventDefault();

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  window.history.replaceState(null, "", `#${id}`);
  el.focus({ preventScroll: true });
}
