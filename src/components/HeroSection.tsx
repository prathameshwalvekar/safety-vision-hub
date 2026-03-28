import { motion } from "framer-motion";
import { Shield, Eye, Cpu } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-grid">
      {/* Scanline overlay */}
      <div className="absolute inset-0 bg-scanline pointer-events-none" />
      
      {/* Gradient overlays */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[120px]" />

      <div className="container relative z-10 px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center justify-center gap-2 mb-6"
        >
          <div className="flex items-center gap-2 border-glow rounded-full px-4 py-2 bg-secondary/50 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
            <span className="text-sm font-display text-muted-foreground tracking-wider uppercase">
              AI-Powered Surveillance
            </span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight leading-tight mb-6"
        >
          <span className="text-foreground">Intelligent</span>
          <br />
          <span className="text-gradient-primary">CCTV Analytics</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground font-body mb-10 leading-relaxed"
        >
          Real-time AI detection for safety compliance, threat identification, and 
          anomaly monitoring — powered by YOLOv11 computer vision.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <a href="#features" className="px-8 py-4 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm tracking-wider uppercase glow-primary hover:brightness-110 transition-all">
            Explore Use Cases
          </a>
          <a href="#how-it-works" className="px-8 py-4 rounded-lg border-glow text-foreground font-display font-semibold text-sm tracking-wider uppercase hover:bg-secondary/50 transition-all">
            How It Works
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="grid grid-cols-3 gap-8 max-w-lg mx-auto"
        >
          {[
            { icon: Shield, label: "Safety First", value: "12+" },
            { icon: Eye, label: "Detection Models", value: "Real-time" },
            { icon: Cpu, label: "AI Engine", value: "YOLOv11" },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <stat.icon className="w-5 h-5 text-primary" />
              <span className="font-display font-bold text-lg text-foreground">{stat.value}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
