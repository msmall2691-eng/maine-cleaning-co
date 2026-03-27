import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { companyInfo } from "@/lib/company-info";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/service-areas", label: "Service Areas" },
  { href: "/short-term-rentals", label: "Airbnb & STR" },
  { href: "/blog", label: "Blog" },
];

export default function Navbar() {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 12);
    h();
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const scrollToEstimate = () => {
    setMobileMenuOpen(false);
    const el = document.getElementById("get-estimate") || document.getElementById("estimate-section-anchor");
    if (el) el.scrollIntoView({ behavior: "smooth" });
    else window.location.href = "/#get-estimate";
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${
        scrolled ? "navbar-glass py-4" : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto px-5 sm:px-8 flex items-center justify-between gap-4">
        {/* Wordmark */}
        <Link href="/" className="flex-shrink-0 group" data-testid="link-home-logo">
          <div className="flex flex-col leading-none">
            <span className="font-serif font-bold text-[15px] sm:text-[17px] md:text-[18px] tracking-[-0.01em] text-foreground group-hover:text-primary transition-colors duration-200">
              The Maine Cleaning Co.
            </span>
            <span className="text-[9.5px] sm:text-[10px] tracking-[0.1em] text-muted-foreground/70 uppercase font-medium hidden sm:block mt-0.5 group-hover:text-muted-foreground transition-colors">
              Est. 2018 · Southern Maine
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5 lg:gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative px-3.5 lg:px-4 py-2 text-[13px] lg:text-[13.5px] font-medium transition-colors duration-200 rounded-xl tracking-wide group ${
                location === link.href
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`link-nav-${link.label.toLowerCase().replace(/[^a-z]/g, "-")}`}
            >
              {link.label}
              {location === link.href && (
                <motion.span
                  layoutId="nav-active-dot"
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                />
              )}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-2.5">
          <a
            href={companyInfo.contact.phoneHref}
            className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors px-2"
            data-testid="link-nav-phone"
          >
            <Phone className="w-3.5 h-3.5 text-primary/70" />
            {companyInfo.contact.phoneDisplay}
          </a>
          <Button
            size="sm"
            className="rounded-full px-6 h-9 text-[13px] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.15)] tracking-wide"
            onClick={scrollToEstimate}
            data-testid="button-nav-estimate"
          >
            Get an Estimate
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2.5 -mr-1.5 text-foreground rounded-xl hover:bg-secondary/50 active:bg-secondary/70 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          data-testid="button-mobile-menu"
        >
          <motion.div
            animate={{ rotate: mobileMenuOpen ? 90 : 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.div>
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden navbar-glass border-t-0 overflow-hidden absolute top-full left-0 right-0 z-50"
            >
              <nav className="flex flex-col px-6 pt-4 pb-7 gap-0.5">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={link.href}
                      className={`flex items-center py-3.5 px-4 rounded-2xl text-[15px] font-medium active:bg-secondary/50 transition-colors ${
                        location === link.href
                          ? "text-foreground font-semibold bg-secondary/40"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/20"
                      }`}
                      data-testid={`link-mobile-${link.label.toLowerCase().replace(/[^a-z]/g, "-")}`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: navLinks.length * 0.04 + 0.06, duration: 0.28 }}
                  className="pt-3 space-y-2.5"
                >
                  <a href={companyInfo.contact.phoneHref} data-testid="link-mobile-phone">
                    <Button variant="outline" className="rounded-full h-12 w-full text-[15px] font-medium border-border gap-2">
                      <Phone className="w-4 h-4" /> {companyInfo.contact.phoneDisplay}
                    </Button>
                  </a>
                  <Button
                    className="rounded-full h-12 w-full text-[15px] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
                    onClick={scrollToEstimate}
                    data-testid="button-mobile-estimate"
                  >
                    Get an Estimate
                  </Button>
                </motion.div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
