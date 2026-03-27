import { useState } from "react";
import { ChevronDown, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChecklistCategory {
  title: string;
  items: string[];
}

type ChecklistVariant = "residential" | "deep" | "vacation-rental" | "move-in-out";

const residentialChecklist: ChecklistCategory[] = [
  {
    title: "Kitchen",
    items: [
      "Wipe countertops and backsplash",
      "Clean stovetop and exterior of appliances",
      "Scrub sink and polish fixtures",
      "Wipe cabinet fronts and handles",
      "Clean microwave interior and exterior",
      "Sweep and mop floors",
      "Empty trash and replace liner",
    ],
  },
  {
    title: "Bathrooms",
    items: [
      "Scrub and disinfect toilet (inside and out)",
      "Clean shower, tub, and glass doors",
      "Wipe mirrors and vanity surfaces",
      "Polish fixtures and faucets",
      "Wipe cabinet fronts",
      "Sweep and mop floors",
      "Empty trash and replace liner",
    ],
  },
  {
    title: "Floors & Living Areas",
    items: [
      "Vacuum all carpeted areas",
      "Sweep and mop hard floors",
      "Dust baseboards and trim",
      "Vacuum under furniture (accessible areas)",
      "Spot-clean entry and high-traffic areas",
    ],
  },
  {
    title: "Dusting & General",
    items: [
      "Dust all reachable surfaces and shelves",
      "Dust ceiling fans and light fixtures",
      "Wipe light switches and door handles",
      "Dust window sills and blinds",
      "Make beds (linens in place)",
      "Tidy and straighten common areas",
    ],
  },
];

const deepCleanChecklist: ChecklistCategory[] = [
  {
    title: "Kitchen",
    items: [
      "Wipe countertops and backsplash",
      "Clean stovetop and exterior of appliances",
      "Scrub sink and polish fixtures",
      "Wipe cabinet fronts and handles",
      "Clean microwave interior and exterior",
      "Sweep and mop floors",
      "Empty trash and replace liner",
    ],
  },
  {
    title: "Bathrooms",
    items: [
      "Scrub and disinfect toilet (inside and out)",
      "Clean shower, tub, and glass doors",
      "Wipe mirrors and vanity surfaces",
      "Polish fixtures and faucets",
      "Wipe cabinet fronts",
      "Sweep and mop floors",
      "Empty trash and replace liner",
    ],
  },
  {
    title: "Floors & Living Areas",
    items: [
      "Vacuum all carpeted areas",
      "Sweep and mop hard floors",
      "Dust baseboards and trim",
      "Vacuum under furniture (accessible areas)",
      "Spot-clean entry and high-traffic areas",
    ],
  },
  {
    title: "Dusting & General",
    items: [
      "Dust all reachable surfaces and shelves",
      "Dust ceiling fans and light fixtures",
      "Wipe light switches and door handles",
      "Dust window sills and blinds",
      "Make beds (linens in place)",
      "Tidy and straighten common areas",
    ],
  },
  {
    title: "Deep Clean Additions",
    items: [
      "Interior window cleaning",
      "Baseboard detail scrubbing",
      "Behind and under all furniture",
      "Inside oven and refrigerator",
      "Grout scrubbing in all tile areas",
      "Detailed cabinet interiors",
      "Wall spot-cleaning and scuff removal",
      "Light fixture deep clean",
    ],
  },
];

const vacationRentalChecklist: ChecklistCategory[] = [
  {
    title: "Linens & Laundry",
    items: [
      "Strip and remake all beds with fresh linens",
      "Wash, dry, and fold used linens and towels",
      "Replace bathroom towels and bath mats",
      "Check for stained or damaged linens",
      "Restock extra blankets and pillows",
    ],
  },
  {
    title: "Kitchen Reset",
    items: [
      "Clean out refrigerator — remove all guest items",
      "Run and empty dishwasher",
      "Wipe all countertops and backsplash",
      "Clean stovetop, oven exterior, and microwave",
      "Scrub sink and polish fixtures",
      "Restock dish soap, sponge, and trash bags",
      "Sweep and mop floors",
    ],
  },
  {
    title: "Bathroom Guest-Prep",
    items: [
      "Scrub and disinfect toilet (inside and out)",
      "Clean shower, tub, and glass doors",
      "Wipe mirrors and vanity surfaces",
      "Polish fixtures and faucets",
      "Restock toilet paper, soap, and amenities",
      "Sweep and mop floors",
    ],
  },
  {
    title: "Living Areas & Staging",
    items: [
      "Vacuum all carpeted areas",
      "Sweep and mop hard floors",
      "Dust all surfaces, shelves, and décor",
      "Wipe remote controls, light switches, and handles",
      "Fluff pillows and arrange furniture",
      "Clean interior windows and sliding doors",
      "Empty all trash cans and replace liners",
    ],
  },
  {
    title: "Departure Checklist",
    items: [
      "Verify all doors and windows are locked",
      "Set thermostat to away/eco mode",
      "Turn off all lights and fans",
      "Check for guest lost-and-found items",
      "Take completion photo log for host records",
      "Report any damage or maintenance issues",
    ],
  },
];

const moveInOutChecklist: ChecklistCategory[] = [
  {
    title: "Cabinet & Drawer Interiors",
    items: [
      "Wipe inside all kitchen cabinets and drawers",
      "Clean inside bathroom vanity cabinets",
      "Wipe inside bedroom and hallway closet shelves",
      "Clean pantry shelves and interiors",
      "Remove shelf liner residue if present",
    ],
  },
  {
    title: "Appliance Deep Clean",
    items: [
      "Deep clean inside oven and oven racks",
      "Clean inside refrigerator — all shelves, drawers, and door seals",
      "Scrub dishwasher interior and filter area",
      "Clean washer and dryer drums and lint traps",
      "Wipe exterior of all appliances",
      "Clean microwave interior and exterior",
    ],
  },
  {
    title: "Full Bathroom Detail",
    items: [
      "Scrub and disinfect toilet (inside, outside, and base)",
      "Deep clean shower, tub, and tile grout",
      "Remove hard water stains and soap scum",
      "Clean exhaust fan and vent covers",
      "Polish all fixtures and faucets",
      "Sweep and mop floors",
    ],
  },
  {
    title: "Walls & Baseboards",
    items: [
      "Wipe down all baseboards and trim",
      "Spot-clean walls — scuffs, marks, and fingerprints",
      "Clean door frames and door surfaces",
      "Wipe all light switches, outlets, and covers",
      "Clean interior side of front and back doors",
    ],
  },
  {
    title: "Windows & Tracks",
    items: [
      "Clean all interior windows and glass",
      "Wipe window sills and frames",
      "Vacuum and wipe window tracks",
      "Clean sliding door tracks",
      "Dust blinds and window coverings",
    ],
  },
  {
    title: "Floor Deep Clean",
    items: [
      "Vacuum all rooms including closets",
      "Mop all hard floors with detail attention to corners",
      "Clean floor vents and registers",
      "Remove scuff marks from hard floors",
      "Spot-treat carpet stains (if applicable)",
    ],
  },
];

const checklistMap: Record<ChecklistVariant, ChecklistCategory[]> = {
  residential: residentialChecklist,
  deep: deepCleanChecklist,
  "vacation-rental": vacationRentalChecklist,
  "move-in-out": moveInOutChecklist,
};

const variantLabels: Record<ChecklistVariant, string> = {
  residential: "Standard Cleaning",
  deep: "Deep Cleaning",
  "vacation-rental": "Vacation Rental Turnover",
  "move-in-out": "Move-In / Move-Out",
};

export function CleaningChecklist({ variant = "residential" }: { variant?: ChecklistVariant }) {
  const [openCategories, setOpenCategories] = useState<Set<number>>(new Set());

  const categories = checklistMap[variant];

  const toggle = (idx: number) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const expandAll = () => {
    if (openCategories.size === categories.length) {
      setOpenCategories(new Set());
    } else {
      setOpenCategories(new Set(categories.map((_, i) => i)));
    }
  };

  const allOpen = openCategories.size === categories.length;

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-[0_2px_16px_rgba(0,0,0,0.15)] overflow-hidden" data-testid="card-cleaning-checklist">
      <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-border/50 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground" data-testid="text-checklist-title">
            {variantLabels[variant]} Scope
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">What's included in every visit</p>
        </div>
        <button
          onClick={expandAll}
          className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          data-testid="button-checklist-toggle"
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <div className="divide-y divide-black/[0.04]">
        {categories.map((cat, idx) => {
          const isOpen = openCategories.has(idx);
          return (
            <div key={idx}>
              <button
                onClick={() => toggle(idx)}
                className="w-full flex items-center justify-between px-5 sm:px-6 py-3.5 hover:bg-muted/30 transition-colors text-left"
                data-testid={`checklist-toggle-${idx}`}
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-semibold text-foreground">{cat.title}</span>
                  <span className="text-[11px] text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">
                    {cat.items.length} items
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <ul className="px-5 sm:px-6 pb-4 space-y-2">
                      {cat.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
