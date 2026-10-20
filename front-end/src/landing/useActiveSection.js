import { useEffect, useState } from "react";

// Which of the given section ids is crossing a thin band just above the middle of the viewport
// (null near the top of the page, and between sections it keeps the last one).
export default function useActiveSection(ids) {
  const [active, setActive] = useState(null);
  const key = ids.join("|");

  useEffect(() => {
    const list = key.split("|");
    const els = list.map((id) => document.getElementById(id)).filter(Boolean);
    const crossing = new Map();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => crossing.set(entry.target.id, entry.isIntersecting));
        const current = list.find((id) => crossing.get(id));
        setActive((prev) => current ?? (window.scrollY < 300 ? null : prev));
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [key]);

  return active;
}
