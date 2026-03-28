import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Eye } from "lucide-react";

interface DetectionLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  icon: string;
}

const DetectionLayout = ({ children, title, subtitle, icon }: DetectionLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-body">Back</span>
            </Link>
            <div className="h-5 w-px bg-border" />
            <Link to="/" className="flex items-center gap-2 font-display font-bold text-foreground tracking-tight">
              <Eye className="w-5 h-5 text-primary" />
              <span>VisionGuard</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="pt-24 pb-8 border-b border-border">
        <div className="container px-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{icon}</span>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">{title}</h1>
          </div>
          <p className="text-muted-foreground font-body">{subtitle}</p>
        </div>
      </div>

      {/* Content */}
      <div className="container px-6 py-8">
        {children}
      </div>
    </div>
  );
};

export default DetectionLayout;
