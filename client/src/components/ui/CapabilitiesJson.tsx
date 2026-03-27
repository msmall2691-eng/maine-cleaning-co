import { motion } from "framer-motion";

const capabilities = {
  "services": [
    "Residential Deep Cleaning",
    "Commercial & Janitorial",
    "Vacation Rental Turnovers",
    "Move-In / Move-Out"
  ],
  "stack": {
    "chemicals": "Eco-friendly, Hospital-grade",
    "tools": "HEPA-filtration vacuums, Microfiber",
    "reliability": "99.9% Uptime"
  },
  "service_area": ["Portland", "South Portland", "Cape Elizabeth", "Scarborough", "Falmouth"]
};

export function CapabilitiesJson() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-lg overflow-hidden border border-white/10 shadow-2xl font-mono text-sm bg-[#0d1117]"
    >
      <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
        </div>
        <span className="text-muted-foreground ml-2 text-xs">capabilities.json</span>
      </div>
      <div className="p-4 md:p-6 overflow-x-auto text-blue-300">
        <pre><code>
<span className="text-white">{`{`}</span>
  <span className="text-primary">"core_competencies"</span><span className="text-white">{`: `}</span><span className="text-white">{`{`}</span>
    <span className="text-primary">"services"</span><span className="text-white">{`: [\n      `}</span><span className="text-orange-300">"{capabilities.services.join("\",\n      \"")}"</span><span className="text-white">{`\n    ],`}</span>
    <span className="text-primary">"stack"</span><span className="text-white">{`: {`}</span>
      <span className="text-primary">"chemicals"</span><span className="text-white">: </span><span className="text-orange-300">"{capabilities.stack.chemicals}"</span><span className="text-white">,</span>
      <span className="text-primary">"tools"</span><span className="text-white">: </span><span className="text-orange-300">"{capabilities.stack.tools}"</span><span className="text-white">,</span>
      <span className="text-primary">"reliability"</span><span className="text-white">: </span><span className="text-orange-300">"{capabilities.stack.reliability}"</span>
    <span className="text-white">{`}`}</span>
  <span className="text-white">{`}`}</span>
<span className="text-white">{`}`}</span>
        </code></pre>
      </div>
    </motion.div>
  );
}