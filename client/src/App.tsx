import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
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
import Admin from "@/pages/Admin";
import Portal from "@/pages/Portal";
import PortalLogin from "@/pages/PortalLogin";
import ResetPassword from "@/pages/ResetPassword";
import ShortTermRentals from "@/pages/ShortTermRentals";
import NotFound from "@/pages/not-found";
import { StickyMobileBar } from "@/components/ui/StickyMobileBar";
import { AIChatWidget } from "@/components/ui/AIChatWidget";

function Router() {
  return (
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
      <Route path="/admin" component={Admin} />
      <Route path="/portal" component={Portal} />
      <Route path="/portal/login" component={PortalLogin} />
      <Route path="/portal/reset-password" component={ResetPassword} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
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
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
