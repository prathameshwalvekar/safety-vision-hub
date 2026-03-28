import { motion } from "framer-motion";
import { Camera, Cpu, Bell, BarChart3 } from "lucide-react";

const steps = [
  {
    icon: Camera,
    step: "01",
    title: "Connect CCTV Feed",
    description: "Connect your existing IP cameras or CCTV infrastructure. Supports RTSP, HTTP, and direct webcam input.",
  },
  {
    icon: Cpu,
    step: "02",
    title: "AI Processes Frames",
    description: "YOLOv11 models analyze each frame in real-time, detecting objects, behaviors, and anomalies with high accuracy.",
  },
  {
    icon: Bell,
    step: "03",
    title: "Instant Alerts",
    description: "Get real-time notifications via dashboard, SMS, or email when violations or threats are detected.",
  },
  {
    icon: BarChart3,
    step: "04",
    title: "Analytics & Reports",
    description: "Access comprehensive dashboards with detection logs, trend analysis, and compliance reports.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="font-display text-sm text-primary tracking-widest uppercase">Process</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mt-3 mb-4 text-foreground">
            How It <span className="text-gradient-primary">Works</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="card-surface p-8 text-center relative group"
            >
              <span className="absolute top-4 right-4 font-display text-xs text-muted-foreground/40 tracking-widest">
                {s.step}
              </span>
              <div className="w-14 h-14 rounded-xl bg-primary/10 border-glow flex items-center justify-center mx-auto mb-5 group-hover:glow-primary transition-shadow duration-300">
                <s.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-3">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
