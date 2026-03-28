import { motion } from "framer-motion";

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />

      <div className="container relative z-10 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card-surface border-glow p-12 md:p-16 text-center max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 text-foreground">
            Ready to Deploy <span className="text-gradient-primary">Smart Surveillance</span>?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Transform your existing CCTV infrastructure with AI-powered analytics. Get started with a demo today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="px-8 py-4 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm tracking-wider uppercase glow-primary hover:brightness-110 transition-all">
              Request Demo
            </button>
            <button className="px-8 py-4 rounded-lg border-glow text-foreground font-display font-semibold text-sm tracking-wider uppercase hover:bg-secondary/50 transition-all">
              Contact Sales
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
