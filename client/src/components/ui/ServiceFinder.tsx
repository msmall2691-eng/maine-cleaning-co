import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Home,
  Building2,
  Palmtree,
  ArrowRight,
  ArrowLeft,
  Repeat,
  CalendarCheck,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type SpaceType = "home" | "rental" | "business" | null;
type FreqType = "recurring" | "one-time" | null;
type CondType = "maintained" | "needs-reset" | null;

interface Choice<T extends string> {
  id: T;
  label: string;
  desc: string;
  icon: React.ElementType;
}

const spaceChoices: Choice<NonNullable<SpaceType>>[] = [
  { id: "home", label: "My Home", desc: "Regular house or apartment", icon: Home },
  { id: "rental", label: "Vacation Rental", desc: "Airbnb, VRBO, short-term rental", icon: Palmtree },
  { id: "business", label: "My Business", desc: "Office, retail, or commercial space", icon: Building2 },
];

const freqChoices: Choice<NonNullable<FreqType>>[] = [
  { id: "recurring", label: "Recurring", desc: "Weekly, biweekly, or monthly", icon: Repeat },
  { id: "one-time", label: "One-Time", desc: "Single deep clean or reset", icon: CalendarCheck },
];

const condChoices: Choice<NonNullable<CondType>>[] = [
  { id: "maintained", label: "Maintained", desc: "Regular upkeep, standard clean", icon: Sparkles },
  { id: "needs-reset", label: "Needs a Reset", desc: "Hasn't been cleaned in a while", icon: RotateCcw },
];

function routeFor(space: SpaceType, freq: FreqType, cond: CondType): string {
  if (space === "business") return "/services/commercial";
  if (space === "rental") return "/services/vacation-rentals";
  if (cond === "needs-reset" || freq === "one-time") return "/services/deep-cleaning";
  return "/services/residential";
}

function resultLabel(space: SpaceType, freq: FreqType, cond: CondType): string {
  if (space === "business") return "Commercial & Janitorial";
  if (space === "rental") return "Vacation Rental Turnovers";
  if (cond === "needs-reset" || freq === "one-time") return "Deep Cleaning";
  return "Residential Cleaning";
}

function ChoiceGrid<T extends string>({
  choices,
  selected,
  onSelect,
}: {
  choices: Choice<T>[];
  selected: T | null;
  onSelect: (v: T) => void;
}) {
  return (
    <div className="grid gap-3">
      {choices.map((c) => {
        const Icon = c.icon;
        const active = selected === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            data-testid={`finder-${c.id}`}
            className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
              active
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-card hover:border-primary/30 hover:bg-primary/[0.02]"
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              active ? "bg-primary text-white" : "bg-muted/60 text-muted-foreground"
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">{c.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{c.desc}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function ServiceFinder() {
  const [step, setStep] = useState(1);
  const [space, setSpace] = useState<SpaceType>(null);
  const [freq, setFreq] = useState<FreqType>(null);
  const [cond, setCond] = useState<CondType>(null);
  const [, navigate] = useLocation();

  const canNext =
    (step === 1 && space !== null) ||
    (step === 2 && freq !== null) ||
    (step === 3 && cond !== null);

  const advance = () => {
    if (step === 1 && (space === "business" || space === "rental")) {
      setStep(4);
      return;
    }
    if (step < 3) setStep(step + 1);
    else setStep(4);
  };

  const back = () => {
    if (step === 4) {
      if (space === "business" || space === "rental") setStep(1);
      else setStep(3);
      return;
    }
    if (step > 1) setStep(step - 1);
  };

  const reset = () => {
    setStep(1);
    setSpace(null);
    setFreq(null);
    setCond(null);
  };

  const route = routeFor(space, freq, cond);
  const label = resultLabel(space, freq, cond);

  const titles: Record<number, string> = {
    1: "What are you looking to clean?",
    2: "How often do you need cleaning?",
    3: "How would you describe the condition?",
  };

  const stepCount = space === "business" || space === "rental" ? 1 : 3;
  const displayStep = space === "business" || space === "rental" ? (step === 4 ? 1 : step) : step;

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-[0_2px_16px_rgba(0,0,0,0.15)] w-full overflow-hidden" data-testid="card-service-finder">
      <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-border/50">
        <h3 className="text-lg font-bold text-foreground" data-testid="text-finder-title">Help Me Choose My Service</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Answer a few quick questions.</p>
      </div>

      <div className="px-5 sm:px-6 py-5">
        {step < 4 && (
          <div className="flex gap-1.5 mb-5">
            {Array.from({ length: stepCount }).map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full flex-1 transition-colors ${
                  i < displayStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
              <p className="text-sm font-medium text-foreground mb-4">{titles[1]}</p>
              <ChoiceGrid choices={spaceChoices} selected={space} onSelect={setSpace} />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
              <p className="text-sm font-medium text-foreground mb-4">{titles[2]}</p>
              <ChoiceGrid choices={freqChoices} selected={freq} onSelect={setFreq} />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
              <p className="text-sm font-medium text-foreground mb-4">{titles[3]}</p>
              <ChoiceGrid choices={condChoices} selected={cond} onSelect={setCond} />
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }} className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">We recommend</p>
                <h4 className="text-xl font-bold text-foreground mt-1" data-testid="text-finder-result">{label}</h4>
              </div>
              <Button
                className="w-full h-12 rounded-xl font-semibold shadow-sm"
                onClick={() => navigate(route)}
                data-testid="button-finder-go"
              >
                View Service Details <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <button
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                onClick={reset}
                data-testid="button-finder-restart"
              >
                Start over
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {step < 4 && (
          <div className="flex gap-3 mt-5">
            {step > 1 && (
              <Button variant="outline" className="h-11 px-4 rounded-xl border-border text-sm" onClick={back} data-testid="button-finder-back">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
            <Button
              className="flex-1 h-11 rounded-xl font-semibold text-sm"
              disabled={!canNext}
              onClick={advance}
              data-testid="button-finder-next"
            >
              {(space === "business" || space === "rental") && step === 1 ? "See My Match" : "Next"} <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
