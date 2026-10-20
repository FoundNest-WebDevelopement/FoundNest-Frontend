import { Bell, Link2, MapPin, PackageCheck, ShieldCheck, Umbrella } from "lucide-react";
import campus from "../assets/login-bg.jpg";

// The three "How It Works" visuals. They are small, honest vignettes of what the app does
// (report form → potential match → claim at an office), drawn in HTML so they stay crisp at
// every size. The values inside are illustration only, not records.

const panel = "relative overflow-hidden rounded-[var(--fn-r-lg)]";

export function ReportVignette() {
  return (
    <div className={`${panel} bg-[var(--fn-sand)] px-6 py-10 sm:px-12 sm:py-14`}>
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-60"
        style={{ backgroundImage: "radial-gradient(rgba(153,0,0,0.18) 1.2px, transparent 1.2px)", backgroundSize: "22px 22px" }}
      />
      <div className="relative mx-auto max-w-[400px] -rotate-2 overflow-hidden rounded-[var(--fn-r-md)] bg-white shadow-[0_30px_50px_-30px_rgba(94,7,7,0.6)]">
        <div className="bg-[var(--fn-maroon)] px-5 py-4 text-lg font-bold text-white">Lost Item Report Form</div>
        <div className="space-y-4 p-5 text-[0.82rem]">
          <div>
            <p className="font-bold">Category <span className="text-[var(--fn-maroon)]">*</span></p>
            <p className="mt-1.5 rounded-lg border border-[var(--fn-rule)] px-3 py-2.5 text-[var(--fn-muted)]">Personal Items</p>
          </div>
          <div>
            <p className="font-bold">Item Name <span className="text-[var(--fn-maroon)]">*</span></p>
            <p className="mt-1.5 rounded-lg border border-[var(--fn-rule)] px-3 py-2.5">Black umbrella</p>
          </div>
          <div>
            <p className="font-bold">Detailed Description</p>
            <div className="mt-1.5 space-y-2 rounded-lg border border-[var(--fn-rule)] p-3">
              <span className="block h-2 w-11/12 rounded bg-black/10" />
              <span className="block h-2 w-8/12 rounded bg-black/10" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[var(--fn-muted)]">Page 1 out of 2</span>
            <span className="rounded-lg bg-[var(--fn-maroon)] px-6 py-2.5 font-semibold text-white">Next</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniCard({ label, name, tone }) {
  return (
    <div className="w-full rounded-[var(--fn-r-md)] bg-white p-3 shadow-[0_18px_30px_-22px_rgba(94,7,7,0.6)]">
      <div className={`grid aspect-[5/4] place-items-center rounded-xl ${tone}`}>
        <Umbrella className="h-12 w-12 text-[var(--fn-maroon-deep)]/80" strokeWidth={1.4} aria-hidden="true" />
      </div>
      <p className="mt-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--fn-maroon)]">{label}</p>
      <p className="text-sm font-semibold">{name}</p>
    </div>
  );
}

export function MatchVignette() {
  return (
    <div className={`${panel} bg-[var(--fn-gold)] px-6 py-10 sm:px-12 sm:py-14`}>
      <div className="relative mx-auto grid max-w-[440px] grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
        <MiniCard label="Your report" name="Black umbrella" tone="bg-[#F4DFC3]" />
        <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--fn-maroon-deep)] text-white shadow-lg">
          <Link2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <MiniCard label="Found item" name="Folding umbrella" tone="bg-[#F6C9C0]" />
      </div>
      <div className="relative mx-auto mt-6 flex max-w-[440px] items-center justify-between gap-3 rounded-full bg-white py-2 pl-5 pr-2 shadow-lg">
        <span className="text-sm font-bold text-[var(--fn-maroon-deep)]">Potential Match Found!</span>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--fn-maroon)] text-white">
          <Bell className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

const claimSteps = [
  { Icon: MapPin, text: "Go to the designated office" },
  { Icon: ShieldCheck, text: "Verify it is yours" },
  { Icon: PackageCheck, text: "Claim your belonging" },
];

export function ClaimVignette() {
  return (
    <div className="relative pb-12 pl-0 sm:pl-10">
      <img
        src={campus}
        alt="The Bulacan State University building entrance, with its red roof and signage"
        loading="lazy"
        decoding="async"
        className="h-[300px] w-full rounded-[var(--fn-r-lg)] object-cover object-[78%_60%] sm:h-[380px]"
      />
      <ul className="absolute bottom-0 left-4 right-4 space-y-3 rounded-[var(--fn-r-md)] bg-white p-5 shadow-[0_30px_50px_-28px_rgba(94,7,7,0.7)] sm:left-0 sm:right-auto sm:w-[320px]">
        {claimSteps.map(({ Icon, text }) => (
          <li key={text} className="flex items-center gap-3 text-sm font-semibold">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--fn-sand)] text-[var(--fn-maroon)]">
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
