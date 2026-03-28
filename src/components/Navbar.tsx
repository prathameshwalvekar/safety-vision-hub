import { useState } from "react";
import { Eye, Menu, X } from "lucide-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container px-6 flex items-center justify-between h-16">
        <a href="#" className="flex items-center gap-2 font-display font-bold text-foreground tracking-tight">
          <Eye className="w-5 h-5 text-primary" />
          <span>VisionGuard</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {["Features", "How It Works"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s/g, "-")}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
            >
              {item}
            </a>
          ))}
          <button className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-display text-xs tracking-wider uppercase font-semibold hover:brightness-110 transition-all">
            Get Demo
          </button>
        </div>

        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl px-6 py-4 flex flex-col gap-4">
          {["Features", "How It Works"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s/g, "-")}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setOpen(false)}
            >
              {item}
            </a>
          ))}
          <button className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-display text-xs tracking-wider uppercase font-semibold">
            Get Demo
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
