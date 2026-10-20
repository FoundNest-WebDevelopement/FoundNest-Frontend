import { Link } from "react-router-dom";
import { ArrowRight, Dumbbell, Headphones, IdCard, KeyRound, MapPin, Shirt, Smartphone, Tag, Umbrella, Wallet } from "lucide-react";
import { PREVIEW_ITEMS } from "./config";
import { Reveal } from "./ui";

const ICONS = { Umbrella, Smartphone, Wallet, IdCard, Headphones, Shirt, Dumbbell, KeyRound };
const TONES = ["bg-[#F4DFC3]", "bg-[#F6C9C0]", "bg-[#E9E1D2]", "bg-[#F2D79A]"];

// Cards only react to hovering: they are display-only previews, not links
function ItemCard({ item, index }) {
  const Icon = ICONS[item.icon] ?? Tag;

  return (
    <article className="w-[240px] overflow-hidden rounded-[var(--fn-r-md)] border border-[var(--fn-rule)] bg-[var(--fn-paper)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_40px_-24px_rgba(94,7,7,0.55)] sm:w-[280px]">
      <div className={`grid aspect-[4/3] place-items-center ${TONES[index % TONES.length]}`}>
        <Icon className="h-16 w-16 text-[var(--fn-maroon-deep)]/80" strokeWidth={1.4} aria-hidden="true" />
      </div>
      <div className="p-5">
        <p className="fn-eyebrow !text-[0.66rem]">{item.category}</p>
        <h3 className="fn-display mt-2 text-[1.35rem] leading-tight text-[var(--fn-ink)]">{item.name}</h3>
        <p className="mt-3 flex items-center gap-1.5 text-sm text-[var(--fn-muted)]">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{item.place}</span>
        </p>
      </div>
    </article>
  );
}

export default function RecentItems() {
  return (
    <section id="recent-items" tabIndex={-1} className="fn-section">
      <div className="fn-container">
        <Reveal className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="fn-eyebrow">Campus inventory</p>
            <h2 className="fn-display mt-4 text-[clamp(2rem,4.4vw,3.4rem)] text-[var(--fn-maroon-deep)]">
              Browse Recent Found Items
            </h2>
            <p className="mt-5 text-[1.02rem] text-[var(--fn-muted)]">
              Browse surrendered items currently logged into our campus inventory.
            </p>
          </div>
          <Link to="/find" className="fn-link self-start text-lg lg:self-auto">
            Browse All Items <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </Reveal>

        {/* A looping row: the cards are rendered twice and the track slides left by exactly one copy */}
        <div className="fn-marquee mt-10" role="region" aria-roledescription="carousel" aria-label="Recent found items">
          <div className="fn-marquee-track">
            <div className="fn-marquee-group">
              {PREVIEW_ITEMS.map((item, index) => (
                <ItemCard key={`a-${item.id}`} item={item} index={index} />
              ))}
            </div>
            <div className="fn-marquee-group" aria-hidden="true">
              {PREVIEW_ITEMS.map((item, index) => (
                <ItemCard key={`b-${item.id}`} item={item} index={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
