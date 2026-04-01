import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import FallDetection from "./pages/FallDetection.tsx";
import FireSmokeDetection from "./pages/FireSmokeDetection.tsx";
import PhoneDetection from "./pages/PhoneDetection.tsx";
import HelmetDetection from "./pages/HelmetDetection.tsx";
import RestrictedAreaDetection from "./pages/RestrictedAreaDetection.tsx";
import LineCrossingDetection from "./pages/LineCrossingDetection.tsx";
import SterileZoneMonitoring from "./pages/SterileZoneMonitoring.tsx";
import TrafficMonitoring from "./pages/TrafficMonitoring.tsx";
import NoParkingDetection from "./pages/NoParkingDetection.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/detect/fall" element={<FallDetection />} />
          <Route path="/detect/fire-smoke" element={<FireSmokeDetection />} />
          <Route path="/detect/phone" element={<PhoneDetection />} />
          <Route path="/detect/helmet" element={<HelmetDetection />} />
          <Route path="/detect/restricted-area" element={<RestrictedAreaDetection />} />

          {/* New Routes */}
          <Route path="/detect/line-crossing" element={<RestrictedAreaDetection />} />
          <Route path="/detect/sterile-zone" element={<RestrictedAreaDetection />} />
          <Route path="/detect/traffic" element={<RestrictedAreaDetection />} />
          <Route path="/detect/no-parking" element={<RestrictedAreaDetection />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
