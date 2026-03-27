import { motion } from "framer-motion";

const commits = [
  { hash: "f3a1b2c", message: "init: Lead generation via Instant Estimate or Service Finder", date: "Step 01" },
  { hash: "a7d9e4f", message: "sync: Owner reviews payload & schedules service in Jobber", date: "Step 02" },
  { hash: "b2c8d1e", message: "execute: Elite cleaning crew deployed to location", date: "Step 03" },
  { hash: "e5f4a1c", message: "verify: Quality check complete. State set to 'Pristine'", date: "Step 04" },
];

export function GitTimeline() {
  return (
    <div className="relative py-8 pl-8 font-mono text-sm">
      <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border" />
      <div className="space-y-8">
        {commits.map((commit, i) => (
          <motion.div 
            key={commit.hash}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.2 }}
            className="relative"
          >
            <div className="absolute -left-[30px] top-2 w-4 h-4 rounded-full bg-background border-2 border-primary z-10 shadow-[0_0_8px_rgba(0,240,255,0.6)]" />
            <div className="pl-6 bg-card/40 backdrop-blur-sm border border-white/5 p-4 rounded-md">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-primary font-bold">commit {commit.hash}</span>
                <span className="text-muted-foreground text-xs">{commit.date}</span>
              </div>
              <p className="text-foreground">{commit.message}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}