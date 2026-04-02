import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Home from "@/pages/Home";
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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/30">
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
    </QueryClientProvider>
  );
}

export default App;
