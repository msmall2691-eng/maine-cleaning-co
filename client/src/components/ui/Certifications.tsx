import { motion } from "framer-motion";
import { Shield, HardHat, Leaf } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } }),
};

type CertItem = {
  type: "icon";
  icon: typeof Shield;
  name: string;
  description: string;
  accent: string;
  iconBg: string;
  iconColor: string;
} | {
  type: "image";
  image: string;
  name: string;
  description: string;
  accent: string;
};

const certifications: CertItem[] = [
  {
    type: "icon",
    icon: Shield,
    name: "ISSA CIMS",
    description: "Cleaning Industry Management Standard — the gold standard for quality and operational excellence.",
    accent: "from-brand-navy/10 to-brand-navy/5",
    iconBg: "bg-brand-navy/10",
    iconColor: "text-brand-navy",
  },
  {
    type: "icon",
    icon: HardHat,
    name: "OSHA Certified",
    description: "Occupational safety and health training for workplace safety compliance.",
    accent: "from-brand-stone/10 to-brand-stone/5",
    iconBg: "bg-brand-stone/10",
    iconColor: "text-brand-stone",
  },
  {
    type: "icon",
    icon: Leaf,
    name: "Green Seal",
    description: "Certified commitment to environmentally responsible cleaning practices and products.",
    accent: "from-brand-pine/10 to-brand-pine/5",
    iconBg: "bg-brand-pine/10",
    iconColor: "text-brand-pine",
  },
  {
    type: "image",
    image: "/images/ahca-covid-badge.png",
    name: "AHCA COVID-19",
    description: "Certified in COVID-19 cleaning and infectious disease prevention protocols.",
    accent: "from-brand-harbor/10 to-brand-harbor/5",
  },
  {
    type: "image",
    image: "/images/ahca-professional-badge.png",
    name: "AHCA Professional",
    description: "American House Cleaners Association certified professional house cleaner.",
    accent: "from-brand-navy/10 to-brand-navy/5",
  },
];

export function Certifications() {
  return (
    <div data-testid="section-certifications">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 max-w-5xl mx-auto">
        {certifications.map((cert, i) => (
          <motion.div
            key={cert.name}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={i}
            className={`relative overflow-hidden rounded-2xl border border-black/[0.06] bg-gradient-to-br ${cert.accent} p-5 sm:p-6 text-center group hover:shadow-lg transition-all duration-300`}
            data-testid={`badge-cert-${i}`}
          >
            {cert.type === "icon" ? (
              <div className={`w-12 h-12 rounded-2xl ${cert.iconBg} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}>
                <cert.icon className={`w-6 h-6 ${cert.iconColor}`} />
              </div>
            ) : (
              <div className="w-16 h-16 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <img src={cert.image} alt={cert.name} className="w-full h-full object-contain" />
              </div>
            )}
            <h3 className="font-bold text-foreground text-xs sm:text-sm mb-1.5">{cert.name}</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">{cert.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
