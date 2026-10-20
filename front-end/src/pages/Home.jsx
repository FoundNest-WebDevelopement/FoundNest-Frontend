import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { fetchWithAuth } from "../utils/fetchWithAuth";
import AppHeader from "../user-native/AppHeader";
import Icon from "../user-native/Icon";

const API_URL = import.meta.env.VITE_API_URL;

const RECENT_FINDS_LIMIT = 5;
const RECENT_FINDS_REFRESH_MS = 10_000;
const AUTO_SCROLL_INTERVAL = 3500;

const ACTION_CARDS = [
  {
    key: "report",
    icon: "document-text-outline",
    title: "Lost an Item?",
    subtitle: "File a detailed report to start the search.",
    route: "/report",
  },
  {
    key: "find",
    icon: "search",
    title: "Looking for an Item?",
    subtitle: "Check for your lost item here!",
    route: "/find",
  },
  {
    key: "map",
    icon: "location-outline",
    title: "Found an Item?",
    subtitle: "Find authorized offices to surrender or claim an item",
    route: "/map",
  },
];

// "October 13, 2026 | 5:29 pm"
function formatFoundDate(iso) {
  if (!iso) return "N/A";
  const date = new Date(iso);
  const datePart = date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const timePart = date
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase();
  return `${datePart} | ${timePart}`;
}

function ActionCard({ icon, title, subtitle, onClick }) {
  return (
    <div className="pt-4 flex justify-center items-center bg-primary">
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center text-left bg-[#FFF8F0] rounded-3xl py-5 px-[18px] active:opacity-70 transition-opacity"
        style={{ boxShadow: "4px 4px 0 rgba(0,0,0,0.15)" }}
      >
        <span className="mr-3.5">
          <Icon name={icon} size={55} color="#8B0000" />
        </span>
        <span className="flex-1 min-w-0 pr-2">
          <span className="block text-[20px] font-bold text-[#900000] mb-1">{title}</span>
          <span className="block text-[15px] leading-5 text-[#5C4A42]">{subtitle}</span>
        </span>
        <span className="flex items-center justify-center">
          <Icon name="chevron-forward-outline" size={24} color="#8B0000" />
        </span>
      </button>
    </div>
  );
}

// Auto-sliding, infinitely looping "Recent Finds" carousel (RecentFindsCarousel in the native app).
function RecentFindsStrip({ items, activeIndex, onIndexChange, onOpen }) {
  const scrollRef = useRef(null);
  const interacting = useRef(false);
  const settleTimer = useRef(null);
  const count = items.length;
  const looped = count > 1 ? [items[count - 1], ...items, items[0]] : items;

  const slideWidth = () => scrollRef.current?.clientWidth || 0;

  // Start on the first real slide (index 1 of the padded list)
  useEffect(() => {
    if (count > 1 && scrollRef.current) {
      scrollRef.current.scrollTo({ left: slideWidth(), behavior: "instant" });
    }
  }, [count]);

  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(() => {
      if (interacting.current) return;
      scrollRef.current?.scrollTo({ left: (activeIndex + 2) * slideWidth(), behavior: "smooth" });
    }, AUTO_SCROLL_INTERVAL);
    return () => clearInterval(timer);
  }, [activeIndex, count]);

  // When a slide settles: jump from a clone to the matching real slide, then report the index
  const handleScroll = useCallback(() => {
    if (count <= 1) return;
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const el = scrollRef.current;
      if (!el) return;
      const width = slideWidth();
      const raw = Math.round(el.scrollLeft / width);

      if (raw === looped.length - 1) {
        el.scrollTo({ left: width, behavior: "instant" });
        onIndexChange(0);
      } else if (raw === 0) {
        el.scrollTo({ left: count * width, behavior: "instant" });
        onIndexChange(count - 1);
      } else {
        onIndexChange(raw - 1);
      }
    }, 120);
  }, [count, looped.length, onIndexChange]);

  useEffect(() => () => clearTimeout(settleTimer.current), []);

  if (count === 0) return null;

  const pause = () => {
    interacting.current = true;
  };

  const resume = () => {
    setTimeout(() => {
      interacting.current = false;
    }, 500);
  };

  return (
    <div className="-mx-5 mb-[45px]">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onPointerDown={pause}
        onPointerUp={resume}
        onPointerCancel={resume}
        onTouchStart={pause}
        onTouchEnd={resume}
        className={`h-[220px] flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          count > 1 ? "" : "overflow-x-hidden"
        }`}
      >
        {looped.map((item, index) => (
          <div
            key={`slide-${item.found_report_id ?? item.item_id ?? index}-${index}`}
            className="w-full shrink-0 snap-center px-5 h-[220px]"
          >
            <button
              type="button"
              onClick={() => onOpen(item)}
              className="w-full h-full rounded-2xl overflow-hidden flex flex-col justify-end bg-cover bg-center text-left active:opacity-90"
              style={{
                backgroundColor: "#7B1F1F",
                backgroundImage: item.image_url ? `url("${item.image_url}")` : undefined,
              }}
            >
              <span className="block bg-black/45 px-4 py-3.5">
                <span className="block truncate text-white text-[20px] font-extrabold mb-2">{item.item_name}</span>
                <span className="block h-px bg-white/60 mb-2.5" />
                <span className="flex items-center gap-1.5 mb-1">
                  <Icon name="calendar-outline" size={16} color="#fff" />
                  <span className="flex-1 min-w-0 truncate text-white text-[13px]">{formatFoundDate(item.found_date)}</span>
                </span>
                <span className="flex items-center gap-1.5 mb-1">
                  <Icon name="location-outline" size={16} color="#fff" />
                  <span className="flex-1 min-w-0 truncate text-white text-[13px]">{item.location_found}</span>
                </span>
              </span>
            </button>
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <div className="flex justify-center gap-2 mt-3.5 px-5">
            {items.map((report, index) => (
              <span
                key={report.found_report_id ?? report.item_id ?? index}
                className={`h-1 rounded-sm ${index === activeIndex ? "w-10 bg-[#FFF8F0]" : "w-7 bg-white/25"}`}
              />
            ))}
          </div>
          <p className="text-white/85 text-xs text-center mt-2">
            {activeIndex + 1} / {count}
          </p>
        </>
      )}
    </div>
  );
}

// Desktop (lg+) "Recent Finds": a cover-flow. The active find is a large card in the middle, the
// previous / next ones peek out dimmed and slightly smaller on both sides, arrows move between
// them and clicking a side card brings it to the front.
function RecentFindsCoverflow({ items, activeIndex, onIndexChange, onOpen }) {
  const count = items.length;
  const half = Math.floor(count / 2);
  const paused = useRef(false);

  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(() => {
      if (!paused.current) onIndexChange((activeIndex + 1) % count);
    }, AUTO_SCROLL_INTERVAL);
    return () => clearInterval(timer);
  }, [activeIndex, count, onIndexChange]);

  const go = (index) => onIndexChange(((index % count) + count) % count);

  return (
    <div
      className="mb-[45px]"
      onMouseEnter={() => {
        paused.current = true;
      }}
      onMouseLeave={() => {
        paused.current = false;
      }}
    >
      <div className="relative h-[270px] overflow-hidden">
        {items.map((item, index) => {
          // signed distance from the active card, wrapped so the strip loops (-half..half)
          const d = ((index - activeIndex + count + half) % count) - half;
          const center = d === 0;
          const visible = Math.abs(d) <= 1;

          return (
            <div
              key={`cover-${item.found_report_id ?? item.item_id ?? index}`}
              role="button"
              tabIndex={visible ? 0 : -1}
              aria-label={center ? `Open ${item.item_name}` : `Show ${item.item_name}`}
              onClick={() => (center ? onOpen(item) : go(index))}
              onKeyDown={(e) => {
                if (e.key === "Enter") center ? onOpen(item) : go(index);
              }}
              className="absolute top-1/2 left-1/2 w-[62%] h-[240px] cursor-pointer"
              style={{
                transform: `translate(-50%, -50%) translateX(${d * 78}%) scale(${center ? 1 : 0.85})`,
                zIndex: center ? 2 : 1,
                opacity: visible ? 1 : 0,
                pointerEvents: visible ? "auto" : "none",
                transition: "transform 450ms ease, opacity 450ms ease",
              }}
            >
              <div
                className="relative w-full h-full rounded-2xl overflow-hidden flex flex-col justify-end bg-cover bg-center text-left"
                style={{
                  backgroundColor: "#7B1F1F",
                  backgroundImage: item.image_url ? `url("${item.image_url}")` : undefined,
                  boxShadow: center ? "0 8px 24px rgba(0,0,0,0.35)" : "none",
                }}
              >
                <span className="block bg-black/45 px-4 py-3.5">
                  <span className="block truncate text-white text-[20px] font-extrabold mb-2">{item.item_name}</span>
                  <span className="block h-px bg-white/60 mb-2.5" />
                  <span className="flex items-center gap-1.5 mb-1">
                    <Icon name="calendar-outline" size={16} color="#fff" />
                    <span className="flex-1 min-w-0 truncate text-white text-[13px]">{formatFoundDate(item.found_date)}</span>
                  </span>
                  <span className="flex items-center gap-1.5 mb-1">
                    <Icon name="location-outline" size={16} color="#fff" />
                    <span className="flex-1 min-w-0 truncate text-white text-[13px]">{item.location_found}</span>
                  </span>
                </span>
                {/* the cards behind the active one are dimmed */}
                <span
                  className="absolute inset-0 bg-black/55 pointer-events-none transition-opacity duration-[450ms]"
                  style={{ opacity: center ? 0 : 1 }}
                />
              </div>
            </div>
          );
        })}

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(activeIndex - 1)}
              aria-label="Previous find"
              className="absolute left-[5%] top-1/2 -translate-y-1/2 z-[3] w-11 h-11 rounded-full bg-black/45 hover:bg-black/65 flex items-center justify-center active:opacity-80"
            >
              <Icon name="chevron-back" size={26} color="#FFFFFF" />
            </button>
            <button
              type="button"
              onClick={() => go(activeIndex + 1)}
              aria-label="Next find"
              className="absolute right-[5%] top-1/2 -translate-y-1/2 z-[3] w-11 h-11 rounded-full bg-black/45 hover:bg-black/65 flex items-center justify-center active:opacity-80"
            >
              <Icon name="chevron-forward" size={26} color="#FFFFFF" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <>
          <div className="flex justify-center gap-2 mt-3.5">
            {items.map((report, index) => (
              <button
                key={report.found_report_id ?? report.item_id ?? index}
                type="button"
                onClick={() => go(index)}
                aria-label={`Go to find ${index + 1}`}
                className={`h-1 rounded-sm ${index === activeIndex ? "w-10 bg-[#FFF8F0]" : "w-7 bg-white/25"}`}
              />
            ))}
          </div>
          <p className="text-white/85 text-xs text-center mt-2">
            {activeIndex + 1} / {count}
          </p>
        </>
      )}
    </div>
  );
}

// Swipe strip on phones / tablets, cover-flow from the lg breakpoint up
function RecentFindsCarousel(props) {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia("(min-width: 1024px)").matches);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isDesktop ? <RecentFindsCoverflow {...props} /> : <RecentFindsStrip {...props} />;
}

export default function Home() {
  const navigate = useNavigate();
  const firstName = localStorage.getItem("first_name") || "there";
  const user_id = localStorage.getItem("user_id");

  const [recentFinds, setRecentFinds] = useState([]);
  const [latestReport, setLatestReport] = useState(null);
  const [loadingFinds, setLoadingFinds] = useState(true);
  const [loadingReport, setLoadingReport] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFindIndex, setActiveFindIndex] = useState(0);

  // Recent finds: still-unclaimed items only, newest first. Re-fetched every
  // 10s (same as the mobile app) so a claim made elsewhere drops off Home.
  useEffect(() => {
    let cancelled = false;

    const fetchRecentFinds = async () => {
      try {
        const res = await fetchWithAuth(`${API_URL}/api/found-reports/public`);
        const data = await res.json();
        if (cancelled || !res.ok || !Array.isArray(data)) return;

        const unclaimed = data
          .filter((item) => item.status?.toLowerCase() === "unclaimed")
          .sort((a, b) => new Date(b.found_date) - new Date(a.found_date))
          .slice(0, RECENT_FINDS_LIMIT);
        setRecentFinds(unclaimed);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoadingFinds(false);
      }
    };

    fetchRecentFinds();
    const interval = setInterval(fetchRecentFinds, RECENT_FINDS_REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    setActiveFindIndex(0);
  }, [recentFinds.length]);

  // Spotlight the non-cancelled report with the latest activity: its newest
  // match notification, or (when nothing matched) when it was filed/resolved.
  // That way a brand-new report outranks an old stale match and vice versa.
  useEffect(() => {
    let cancelled = false;

    const fetchLatestReport = async () => {
      try {
        const [reportsRes, notifsRes] = await Promise.all([
          fetchWithAuth(`${API_URL}/api/lost-reports/user/${user_id}`),
          fetchWithAuth(`${API_URL}/api/notifications/user/${user_id}`),
        ]);
        const reports = await reportsRes.json();
        if (cancelled || !reportsRes.ok || !Array.isArray(reports)) return;

        // Matches are optional extras: if notifications fail the card still shows
        const notifs = notifsRes.ok ? await notifsRes.json().catch(() => []) : [];

        const matchesByReport = new Map();
        (Array.isArray(notifs) ? notifs : []).forEach((n) => {
          if (!n.found_report_id) return;
          const list = matchesByReport.get(n.lost_report_id) ?? [];
          list.push(n);
          matchesByReport.set(n.lost_report_id, list);
        });

        const activity = (r) => {
          const matches = matchesByReport.get(r.lost_report_id);
          if (matches?.length) {
            return Math.max(...matches.map((m) => new Date(m.created_at).getTime()));
          }
          return new Date(r.date_resolved || r.date_reported).getTime();
        };

        const active = reports
          .filter((r) => r.status !== "archived" && r.status !== "cancelled")
          .sort((a, b) => activity(b) - activity(a));

        setLatestReport(
          active.length > 0
            ? { ...active[0], matchCount: matchesByReport.get(active[0].lost_report_id)?.length ?? 0 }
            : null
        );
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoadingReport(false);
      }
    };

    fetchLatestReport();

    return () => {
      cancelled = true;
    };
  }, [user_id]);

  const handleSearch = () => {
    const query = searchQuery.trim();
    navigate(query ? `/find?q=${encodeURIComponent(query)}` : "/find");
    setSearchQuery("");
  };

  return (
    <div className="narrow-body bg-primary min-h-[calc(100vh-70px)] lg:min-h-screen">
      <AppHeader title="Home" />

      <div className="px-5 pt-[30px] pb-5 lg:px-6 lg:pt-10 lg:pb-10">
       <div className="min-w-0">
        <h1 className="text-white text-[25px] font-black">Hello, {firstName}!</h1>
        <p className="text-white text-[25px] font-black">Searching for something?</p>

        {/* Search */}
        <div className="my-[25px] flex items-center bg-white rounded-[13px] px-2.5 h-[43px]">
          <button type="button" onClick={handleSearch} aria-label="Search" className="p-2.5 flex items-center justify-center">
            <Icon name="search" size={20} color="#8B0000" />
          </button>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            placeholder="Search the Nest (e.g, Wallet, Bag, etc...)"
            enterKeyHint="search"
            className="flex-1 min-w-0 py-2.5 pr-2.5 pl-0 bg-white text-[14px] text-[#424242] outline-none placeholder:text-[#9e9e9e]"
          />
        </div>

        <p className="text-white text-[20px] font-semibold border-b border-[#e4e4e4]/45 pb-2.5">
          How can the Nest help you today?
        </p>

        {ACTION_CARDS.map((card) => (
          <ActionCard
            key={card.key}
            icon={card.icon}
            title={card.title}
            subtitle={card.subtitle}
            onClick={() => navigate(card.route)}
          />
        ))}

       </div>

       <div className="min-w-0">
        {/* Lost Item Report */}
        <div className="mt-7">
          <div className="flex items-center justify-between mb-3.5">
            <p className="min-w-0 truncate whitespace-nowrap text-white text-[20px] font-bold">Recent Lost Report</p>
            <button
              type="button"
              onClick={() => navigate(`/profile/report-history/${user_id}`)}
              className="shrink-0 whitespace-nowrap ml-3 text-[#F5D76E] text-[14px] font-semibold active:opacity-70"
            >
              Go to My Reports &gt;
            </button>
          </div>

          {loadingReport ? (
            <div className="flex justify-center my-5">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : latestReport ? (
            <div
              className="bg-white rounded-2xl pt-4 pb-3 px-4"
              style={{ boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-[#7a7a7a] font-medium">Lost Item Name:</p>
                  <p className="text-[18px] font-bold text-[#900000] mt-0.5 break-words">{latestReport.item_name ?? "—"}</p>
                </div>
                {latestReport.matchCount > 0 && (
                  <div className="bg-[#FFD700] rounded-full py-1.5 px-3 ml-2">
                    <p className="text-[11px] font-bold text-[#900000]">Potential Match Found!</p>
                  </div>
                )}
              </div>

              <div className="h-px bg-[#EBEBEB] my-3.5" />

              <div className="flex items-center justify-between">
                {latestReport.status === "open" ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/report/${latestReport.lost_report_id}`)}
                    className="flex items-center gap-1 active:opacity-70"
                  >
                    <Icon name="create-outline" size={16} color="#900000" />
                    <span className="text-[#900000] text-[14px] font-semibold">Edit Report</span>
                  </button>
                ) : (
                  <span />
                )}

                {latestReport.matchCount > 0 && (
                  <button
                    type="button"
                    onClick={() => navigate(`/profile/report-history/${user_id}`)}
                    className="flex items-center gap-1 active:opacity-70"
                  >
                    <span className="text-[#900000] text-[14px] font-semibold">View Matches</span>
                    <Icon name="arrow-forward" size={16} color="#900000" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="py-[30px] flex items-center justify-center">
              <p className="text-white/60 text-[16px] font-bold">None</p>
            </div>
          )}
        </div>

        {/* Recent Finds */}
        <div className="mt-7 pb-6">
          <div className="flex items-center justify-between mb-3.5">
            <p className="text-white text-[20px] font-bold">Recent Finds</p>
            <button
              type="button"
              onClick={() => navigate("/find")}
              className="text-[#F5D76E] text-[14px] font-semibold active:opacity-70"
            >
              Go to Found Items &gt;
            </button>
          </div>

          {loadingFinds ? (
            <div className="flex justify-center my-10">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recentFinds.length === 0 ? (
            <p className="text-white/85 text-[15px] text-center my-6 mb-[70px]">
              No items available — they may have already been claimed.
            </p>
          ) : (
            <RecentFindsCarousel
              items={recentFinds}
              activeIndex={activeFindIndex}
              onIndexChange={setActiveFindIndex}
              onOpen={(item) => navigate(`/find/${item.found_report_id}`)}
            />
          )}
        </div>
       </div>
      </div>
    </div>
  );
}
