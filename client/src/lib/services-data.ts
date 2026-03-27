import { Home, Sparkles, Building, CalendarCheck, ArrowRightLeft } from "lucide-react";

export const servicesData = {
  "residential": {
    id: "residential",
    title: "Residential Cleaning",
    shortDesc: "Professional home cleaning for regular upkeep and maintenance.",
    tagline: "Your home, refreshed — every single time.",
    icon: Home,
    color: "bg-blue-500/15 text-blue-400",
    accentGradient: "from-blue-500/10 via-blue-400/5 to-transparent",
    accentBorder: "border-blue-500/30/60",
    accentBg: "bg-blue-500/10",
    iconAccent: "text-blue-400",
    patternClass: "service-pattern-residential",
    description: "Our standard residential cleaning service is perfect for maintaining a beautiful, stress-free home. We focus on the essential areas of your house, ensuring a consistent level of cleanliness that you can rely on.",
    idealFor: "Busy professionals, families, and anyone looking for weekly, bi-weekly, or monthly home maintenance.",
    includes: [
      "Dusting all accessible surfaces",
      "Wiping down kitchen counters and exterior appliances",
      "Sanitizing bathrooms (sinks, toilets, showers, tubs)",
      "Vacuuming carpets and rugs",
      "Sweeping and mopping hard floors",
      "Emptying trash bins"
    ],
    faqs: [
      { q: "How often should I schedule residential cleaning?", a: "Most of our clients prefer bi-weekly cleanings to keep their homes consistently fresh, but we also offer weekly and monthly options." },
      { q: "Do I need to be home during the cleaning?", a: "No, you don't need to be home. Many clients provide a spare key or entry code. We ensure your home is secure when we leave." }
    ]
  },
  "deep-cleaning": {
    id: "deep-cleaning",
    title: "Deep Cleaning",
    shortDesc: "A top-to-bottom refresh covering areas often missed in standard cleans.",
    tagline: "Beyond the surface — a complete reset for your space.",
    icon: Sparkles,
    color: "bg-primary/10 text-primary",
    accentGradient: "from-emerald-500/10 via-emerald-400/5 to-transparent",
    accentBorder: "border-emerald-200/60",
    accentBg: "bg-emerald-500/10",
    iconAccent: "text-emerald-400",
    patternClass: "service-pattern-deep",
    description: "Our deep cleaning service provides a comprehensive, top-to-bottom refresh of your living space. We utilize hospital-grade, eco-friendly products to ensure a pristine and healthy environment. This service tackles the hard-to-reach areas and built-up grime.",
    idealFor: "Spring cleaning, preparing for holidays or events, or homes that haven't been professionally cleaned in the past 3 months.",
    includes: [
      "Baseboards & trim detailing",
      "Interior window & sill cleaning",
      "Deep scrub of kitchen appliances (exterior and accessible interior parts)",
      "Detailed bathroom sanitization & polishing (including grout lines)",
      "High-dusting & cobweb removal",
      "Under and behind accessible furniture"
    ],
    faqs: [
      { q: "What's the difference between standard and deep cleaning?", a: "Deep cleaning includes detailed work like baseboards, interior windows, high-dusting, and a much more thorough scrub of bathrooms and kitchens." },
      { q: "How long does a deep clean take?", a: "It typically takes 1.5 to 2 times longer than a standard clean, depending on the size and condition of your home." }
    ]
  },
  "commercial": {
    id: "commercial",
    title: "Commercial & Janitorial",
    shortDesc: "Reliable, discreet maintenance for professional environments.",
    tagline: "Spotless workspaces that mean business.",
    icon: Building,
    color: "bg-secondary text-foreground",
    accentGradient: "from-slate-500/10 via-slate-400/5 to-transparent",
    accentBorder: "border-slate-200/60",
    accentBg: "bg-slate-500/10",
    iconAccent: "text-slate-400",
    patternClass: "service-pattern-commercial",
    description: "We provide reliable, discreet maintenance for professional environments. We keep your workspace spotless so your team can focus on what they do best. A clean office improves employee morale and leaves a great impression on clients.",
    idealFor: "Offices, retail spaces, medical facilities, and professional buildings requiring consistent, high-quality upkeep.",
    includes: [
      "Nightly, weekly, or custom cleaning schedules",
      "Restroom sanitization & restocking of consumables",
      "Waste & recycling management",
      "Hard floor care & maintenance",
      "Breakroom & kitchen detailing",
      "Workstation dusting & sanitizing"
    ],
    faqs: [
      { q: "Can you clean after business hours?", a: "Yes, we offer flexible scheduling including evenings and weekends to minimize disruption to your business." },
      { q: "Are you insured for commercial properties?", a: "Absolutely. We are fully bonded and insured with comprehensive liability coverage for commercial operations." }
    ]
  },
  "vacation-rentals": {
    id: "vacation-rentals",
    title: "Vacation Rental Turnovers",
    shortDesc: "Fast, flawless resets for Airbnb, VRBO, and short-term rentals.",
    tagline: "Five-star turnovers, every guest, every time.",
    icon: CalendarCheck,
    color: "bg-orange-500/15 text-orange-400",
    accentGradient: "from-orange-500/10 via-orange-400/5 to-transparent",
    accentBorder: "border-orange-200/60",
    accentBg: "bg-orange-500/10",
    iconAccent: "text-orange-400",
    patternClass: "service-pattern-vacation",
    description: "Fast, flawless resets for Airbnb, VRBO, and short-term rentals. We understand that five-star reviews depend on perfect cleanliness, and we deliver consistency every time. We treat your property like a hospitality business.",
    idealFor: "Airbnb hosts, VRBO owners, and short-term property managers seeking reliable, hotel-quality turnovers.",
    includes: [
      "Same-day rapid turnover scheduling",
      "Linens & laundry service (washing, drying, and making beds)",
      "Consumables restocking (toilet paper, paper towels, soaps)",
      "Damage reporting & photo logs of the property condition",
      "Staging property to host specifications",
      "Checking and securing all doors and windows"
    ],
    faqs: [
      { q: "Do you provide laundry services off-site?", a: "We typically utilize on-site laundry facilities if available to maximize efficiency, but off-site options can be arranged depending on location." },
      { q: "What happens if a guest leaves a huge mess or damages property?", a: "We immediately document the situation with photos and notify you before proceeding, so you can handle security deposits appropriately." }
    ]
  },
  "move-in-out": {
    id: "move-in-out",
    title: "Move-In / Move-Out",
    shortDesc: "Complete property reset for new tenants or owners.",
    tagline: "A blank canvas for every new beginning.",
    icon: ArrowRightLeft,
    color: "bg-purple-500/15 text-purple-400",
    accentGradient: "from-purple-500/10 via-purple-400/5 to-transparent",
    accentBorder: "border-purple-200/60",
    accentBg: "bg-purple-500/10",
    iconAccent: "text-purple-400",
    patternClass: "service-pattern-moveinout",
    description: "Whether you're a homeowner, renter, property manager, Realtor, or landlord, The Maine Cleaning Co. provides top-to-bottom detailed cleanings that meet the highest standards. We ensure the property is completely neutralized and ready for its next chapter.",
    idealFor: "Tenants trying to secure their security deposit, homeowners preparing a house for sale, or buyers wanting a fresh start in a new home.",
    includes: [
      "Inside all cabinets and drawers (kitchen and bathrooms)",
      "Refrigerator and oven deep cleaning (interior and exterior)",
      "Full bathroom sanitization",
      "Baseboards, trims, and doors washed",
      "Interior windows, sills, and tracks",
      "Thorough vacuuming and floor washing in all empty rooms"
    ],
    faqs: [
      { q: "Does the house need to be completely empty?", a: "Yes, for a true Move-In/Move-Out clean, the property must be free of furniture and personal belongings." },
      { q: "Do you clean the carpets professionally?", a: "We provide thorough vacuuming. Hot water extraction (steam cleaning) for carpets is a separate specialized service." }
    ]
  }
};

export const getServicesList = () => Object.values(servicesData);
