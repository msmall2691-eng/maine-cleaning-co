import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

/**
 * Testimonials, as buoys on a mooring field.
 *
 * The real Google reviews, unchanged — they were already on the homepage and
 * they are the most persuasive thing on it.
 *
 * Each buoy bobs on its OWN period and delay (set inline as custom
 * properties). That is the whole trick: six cards sharing one animation read
 * as "a CSS animation", and six cards on periods of 5.4s, 6.1s, 6.8s… read as
 * objects floating on the same water. No two line up for minutes at a time.
 *
 * The carousel underneath is a plain scroll container with snap points, not a
 * JS-driven slider. That buys, free: native touch momentum, a real scrollbar
 * for anyone who wants it, working browser find-in-page across every card,
 * and no "slide 3 of 6" state to get out of sync. The arrow buttons just
 * scroll it, and the arrow KEYS do too.
 */

const reviews = [
  {
    text: "Dependable and great attention to detail with every cleaning. We have used Megan and her team for all our Air BnB turnovers and have been lucky to have such a professional overseeing the cleaning services.",
    author: "Jessica M.",
    date: "Sep 2021",
  },
  {
    text: "I have been with The Maine Cleaning Co. for a year now and Megan and her team are amazing. They do a fantastic job cleaning. I have had to cancel and reschedule a few times and they have always been kind and accommodating.",
    author: "Eva B.",
    date: "Sep 2024",
  },
  {
    text: "I love working with Maine Cleaning! The level of communication is phenomenal and the knowledge of the cleaners is incredible! They clean things I didn't even know needed to be cleaned!",
    author: "Erin P.",
    date: "Sep 2022",
  },
  {
    text: "The Maine Cleaning Co. does such an amazing job for our facility. They are so flexible and willing to go the extra mile, we couldn't be happier. So friendly and always with a smile!",
    author: "Krystal F.",
    date: "Sep 2024",
  },
  {
    text: "Professional, timely and did a wonderful job. We were very pleased.",
    author: "Michele",
    date: "Mar 2025",
  },
  {
    text: "Tried a couple other cleaning companies before finding The Maine Cleaning Co. These folks do an excellent job.",
    author: "Trevor L.",
    date: "Sep 2024",
  },
];

export function Buoys() {
  const trackRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const syncEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    // 2px of slack: sub-pixel layout means scrollLeft rarely hits the exact
    // maximum, and a "next" button that never disables is worse than none.
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    syncEdges();
    el.addEventListener("scroll", syncEdges, { passive: true });
    window.addEventListener("resize", syncEdges);
    return () => {
      el.removeEventListener("scroll", syncEdges);
      window.removeEventListener("resize", syncEdges);
    };
  }, [syncEdges]);

  const scrollByCard = useCallback((direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector("li");
    // Fall back to most of a viewport if the cards have not laid out yet.
    const step = card ? card.getBoundingClientRect().width + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: step * direction, behavior: "smooth" });
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollByCard(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollByCard(-1);
      }
    },
    [scrollByCard],
  );

  return (
    <section
      id="reviews"
      className="shore-section scroll-mt-20 bg-background py-24"
      aria-labelledby="shore-reviews-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="type-eyebrow">Reviews</p>
            <h2 id="shore-reviews-heading" className="type-h2 mt-4 text-foreground">
              What our customers say
            </h2>
            <p className="type-lead mt-5 max-w-lg">
              Six of the reviews left on Google, as written.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              disabled={atStart}
              aria-label="Previous reviews"
              className="shore-focus flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-opacity disabled:opacity-35"
              data-testid="button-reviews-prev"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              disabled={atEnd}
              aria-label="More reviews"
              className="shore-focus flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-opacity disabled:opacity-35"
              data-testid="button-reviews-next"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* tabIndex 0 + a role and label: a scrollable region must be
            reachable and operable by keyboard, and announced as one. */}
        <ul
          ref={trackRef}
          onKeyDown={onKeyDown}
          tabIndex={0}
          role="region"
          aria-label="Customer reviews, scrollable"
          className="shore-focus mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-6"
          data-testid="list-reviews"
        >
          {reviews.map((review, i) => (
            <li
              key={review.author + review.date}
              className="buoy still w-[19rem] shrink-0 snap-start sm:w-[22rem]"
              style={{
                ["--bob-period" as string]: `${5.4 + i * 0.7}s`,
                ["--bob-delay" as string]: `${i * 0.45}s`,
                ["--bob-tilt" as string]: `${i % 2 === 0 ? -1 : 1}deg`,
              }}
            >
              <figure className="flex h-full flex-col rounded-3xl border border-border bg-card p-6">
                <div className="flex gap-0.5" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                {/* The rating in words, once, for anyone not reading the
                    stars — the icons above are decorative duplicates. */}
                <span className="sr-only">Rated 5 out of 5.</span>
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground">
                  {review.text}
                </blockquote>
                <figcaption className="mt-5 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{review.author}</span>
                  <span aria-hidden="true"> · </span>
                  {review.date}
                </figcaption>
              </figure>
              {/* The mooring line, running down out of the card. */}
              <div className="buoy-line mx-auto h-10 w-px" aria-hidden="true" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
