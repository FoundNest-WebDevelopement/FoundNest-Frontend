import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Boxes,
  Download,
  Menu,
  QrCode,
  ScanLine,
  X,
} from "lucide-react";
import logo from "../assets/nest-logo.png";
import campus from "../assets/login-bg.jpg";
import happyHeart from "../assets/native/happy-heart.png";
import "../landing/landing.css";
import { APP_DOWNLOAD_FILENAME, APP_DOWNLOAD_URL, NAV_LINKS } from "../landing/config";
import useActiveSection from "../landing/useActiveSection";
import { Reveal } from "../landing/ui";
import { scrollToSection } from "../landing/scroll";
import { ClaimVignette, MatchVignette, ReportVignette } from "../landing/Vignettes";
import OfficeLocator from "../landing/OfficeLocator";
import RecentItems from "../landing/RecentItems";

/* ------------------------------------------------------------------------------------------ */
/* Header                                                                                      */
/* ------------------------------------------------------------------------------------------ */

function Brand({ className = "" }) {
  return (
    <a href="#top" onClick={(e) => scrollToSection("top", e)} className={`inline-flex items-center gap-2.5 no-underline ${className}`}>
      <img src={logo} alt="" className="h-9 w-9 object-contain" />
      <span className="fn-display text-[1.45rem] text-[var(--fn-maroon)]">FoundNest</span>
    </a>
  );
}

function Header({ active }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (id) => (e) => {
    setOpen(false);
    scrollToSection(id, e);
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-[var(--fn-cream)] transition-shadow duration-300 ${
        scrolled ? "border-[var(--fn-rule)] shadow-[0_10px_30px_-24px_rgba(42,20,16,0.6)]" : "border-transparent"
      }`}
    >
      <div className="fn-container flex h-[68px] items-center justify-between gap-6">
        <Brand />

        <nav aria-label="Primary" className="hidden items-center gap-9 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={go(link.id)}
              aria-current={active === link.id ? "location" : undefined}
              className={`fn-link !gap-0 pb-1 text-[0.92rem] hover:!text-[var(--fn-maroon)] ${
                active === link.id ? "!font-semibold !text-[var(--fn-maroon)]" : "!font-medium !text-[var(--fn-ink)]"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/login" className="fn-btn fn-btn--primary !min-h-[42px] !px-5 !text-[0.9rem]">
            Login
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid h-11 w-11 place-items-center rounded-[var(--fn-r-sm)] border-2 border-[var(--fn-ink)] lg:hidden"
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-[var(--fn-rule)] bg-[var(--fn-cream)] pb-4 shadow-[0_24px_30px_-24px_rgba(42,20,16,0.5)] lg:hidden"
        >
          <ul className="fn-container">
            {NAV_LINKS.map((link) => (
              <li key={link.id} className="border-b border-[var(--fn-rule)]">
                <a
                  href={`#${link.id}`}
                  onClick={go(link.id)}
                  aria-current={active === link.id ? "location" : undefined}
                  className={`flex min-h-[52px] items-center border-l-4 pl-3 text-lg ${
                    active === link.id
                      ? "border-[var(--fn-maroon)] font-semibold text-[var(--fn-maroon)]"
                      : "border-transparent font-medium"
                  }`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Hero                                                                                        */
/* ------------------------------------------------------------------------------------------ */

function Hero() {
  return (
    <section id="top" tabIndex={-1} className="relative scroll-mt-0 pb-20 pt-10 outline-none lg:pb-28 lg:pt-16">
      <div className="fn-container grid items-center gap-16 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <Reveal>
            <p className="fn-eyebrow">Bulacan State University · Lost &amp; Found</p>
            <h1 className="fn-display mt-6 text-[clamp(2.8rem,5.9vw,5.4rem)] text-[var(--fn-maroon-deep)]">
              Lost Something on <em className="text-[var(--fn-maroon)]">Campus?</em>
            </h1>
            <p className="mt-7 max-w-[30rem] text-[clamp(1.1rem,1.8vw,1.35rem)] text-[var(--fn-muted)]">
              We&apos;re here to help you find it.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
              <Link to="/login" className="fn-btn fn-btn--primary !min-h-[56px] !px-8 !text-base">
                Submit a Lost Report
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <a href="#how-it-works" onClick={(e) => scrollToSection("how-it-works", e)} className="fn-link">
                See how it works <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <dl className="mt-14 grid max-w-[34rem] grid-cols-3 gap-6 border-t border-[var(--fn-rule)] pt-6">
              {[
                ["Report", "online, any time"],
                ["Match", "against found items"],
                ["Claim", "at a campus office"],
              ].map(([term, text]) => (
                <div key={term}>
                  <dt className="fn-display text-xl text-[var(--fn-maroon)]">{term}</dt>
                  <dd className="mt-1 text-[0.8rem] leading-snug text-[var(--fn-muted)]">{text}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal delay={120} className="lg:col-span-5">
          <div className="relative mx-auto max-w-[620px] pb-12 pl-0 sm:pl-6 lg:max-w-none">
            <div aria-hidden="true" className="absolute right-0 top-8 hidden h-[88%] w-[88%] rounded-[var(--fn-r-lg)] bg-[var(--fn-gold)] sm:block" />
            <img
              src={campus}
              alt="The red-roofed entrance of Bulacan State University under a blue sky"
              decoding="async"
              fetchPriority="high"
              className="relative h-[340px] w-full rounded-[var(--fn-r-lg)] rounded-tl-[120px] object-cover object-[72%_50%] shadow-[0_40px_60px_-40px_rgba(94,7,7,0.7)] sm:h-[460px] lg:h-[560px]"
            />
            <div className="absolute -bottom-0 left-0 right-4 flex overflow-hidden rounded-[var(--fn-r-md)] bg-white shadow-[0_30px_50px_-26px_rgba(94,7,7,0.65)] sm:right-auto sm:w-[360px]">
              <div className="flex-1 p-5">
                <p className="fn-display text-[1.25rem] leading-tight text-[var(--fn-maroon)]">Found something?</p>
                <p className="mt-2 text-[0.82rem] leading-relaxed text-[var(--fn-muted)]">
                  Hand it to the nearest campus Lost and Found office and the admin team will log it.
                </p>
              </div>
              <a
                href="#office-map"
                onClick={(e) => scrollToSection("office-map", e)}
                aria-label="Find the nearest Lost and Found office"
                className="grid w-[72px] shrink-0 place-items-center bg-[var(--fn-maroon)] text-white transition-colors hover:bg-[var(--fn-maroon-deep)]"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-white/80">
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </span>
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* How it works                                                                                */
/* ------------------------------------------------------------------------------------------ */

const STEPS = [
  {
    n: "01",
    category: "STEP 01: REPORT ONLINE",
    title: "Submit a Lost Report",
    text: "File your lost item details on your account to start the tracking process instantly.",
    Visual: ReportVignette,
  },
  {
    n: "02",
    category: "STEP 02: MATCH & TRACK",
    title: "Automated Item Matching",
    text: "Our smart system compares your report details with surrendered inventory logs to speed up recovery.",
    Visual: MatchVignette,
  },
  {
    n: "03",
    category: "STEP 03: CLAIM ITEM",
    title: "Verify & Recover",
    text: "Visit the designated office where your item is stored, verify, and claim your belonging.",
    Visual: ClaimVignette,
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" tabIndex={-1} className="fn-section bg-[var(--fn-paper)]">
      <div className="fn-container">
        <Reveal className="max-w-2xl">
          <p className="fn-eyebrow">Three steps</p>
          <h2 className="fn-display mt-4 text-[clamp(2.2rem,5vw,4rem)] text-[var(--fn-maroon-deep)]">How It Works</h2>
        </Reveal>

        <div className="mt-14 space-y-20 lg:mt-20 lg:space-y-32">
          {STEPS.map(({ n, category, title, text, Visual }, index) => {
            const flip = index % 2 === 1;
            return (
              <div key={n} className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
                <Reveal className={`lg:col-span-7 ${flip ? "lg:order-2" : ""}`}>
                  <Visual />
                </Reveal>
                <Reveal delay={120} className={`relative lg:col-span-5 ${flip ? "lg:order-1" : ""}`}>
                  <span
                    aria-hidden="true"
                    className="fn-display pointer-events-none absolute -top-14 left-0 select-none text-[7rem] leading-none text-transparent lg:-top-20 lg:text-[9rem]"
                    style={{ WebkitTextStroke: "1.5px rgba(153,0,0,0.28)" }}
                  >
                    {n}
                  </span>
                  <div className="relative pt-14 lg:pt-16">
                    <p className="fn-eyebrow">{category}</p>
                    <h3 className="fn-display mt-4 text-[clamp(1.8rem,3.2vw,2.6rem)] text-[var(--fn-ink)]">{title}</h3>
                    <p className="mt-5 max-w-[30rem] text-[1.02rem] text-[var(--fn-muted)]">{text}</p>
                    <div className="fn-rule mt-8 max-w-[30rem]" />
                  </div>
                </Reveal>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Smart QR-powered recovery                                                                   */
/* ------------------------------------------------------------------------------------------ */

function QrFeatures() {
  return (
    <section id="qr-features" tabIndex={-1} className="fn-section bg-[var(--fn-paper)]">
      <div className="fn-container">
        <Reveal className="max-w-3xl">
          <h2 className="fn-display text-[clamp(2rem,4.6vw,3.6rem)] text-[var(--fn-maroon-deep)]">
            Smart QR-Powered Recovery
          </h2>
          <p className="mt-5 max-w-2xl text-[1.02rem] text-[var(--fn-muted)]">
            Tag your item before it gets lost for instant identification and ownership tracking.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-12">
          <Reveal className="relative overflow-hidden rounded-[var(--fn-r-lg)] bg-[var(--fn-maroon)] p-8 text-white sm:p-10 lg:col-span-5 lg:row-span-2 lg:flex lg:flex-col lg:justify-between lg:p-12">
            <QrCode aria-hidden="true" strokeWidth={1} className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 text-white/10" />
            <span className="relative grid h-16 w-16 place-items-center rounded-full bg-white text-[var(--fn-maroon)]">
              <QrCode className="h-8 w-8" aria-hidden="true" />
            </span>
            <div className="relative mt-16 lg:mt-0">
              <h3 className="fn-display text-[clamp(1.9rem,3vw,2.5rem)]">Register Your Item</h3>
              <p className="mt-4 max-w-sm text-white/85">
                Register your belongings and generate an identifying QR code.
              </p>
              <Link to="/login" className="fn-btn fn-btn--light mt-8">
                Sign in to register
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>

          <Reveal
            delay={100}
            className="flex flex-col gap-6 rounded-[var(--fn-r-lg)] border border-[var(--fn-rule)] bg-[var(--fn-cream)] p-8 sm:flex-row sm:items-start sm:p-10 lg:col-span-7"
          >
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[var(--fn-r-md)] bg-[var(--fn-sand)] text-[var(--fn-maroon)]">
              <Boxes className="h-7 w-7" aria-hidden="true" />
            </span>
            <div>
              <h3 className="fn-display text-[clamp(1.6rem,2.4vw,2rem)] text-[var(--fn-ink)]">View Registered Items</h3>
              <p className="mt-3 text-[var(--fn-muted)]">
                Access your registered belongings and manage their associated records through your account.
              </p>
            </div>
          </Reveal>

          <Reveal
            delay={200}
            className="flex flex-col gap-6 rounded-[var(--fn-r-lg)] bg-[var(--fn-gold)] p-8 sm:flex-row sm:items-start sm:p-10 lg:col-span-7"
          >
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[var(--fn-r-md)] bg-white/70 text-[var(--fn-maroon-deep)]">
              <ScanLine className="h-7 w-7" aria-hidden="true" />
            </span>
            <div>
              <h3 className="fn-display text-[clamp(1.6rem,2.4vw,2rem)] text-[var(--fn-maroon-deep)]">Scan &amp; Verify</h3>
              <p className="mt-3 text-[var(--fn-ink)]/80">
                Scan a supported QR code to access the relevant identification details.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Warm accent banner                                                                          */
/* ------------------------------------------------------------------------------------------ */

function HelpBanner() {
  return (
    <section id="help" tabIndex={-1} className="relative overflow-hidden bg-[var(--fn-gold)] py-20 outline-none lg:py-28">
      {/* the heart sits inside the ring so the two always share the same centre */}
      <div aria-hidden="true" className="absolute -right-28 top-1/2 hidden h-[560px] w-[560px] -translate-y-1/2 place-items-center rounded-full border-[56px] border-white/25 lg:grid">
        <img src={happyHeart} alt="" className="h-[300px] w-[300px] object-contain" />
      </div>

      <div className="fn-container relative">
        <Reveal className="max-w-[44rem]">
          <p className="fn-eyebrow !text-[var(--fn-maroon-deep)]">Help return lost items</p>
          <h2 className="fn-display mt-5 text-[clamp(2.1rem,5vw,4rem)] text-[var(--fn-maroon-deep)]">
            Found an item on campus? You can help too.
          </h2>
          <p className="mt-6 max-w-[38rem] text-[1.05rem] text-[var(--fn-ink)]/85">
            If you&apos;ve picked up a missing item, simply hand it over to the nearest campus Lost and Found office. Our
            admin team will securely register and tag the item so its owner can safely retrieve it.
          </p>
          <a href="#office-map" onClick={(e) => scrollToSection("office-map", e)} className="fn-btn fn-btn--dark mt-9 !min-h-[54px]">
            Find Nearest Office Map <ArrowUp className="h-4 w-4" aria-hidden="true" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Final call to action                                                                        */
/* ------------------------------------------------------------------------------------------ */

// Asks before the (large) APK download starts. Escape / backdrop / Cancel dismiss it (the caller
// puts focus back on the button that opened it).
function DownloadDialog({ onClose }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    confirmRef.current?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center px-5" role="presentation">
      <div className="absolute inset-0 bg-[var(--fn-ink)]/60" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-title"
        aria-describedby="download-desc"
        className="fn-on-dark relative w-full max-w-[26rem] rounded-[var(--fn-r-lg)] bg-[var(--fn-paper)] p-7 text-[var(--fn-ink)] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)] sm:p-9"
      >
        <h3 id="download-title" className="fn-display text-[1.7rem] text-[var(--fn-maroon-deep)]">
          Download the FoundNest app?
        </h3>
        <p id="download-desc" className="mt-3 text-[0.95rem] text-[var(--fn-muted)]">
          This will download the Android app file ({APP_DOWNLOAD_FILENAME}) to your device. It is a large file, so a Wi-Fi
          connection is recommended.
        </p>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="fn-btn fn-btn--outline">
            Cancel
          </button>
          <a
            ref={confirmRef}
            href={APP_DOWNLOAD_URL}
            download={APP_DOWNLOAD_FILENAME}
            rel="noopener noreferrer"
            onClick={onClose}
            className="fn-btn fn-btn--primary"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download
          </a>
        </div>
      </div>
    </div>
  );
}

function DownloadCta() {
  const [confirming, setConfirming] = useState(false);
  const triggerRef = useRef(null);
  const closeConfirm = useCallback(() => {
    setConfirming(false);
    triggerRef.current?.focus();
  }, []);

  return (
    <section id="download" tabIndex={-1} className="fn-on-dark relative overflow-hidden bg-[var(--fn-maroon-deep)] py-16 text-white outline-none lg:py-20">
      <img
        src={logo}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="pointer-events-none absolute -right-10 top-1/2 hidden h-[360px] w-[360px] -translate-y-1/2 object-contain opacity-[0.22] brightness-0 invert lg:block"
      />
      <div className="fn-container relative">
        <Reveal className="max-w-[40rem]">
          <h2 className="fn-display text-[clamp(1.9rem,4vw,3.1rem)]">Experience faster lost &amp; found recovery on the go.</h2>

          <button
            ref={triggerRef}
            type="button"
            onClick={() => setConfirming(true)}
            aria-haspopup="dialog"
            className="fn-btn fn-btn--light mt-9 !min-h-[54px] tracking-wider"
          >
            <Download className="h-5 w-5" aria-hidden="true" />
            DOWNLOAD THE APP
          </button>
        </Reveal>
      </div>

      {confirming && <DownloadDialog onClose={closeConfirm} />}
    </section>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Footer                                                                                      */
/* ------------------------------------------------------------------------------------------ */

function Footer() {
  const linkClass = "text-[0.92rem] text-white/80 underline-offset-4 transition-colors hover:text-white hover:underline";

  return (
    <footer className="fn-on-dark bg-[var(--fn-ink)] pb-10 pt-14 text-white">
      <div className="fn-container">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="" className="h-10 w-10 object-contain brightness-0 invert" />
              <span className="fn-display text-2xl">FoundNest</span>
            </div>
            <p className="mt-4 max-w-sm text-[0.95rem] text-white/75">
              FoundNest · Bulacan State University Lost and Found System
            </p>
          </div>

          <nav aria-label="Footer" className="md:col-span-6 md:justify-self-end">
            <ul className="grid grid-cols-2 gap-x-12 gap-y-3 sm:grid-cols-3">
              <li>
                <a href="#top" onClick={(e) => scrollToSection("top", e)} className={linkClass}>
                  Home
                </a>
              </li>
              <li>
                <a href="#how-it-works" onClick={(e) => scrollToSection("how-it-works", e)} className={linkClass}>
                  How It Works
                </a>
              </li>
              <li>
                <a href="#office-map" onClick={(e) => scrollToSection("office-map", e)} className={linkClass}>
                  Office Map
                </a>
              </li>
              <li>
                <Link to="/find" className={linkClass}>
                  Browse Items
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 border-t border-white/15 pt-6 text-sm text-white/65">
          © 2026 FoundNest Capstone Project. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------------------------------ */
/* Page                                                                                        */
/* ------------------------------------------------------------------------------------------ */

function LandingContent() {
  const activeSection = useActiveSection(NAV_LINKS.map((link) => link.id));

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "FoundNest | Bulacan State University Lost and Found";

    // Deep links such as /#office-map
    const id = window.location.hash.slice(1);
    const timer = id ? window.setTimeout(() => scrollToSection(id), 150) : null;

    return () => {
      document.title = previousTitle;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="fn-landing min-h-screen">
      <a
        href="#main"
        onClick={(e) => scrollToSection("main", e)}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <Header active={activeSection} />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <HowItWorks />
        <OfficeLocator />
        <RecentItems />
        <QrFeatures />
        <HelpBanner />
        <DownloadCta />
      </main>
      <Footer />
    </div>
  );
}

// Signed-in users skip the marketing page, exactly as the previous landing page did
export default function LandingPage() {
  if (localStorage.getItem("token")) return <Navigate to="/login" replace />;
  return <LandingContent />;
}
