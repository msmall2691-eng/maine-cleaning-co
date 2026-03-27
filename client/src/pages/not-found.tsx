import { Link } from "wouter";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center px-6 max-w-md">
        <p className="text-7xl font-serif font-bold text-primary mb-4">404</p>
        <h1 className="text-2xl font-bold text-foreground mb-3">Page not found</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Sorry, we couldn't find that page. It may have been moved or no longer exists.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/">
            <Button className="rounded-full gap-2">
              <Home className="w-4 h-4" /> Back to Home
            </Button>
          </Link>
          <Link href="/services">
            <Button variant="outline" className="rounded-full gap-2">
              <ArrowLeft className="w-4 h-4" /> View Services
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
