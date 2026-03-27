import { useQuery } from "@tanstack/react-query";
import { Sparkles, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

export function AICleaningTip() {
  const { data, isLoading } = useQuery<{ tip: string }>({
    queryKey: ["/api/ai/cleaning-tip"],
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.06] via-card to-card p-5 sm:p-6" data-testid="ai-tip-skeleton">
        <div className="flex items-start gap-3.5">
          <div className="skeleton-shimmer w-9 h-9 rounded-xl flex-shrink-0" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="skeleton-shimmer w-24 h-3.5" />
              <div className="skeleton-shimmer w-14 h-4 rounded-full" />
            </div>
            <div className="skeleton-shimmer w-full h-3.5" />
            <div className="skeleton-shimmer w-3/4 h-3.5" />
          </div>
        </div>
      </div>
    );
  }

  if (!data?.tip) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.06] via-card to-card p-5 sm:p-6"
      data-testid="ai-cleaning-tip"
    >
      <div className="absolute top-3 right-3 opacity-[0.06]">
        <Sparkles className="w-20 h-20 text-primary" />
      </div>
      <div className="flex items-start gap-3.5 relative">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Lightbulb className="w-4.5 h-4.5 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">AI Cleaning Tip</span>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-semibold">
              <Sparkles className="w-2.5 h-2.5" /> Smart
            </span>
          </div>
          <p className="text-sm leading-relaxed text-foreground/80" data-testid="text-ai-tip">{data.tip}</p>
        </div>
      </div>
    </motion.div>
  );
}
