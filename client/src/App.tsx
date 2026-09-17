import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Home from "@/pages/Home";
import Book from "@/pages/Book";
import ManageBooking from "@/pages/ManageBooking";
import Portal from "@/pages/Portal";
import PortalLogin from "@/pages/PortalLogin";
import ResetPassword from "@/pages/ResetPassword";
import About from "@/pages/About";
import HowItWorks from "@/pages/HowItWorks";
import ServiceAreas from "@/pages/ServiceAreas";
import Services from "@/pages/Services";
import ServiceDetail from "@/pages/ServiceDetail";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import ShortTermRentals from "@/pages/ShortTermRentals";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import NotFound from "@/pages/not-found";
import { StickyMobileBar } from "@/components/ui/StickyMobileBar";
import { AIChatWidget } from "@/components/ui/AIChatWidget";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { WeatherProvider } from "@/lib/weather";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      // Let the page render, then scroll to the hash target
      setTimeout(() => {
        const el = document.getElementById(hash.slice(1));
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);
  return null;
}

function Router() {
  return (
    <>
    <ScrollToTop />
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/book" component={Book} />
      {/* Capability URL from the booking confirmation email — the token in
          the path is the customer's only credential. */}
      <Route path="/booking/manage/:token" component={ManageBooking} />
      {/* Customer portal — the components + all /api/portal/* server
          handlers were already built and shipped in code; they just
          weren't reachable via the router. Adding these three routes
          wires the full "sign in → see my quotes / bookings / documents
          / schedule / payments" experience the code already implements. */}
      <Route path="/portal/login" component={PortalLogin} />
      <Route path="/portal/reset-password" component={ResetPassword} />
      <Route path="/portal" component={Portal} />
      <Route path="/about" component={About} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/service-areas" component={ServiceAreas} />
      <Route path="/services" component={Services} />
      <Route path="/services/:slug" component={ServiceDetail} />
      <Route path="/short-term-rentals" component={ShortTermRentals} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route component={NotFound} />
    </Switch>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <WeatherProvider>
          <AuthProvider>
          <TooltipProvider>
            <div className="relative z-10 flex min-h-screen flex-col text-foreground selection:bg-primary/30">
              <Navbar />
              <main className="flex-1 pb-20 lg:pb-0">
                <Router />
              </main>
              <Footer />
              <StickyMobileBar />
              <AIChatWidget />
            </div>
            <Toaster />
          </TooltipProvider>
          </AuthProvider>
        </WeatherProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
