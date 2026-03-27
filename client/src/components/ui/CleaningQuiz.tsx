import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Home,
  Building2,
  Key,
  Truck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuizQuestion {
  id: string;
  question: string;
  subtitle: string;
  options: QuizOption[];
}

interface QuizOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  points: Record<string, number>;
}

interface QuizResult {
  service: string;
  slug: string;
  headline: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  features: string[];
}

const questions: QuizQuestion[] = [
  {
    id: "property",
    question: "What type of property needs cleaning?",
    subtitle: "This helps us match the right service to your space.",
    options: [
      {
        id: "home",
        label: "My Home",
        description: "Primary residence",
        icon: <Home className="w-5 h-5" />,
        points: { residential: 3, deep: 2, moveinout: 1 },
      },
      {
        id: "rental",
        label: "Vacation Rental",
        description: "Airbnb, VRBO, etc.",
        icon: <Key className="w-5 h-5" />,
        points: { vacation: 4, deep: 1 },
      },
      {
        id: "office",
        label: "Office or Business",
        description: "Commercial space",
        icon: <Building2 className="w-5 h-5" />,
        points: { commercial: 4 },
      },
      {
        id: "moving",
        label: "Moving In or Out",
        description: "Need a full reset",
        icon: <Truck className="w-5 h-5" />,
        points: { moveinout: 4, deep: 1 },
      },
    ],
  },
  {
    id: "frequency",
    question: "How often do you need cleaning?",
    subtitle: "Regular service keeps your space consistently fresh.",
    options: [
      {
        id: "recurring",
        label: "Weekly or Biweekly",
        description: "Ongoing maintenance",
        icon: <span className="text-lg font-bold">W</span>,
        points: { residential: 3, commercial: 2 },
      },
      {
        id: "monthly",
        label: "Monthly",
        description: "Once-a-month refresh",
        icon: <span className="text-lg font-bold">M</span>,
        points: { residential: 2, deep: 2 },
      },
      {
        id: "onetime",
        label: "One-Time Service",
        description: "A single deep reset",
        icon: <span className="text-lg font-bold">1</span>,
        points: { deep: 3, moveinout: 2 },
      },
      {
        id: "turnover",
        label: "Between Guest Stays",
        description: "Quick turnover resets",
        icon: <span className="text-lg font-bold">T</span>,
        points: { vacation: 4 },
      },
    ],
  },
  {
    id: "priority",
    question: "What matters most to you?",
    subtitle: "We'll tailor our recommendation to your priorities.",
    options: [
      {
        id: "consistent",
        label: "Consistent Cleanliness",
        description: "A home that always feels fresh",
        icon: <CheckCircle2 className="w-5 h-5" />,
        points: { residential: 3, commercial: 1 },
      },
      {
        id: "thorough",
        label: "Deep, Thorough Clean",
        description: "Every corner, every surface",
        icon: <Sparkles className="w-5 h-5" />,
        points: { deep: 4, moveinout: 1 },
      },
      {
        id: "speed",
        label: "Fast Turnaround",
        description: "Quick, reliable, same-day",
        icon: <ArrowRight className="w-5 h-5" />,
        points: { vacation: 3, commercial: 1 },
      },
      {
        id: "fresh-start",
        label: "A Fresh Start",
        description: "Blank canvas for a new chapter",
        icon: <Home className="w-5 h-5" />,
        points: { moveinout: 3, deep: 2 },
      },
    ],
  },
];

const results: Record<string, QuizResult> = {
  residential: {
    service: "Residential Cleaning",
    slug: "residential",
    headline: "Regular Home Cleaning",
    description: "Our recurring cleaning service keeps your home consistently fresh with eco-friendly products. Perfect for busy families who want to come home to a clean space every time.",
    icon: <Home className="w-6 h-6" />,
    color: "bg-blue-500/15 text-blue-400",
    features: ["Recurring weekly or biweekly schedules", "Eco-friendly Melaleuca & Sal Suds products", "Same trusted team each visit", "All living areas, kitchens & bathrooms"],
  },
  deep: {
    service: "Deep Cleaning",
    slug: "deep-cleaning",
    headline: "Deep Cleaning",
    description: "A top-to-bottom intensive clean that tackles every overlooked area. Ideal for seasonal refreshes, pre-event prep, or getting your home back to baseline.",
    icon: <Sparkles className="w-6 h-6" />,
    color: "bg-emerald-500/15 text-emerald-400",
    features: ["Baseboards, trim & behind furniture", "Interior windows & sills", "Deep scrub of appliances & grout", "Hospital-grade, eco-friendly products"],
  },
  vacation: {
    service: "Vacation Rental Turnovers",
    slug: "vacation-rentals",
    headline: "Vacation Rental Turnovers",
    description: "Fast, hotel-quality resets between guest stays. We handle linens, restocking, staging, and damage checks so you can maintain five-star reviews.",
    icon: <Key className="w-6 h-6" />,
    color: "bg-amber-500/15 text-amber-400",
    features: ["Same-day rapid turnovers", "Linen & laundry service", "Consumables restocking", "Damage reporting with photos"],
  },
  commercial: {
    service: "Commercial & Janitorial",
    slug: "commercial",
    headline: "Commercial Cleaning",
    description: "Reliable, discreet maintenance for offices, medical facilities, and professional spaces. Custom schedules to fit your business hours.",
    icon: <Building2 className="w-6 h-6" />,
    color: "bg-purple-500/15 text-purple-400",
    features: ["Custom cleaning schedules", "Restroom sanitization & restocking", "Workstation sanitizing", "Hard floor care & maintenance"],
  },
  moveinout: {
    service: "Move-In / Move-Out",
    slug: "move-in-out",
    headline: "Move-In / Move-Out Cleaning",
    description: "A complete property reset for new tenants, homeowners, or Realtors. We leave every surface spotless — a true blank canvas.",
    icon: <Truck className="w-6 h-6" />,
    color: "bg-rose-50 text-rose-600",
    features: ["Inside all cabinets & drawers", "Appliance deep cleaning", "Full bathroom sanitization", "All baseboards, doors & trim washed"],
  },
};

function getResult(answers: Record<string, string>): QuizResult {
  const scores: Record<string, number> = {};

  Object.values(answers).forEach((answerId) => {
    for (const q of questions) {
      const opt = q.options.find((o) => o.id === answerId);
      if (opt) {
        Object.entries(opt.points).forEach(([service, pts]) => {
          scores[service] = (scores[service] || 0) + pts;
        });
      }
    }
  });

  const winner = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] || "residential";
  return results[winner];
}

export function CleaningQuiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [direction, setDirection] = useState(1);

  const handleSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const goNext = () => {
    if (currentStep < questions.length - 1) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    } else {
      setShowResult(true);
    }
  };

  const goBack = () => {
    if (showResult) {
      setShowResult(false);
    } else if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  };

  const reset = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResult(false);
    setDirection(-1);
  };

  const question = questions[currentStep];
  const selectedOption = question ? answers[question.id] : undefined;
  const result = showResult ? getResult(answers) : null;

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
  };

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-[0_2px_16px_rgba(0,0,0,0.15)] w-full max-w-2xl mx-auto overflow-hidden" data-testid="card-cleaning-quiz">
      <div className="px-5 sm:px-7 pt-5 sm:pt-6 pb-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground" data-testid="text-quiz-title">Find Your Perfect Clean</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Answer 3 quick questions to find your ideal service.</p>
          </div>
          <div className="flex items-center gap-1.5">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  showResult
                    ? "bg-green-400"
                    : i === currentStep
                    ? "bg-primary scale-110"
                    : i < currentStep || answers[questions[i].id]
                    ? "bg-primary/40"
                    : "bg-black/10"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 sm:px-7 py-5 sm:py-7 min-h-[320px] flex flex-col">
        <AnimatePresence mode="wait" custom={direction}>
          {!showResult && question && (
            <motion.div
              key={question.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex-1 flex flex-col"
            >
              <div className="mb-5">
                <p className="text-xs font-semibold text-primary/60 uppercase tracking-wider mb-1.5">
                  Question {currentStep + 1} of {questions.length}
                </p>
                <h4 className="text-base sm:text-lg font-bold text-foreground">{question.question}</h4>
                <p className="text-sm text-muted-foreground mt-0.5">{question.subtitle}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1" role="radiogroup" aria-label={question.question}>
                {question.options.map((opt) => (
                  <button
                    key={opt.id}
                    role="radio"
                    aria-checked={selectedOption === opt.id}
                    onClick={() => handleSelect(question.id, opt.id)}
                    className={`group relative text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedOption === opt.id
                        ? "border-primary bg-primary/[0.04] shadow-[0_0_0_1px_hsl(208,22%,32%,0.1)]"
                        : "border-border hover:border-primary/30 hover:bg-muted/30"
                    }`}
                    data-testid={`quiz-option-${opt.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                        selectedOption === opt.id
                          ? "bg-primary text-white"
                          : "bg-muted/60 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                      }`}>
                        {opt.icon}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold transition-colors ${
                          selectedOption === opt.id ? "text-primary" : "text-foreground"
                        }`}>{opt.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                      </div>
                    </div>
                    {selectedOption === opt.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2.5 right-2.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/50">
                <button
                  onClick={goBack}
                  disabled={currentStep === 0}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                  data-testid="quiz-back"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <Button
                  onClick={goNext}
                  disabled={!selectedOption}
                  className="h-10 px-5 rounded-xl text-sm font-semibold"
                  data-testid="quiz-next"
                >
                  {currentStep === questions.length - 1 ? "See My Result" : "Next"}
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </motion.div>
          )}

          {showResult && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col"
            >
              <div className="text-center mb-5">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${result.color}`}
                >
                  {result.icon}
                </motion.div>
                <p className="text-xs font-semibold text-primary/60 uppercase tracking-wider mb-1">We Recommend</p>
                <h4 className="text-xl sm:text-2xl font-bold text-foreground" data-testid="text-quiz-result">{result.headline}</h4>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">{result.description}</p>
              </div>

              <div className="rounded-xl bg-muted/40 p-4 mb-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">What's Included</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {result.features.map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.08 }}
                      className="flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 mt-auto">
                <Link href={`/services/${result.slug}`} className="flex-1">
                  <Button className="w-full h-11 rounded-xl text-sm font-semibold" data-testid="quiz-learn-more">
                    Learn More <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
                <a href="#get-estimate" className="flex-1">
                  <Button variant="outline" className="w-full h-11 rounded-xl border-border text-sm font-semibold" data-testid="quiz-get-estimate">
                    Get an Estimate
                  </Button>
                </a>
              </div>

              <div className="flex items-center justify-center mt-4 pt-3 border-t border-border/50">
                <button
                  onClick={reset}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                  data-testid="quiz-retake"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Take the quiz again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
