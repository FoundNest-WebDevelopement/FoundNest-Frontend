import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Clock, MapPin, RefreshCw } from "lucide-react";
import { API_URL, CAMPUS_CENTER, MAP_TILE_URL, MAX_OFFICE_DISTANCE_KM } from "./config";
import { Reveal } from "./ui";

const distanceKm = ([lat1, lng1], [lat2, lng2]) => {
  const rad = (d) => (d * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
};

const pinIcon = (active) =>
  L.divIcon({
    className: "",
    html: `<span class="fn-pin ${active ? "fn-pin--active" : ""}"></span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
  });

function FitOffices({ offices }) {
  const map = useMap();

  useEffect(() => {
    if (offices.length === 0) return;
    map.fitBounds(L.latLngBounds(offices.map((o) => o.position)), { padding: [48, 48], maxZoom: 17 });
  }, [map, offices]);

  return null;
}

// Whatever was picked last (a pin or a list row) is the single source of truth: the map centres on
// it and opens ITS popup, which also closes the previous one. `tick` makes re-picking the same
// office open its popup again.
function SyncSelection({ office, tick, markerRefs }) {
  const map = useMap();

  useEffect(() => {
    if (!office) return;
    map.flyTo(office.position, Math.max(map.getZoom(), 17), { duration: 0.9 });
    markerRefs.current[office.id]?.openPopup();
  }, [map, office, tick, markerRefs]);

  return null;
}

export default function OfficeLocator() {
  const [state, setState] = useState({ status: "loading", offices: [] });
  const [selection, setSelection] = useState({ id: null, tick: 0 });
  const activeId = selection.id;
  const select = useCallback((id) => setSelection((s) => ({ id, tick: s.tick + 1 })), []);
  const markerRefs = useRef({});
  const rowRefs = useRef({});
  const [attempt, setAttempt] = useState(0);

  // Phones: one finger should scroll the page, not drag the map (zoom buttons stay available)
  const coarsePointer = useMemo(() => window.matchMedia("(pointer: coarse)").matches, []);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/offices`, { signal: controller.signal });
        if (!res.ok) throw new Error(`offices ${res.status}`);
        const data = await res.json();

        const offices = (Array.isArray(data) ? data : [])
          .filter((o) => o.status !== false)
          .map((o) => ({
            id: o.office_id,
            name: o.office_name,
            floor: o.floor,
            hours: o.operating_hours,
            position: [Number(o.latitude), Number(o.longitude)],
          }))
          .filter((o) => o.position.every(Number.isFinite) && distanceKm(CAMPUS_CENTER, o.position) <= MAX_OFFICE_DISTANCE_KM);

        setState({ status: "ready", offices });
      } catch (err) {
        if (err.name !== "AbortError") setState({ status: "error", offices: [] });
      }
    })();

    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading", offices: [] });
    setAttempt((n) => n + 1);
  }, []);

  const { status, offices } = state;
  const active = offices.find((o) => o.id === activeId) ?? null;

  // A pin clicked on the map should also bring its row into view in the list
  useEffect(() => {
    rowRefs.current[selection.id]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selection]);

  return (
    <section id="office-map" tabIndex={-1} className="fn-section bg-[var(--fn-sand)]">
      <div className="fn-container grid gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-5">
          <p className="fn-eyebrow">Walk-in assistance</p>
          <h2 className="fn-display mt-4 text-[clamp(2rem,4.4vw,3.4rem)] text-[var(--fn-maroon-deep)]">
            Need Direct Assistance? Visit Us.
          </h2>
          <p className="mt-6 max-w-[34rem] text-[1.02rem] text-[var(--fn-muted)]">
            Don&apos;t have access to the system? No problem. You can visit any nearby campus Lost and Found offices, and an admin
            officer will gladly assist you in filing a report.
          </p>

          <div className="fn-rule mt-8" />

          {status === "ready" && offices.length > 0 && (
            <ul className="mt-2 max-h-[300px] overflow-y-auto pr-1" aria-label="Campus Lost and Found offices">
              {offices.map((office) => (
                <li key={office.id} className="border-b border-[var(--fn-rule)]">
                  <button
                    ref={(el) => {
                      rowRefs.current[office.id] = el;
                    }}
                    type="button"
                    onClick={() => select(office.id)}
                    aria-pressed={office.id === activeId}
                    className={`group flex w-full items-start gap-4 border-l-4 px-3 py-4 text-left transition-colors ${
                      office.id === activeId
                        ? "border-[var(--fn-maroon)] bg-white/80 text-[var(--fn-maroon)]"
                        : "border-transparent hover:bg-white/40 hover:text-[var(--fn-maroon)]"
                    }`}
                  >
                    <MapPin className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{office.name}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm text-[var(--fn-muted)]">
                        {office.floor && <span>{office.floor}</span>}
                        {office.hours && (
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                            {office.hours}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {status === "loading" && (
            <div className="mt-6 space-y-4" role="status" aria-live="polite">
              <span className="sr-only">Loading office locations…</span>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-[var(--fn-r-sm)] bg-black/[0.07]" />
              ))}
            </div>
          )}

          {status === "ready" && offices.length === 0 && (
            <p className="mt-6 text-[var(--fn-muted)]">No offices are listed right now. Please check again later.</p>
          )}

        </Reveal>

        <Reveal delay={120} className="lg:col-span-7 lg:self-center">
          {/* the maroon offset block lives inside this padding, so the map group ends exactly on the page margin */}
          <div className="relative sm:pb-4 sm:pr-4">
            <div
              aria-hidden="true"
              className="absolute bottom-0 right-0 hidden h-[calc(100%-1rem)] w-[calc(100%-1rem)] rounded-[var(--fn-r-lg)] bg-[var(--fn-maroon)] sm:block"
            />
            <div className="fn-map relative h-[380px] overflow-hidden rounded-[var(--fn-r-lg)] border border-[var(--fn-rule)] bg-white sm:h-[460px] lg:h-[560px]">
              {status === "ready" && offices.length > 0 && (
                <MapContainer
                  center={CAMPUS_CENTER}
                  zoom={16}
                  minZoom={14}
                  maxZoom={19}
                  scrollWheelZoom={false}
                  dragging={!coarsePointer}
                  className="h-full w-full"
                  aria-label="Map of campus Lost and Found offices"
                >
                  <TileLayer url={MAP_TILE_URL} maxZoom={20} attribution="Map data © Google" />
                  <FitOffices offices={offices} />
                  <SyncSelection office={active} tick={selection.tick} markerRefs={markerRefs} />
                  {offices.map((office) => (
                    <Marker
                      key={office.id}
                      ref={(marker) => {
                        markerRefs.current[office.id] = marker;
                      }}
                      position={office.position}
                      icon={pinIcon(office.id === activeId)}
                      title={office.name}
                      eventHandlers={{ click: () => select(office.id) }}
                    >
                      <Popup autoPan={false}>
                        <strong className="block text-[var(--fn-maroon-deep)]">{office.name}</strong>
                        {office.floor && <span className="block text-sm">{office.floor}</span>}
                        {office.hours && <span className="block text-sm text-[var(--fn-muted)]">{office.hours}</span>}
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              )}

              {status === "loading" && (
                <div className="grid h-full place-items-center text-[var(--fn-muted)]" role="status">
                  <span className="inline-flex items-center gap-3">
                    <RefreshCw className="h-5 w-5 animate-spin" aria-hidden="true" />
                    Loading the campus map…
                  </span>
                </div>
              )}

              {status === "error" && (
                <div className="grid h-full place-items-center p-8 text-center">
                  <div>
                    <MapPin className="mx-auto h-10 w-10 text-[var(--fn-maroon)]" aria-hidden="true" />
                    <p className="fn-display mt-4 text-2xl text-[var(--fn-maroon-deep)]">The map couldn&apos;t be loaded</p>
                    <p className="mx-auto mt-2 max-w-sm text-[var(--fn-muted)]">
                      Office locations are temporarily unavailable. You can retry, or sign in to use the full campus map.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                      <button type="button" onClick={retry} className="fn-btn fn-btn--primary">
                        Try again
                      </button>
                      <Link to="/map" className="fn-btn fn-btn--outline">
                        Open the full map
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {status === "ready" && offices.length === 0 && (
                <div className="grid h-full place-items-center p-8 text-center text-[var(--fn-muted)]">
                  No office locations to show yet.
                </div>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
