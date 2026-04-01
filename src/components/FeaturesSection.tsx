import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  HardHat, Smartphone, Flame, AlertTriangle, UserX,
  ArrowRightLeft, PackageSearch, Layers, PackageOpen,
  PersonStanding, ShieldAlert, MapPin, CarFront, ExternalLink,
} from "lucide-react";

const features = [
  {
    icon: HardHat,
    title: "No Helmet / Gloves / Safety Vest",
    description: "Detect PPE compliance violations in real-time. Identify workers missing helmets, gloves, or safety vests on site.",
    color: "text-warning",
    glow: "glow-accent",
    tag: "Safety",
    link: "/detect/helmet",
  },
  {
    icon: Smartphone,
    title: "Mobile Phone Usage",
    description: "Detect unauthorized cell phone usage in restricted areas, factories, and hazardous zones.",
    color: "text-primary",
    glow: "glow-primary",
    tag: "Compliance",
    link: "/detect/phone",
  },
  {
    icon: Flame,
    title: "Fire & Smoke Detection",
    description: "Early fire and smoke detection using thermal and visual analysis for rapid emergency response.",
    color: "text-danger",
    glow: "glow-danger",
    tag: "Emergency",
    link: "/detect/fire-smoke",
  },
  {
    icon: AlertTriangle,
    title: "Line Crossing / Lakshman Rekha",
    description: "Monitor virtual boundaries and trigger alerts when personnel cross restricted perimeters.",
    color: "text-warning",
    glow: "glow-accent",
    tag: "Perimeter",
    link: "/detect/line-crossing",
  },
  {
    icon: UserX,
    title: "Suspicious Activity Detection",
    description: "AI-powered behavioral analysis to identify suspicious movements, loitering, and abnormal activities.",
    color: "text-danger",
    glow: "glow-danger",
    tag: "Security",
  },
  {
    icon: ArrowRightLeft,
    title: "Wrong Direction Movement",
    description: "Detect vehicles and pedestrians moving against designated traffic flow patterns.",
    color: "text-primary",
    glow: "glow-primary",
    tag: "Traffic",
    link: "/detect/traffic",
  },
  {
    icon: PackageSearch,
    title: "Missing Object Detection",
    description: "Identify when monitored objects are removed or displaced from their designated positions.",
    color: "text-warning",
    glow: "glow-accent",
    tag: "Asset",
  },
  {
    icon: Layers,
    title: "Object Classification",
    description: "Classify and categorize detected objects with high accuracy across multiple categories.",
    color: "text-primary",
    glow: "glow-primary",
    tag: "AI Core",
  },
  {
    icon: PackageOpen,
    title: "Unattended Object",
    description: "Detect and alert on abandoned bags, packages, or objects left unattended in public areas.",
    color: "text-danger",
    glow: "glow-danger",
    tag: "Security",
  },
  {
    icon: PersonStanding,
    title: "Person Slip / Fall / Collapse",
    description: "Detect falls, slips, and worker collapse for immediate medical response and incident logging.",
    color: "text-warning",
    glow: "glow-accent",
    tag: "Safety",
    link: "/detect/fall",
  },
  {
    icon: ShieldAlert,
    title: "Sterile & Zone Monitoring",
    description: "Monitor restricted sterile zones and designated areas for unauthorized access or intrusion.",
    color: "text-primary",
    glow: "glow-primary",
    tag: "Access",
    link: "/detect/sterile-zone",
  },
  {
    icon: CarFront,
    title: "No Parking Detection",
    description: "Identify vehicles parked in no-parking zones and trigger automated violation alerts.",
    color: "text-danger",
    glow: "glow-danger",
    tag: "Traffic",
    link: "/detect/no-parking",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="container relative z-10 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="font-display text-sm text-primary tracking-widest uppercase">Use Cases</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mt-3 mb-4">
            <span className="text-gradient-primary">12+ Detection</span>{" "}
            <span className="text-foreground">Models</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Comprehensive AI-powered surveillance covering safety, security, compliance, and traffic management.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={item}
              className="group card-surface p-6 hover:border-primary/40 transition-all duration-300 relative overflow-hidden"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 bg-primary/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  <span className="text-[10px] font-display uppercase tracking-widest text-muted-foreground border border-border rounded-full px-2 py-0.5">
                    {feature.tag}
                  </span>
                </div>
                <h3 className="font-display font-semibold text-sm text-foreground mb-2 leading-snug">
                  {feature.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                {feature.link && (
                  <Link to={feature.link} className="inline-flex items-center gap-1 mt-3 text-xs font-display text-primary hover:underline uppercase tracking-wider">
                    Try Demo <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
