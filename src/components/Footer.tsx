import { Eye } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12">
      <div className="container px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-display font-bold text-foreground">
          <Eye className="w-4 h-4 text-primary" />
          <span>VisionGuard</span>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} VisionGuard. AI-Powered CCTV Analytics.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
