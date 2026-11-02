import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { StudioLockup } from "./StudioLogo";
import { brand } from "@/lib/brand";

/**
 * The business site's navigation.
 *
 * Four destinations and one call to action, which is the whole site. The
 * cleaning company's bar had grown to eight links plus a phone number, two
 * CTAs and a theme toggle, and was clipping "Book Now" off the right edge at
 * ordinary laptop widths — the lesson being that a nav is a budget, not a
 * list of every page you own.
 *
 * "Live demo" is a nav item rather than a footer link on purpose: it is the
 * single most persuasive thing here, and burying it would be a mistake.
 */
const links = [
  { href: "/systems", label: "What gets built" },
  { href: "/proof", label: "Proof" },
  { href: "/process", label: "How it works" },
];

export default function StudioNav() {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // rAF-throttled, and only setState when the boolean actually flips —
    // same reasoning as the cleaning navbar: a setState per scroll pixel
    // re-renders the whole bar and costs mobile frames for nothing.
    let raf = 0;
    let last = window.scrollY > 12;
    setScrolled(last);
    const check = () => {
      raf = 0;
      const next = window.scrollY > 12;
      if (next !== last) {
        last = next;
        setScrolled(next);
      }
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => setOpen(false), [location]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "navbar-glass py-3.5" : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-5 sm:px-8 flex items-center justify-between gap-4">
        <Link href="/" className="flex-shrink-0 group" aria-label={`${brand.name} — home`} data-testid="link-studio-home">
          <span className="hidden sm:block">
            <StudioLockup size="md" showTagline />
          </span>
          <span className="block sm:hidden">
            <StudioLockup size="sm" />
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`relative px-4 py-2 text-[13.5px] font-medium rounded-xl tracking-wide transition-colors duration-200 ${
                location === l.href
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`link-nav-${l.href.slice(1)}`}
            >
              {l.label}
              {location === l.href && (
                <motion.span
                  layoutId="studio-nav-dot"
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2.5">
          {/* A real, running system beats any amount of copy, so it gets a
              permanent slot rather than a mention at the bottom of a page. */}
          <a
            href={brand.demoPath}
            className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors px-2"
            data-testid="link-nav-demo" rel="nofollow">
            <Play className="w-3.5 h-3.5 text-primary/70" /> Live demo
          </a>
          <ThemeToggle />
          <Link href="/contact">
            <Button
              size="sm"
              className="rounded-full px-5 h-9 text-[13px] font-semibold tracking-wide gap-1.5"
              data-testid="button-nav-contact"
            >
              Book a call <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        <div className="lg:hidden flex items-center gap-1">
          <ThemeToggle />
          <button
            className="p-2.5 -mr-1.5 text-foreground rounded-xl hover:bg-secondary/50 active:bg-secondary/70 transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
            data-testid="button-mobile-menu"
          >
            <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.div>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="lg:hidden navbar-glass border-t-0 overflow-hidden absolute top-full left-0 right-0 z-50"
            >
              <nav className="flex flex-col px-6 pt-4 pb-7 gap-0.5">
                {links.map((l, i) => (
                  <motion.div
                    key={l.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={l.href}
                      className={`flex items-center py-3.5 px-4 rounded-2xl text-[15px] font-medium transition-colors ${
                        location === l.href
                          ? "text-foreground font-semibold bg-secondary/40"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/20"
                      }`}
                      data-testid={`link-mobile-${l.href.slice(1)}`}
                    >
                      {l.label}
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: links.length * 0.04 + 0.06, duration: 0.28 }}
                  className="pt-3 space-y-2.5"
                >
                  <a href={brand.demoPath} data-testid="link-mobile-demo" rel="nofollow">
                    <Button variant="outline" className="rounded-full h-12 w-full text-[15px] font-medium border-border gap-2">
                      <Play className="w-4 h-4" /> See a live system
                    </Button>
                  </a>
                  <Link href="/contact">
                    <Button className="rounded-full h-12 w-full text-[15px] font-semibold gap-2" data-testid="button-mobile-contact">
                      Book a call <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </motion.div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
