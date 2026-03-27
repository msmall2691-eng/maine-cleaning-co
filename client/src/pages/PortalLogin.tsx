import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { Shield, Loader2, ArrowRight, Mail, CheckCircle2 } from "lucide-react";

export default function PortalLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const { login, register } = useAuth();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "forgot") {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!res.ok) throw new Error("Something went wrong");
        setForgotSent(true);
      } else if (mode === "login") {
        await login(email, password);
        navigate("/portal");
      } else {
        await register({ email, password, name: name || undefined, phone: phone || undefined });
        navigate("/portal");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(220 20% 8%) 0%, hsl(220 18% 12%) 50%, hsl(220 16% 10%) 100%)' }}>
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, hsl(190 70% 50%) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/[0.06] blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-primary/[0.03] blur-3xl translate-y-1/3 -translate-x-1/4" />
      <div className="max-w-md w-full bg-card/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-border shadow-[0_8px_40px_rgba(0,0,0,0.3),0_1px_3px_rgba(0,0,0,0.15)] relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shadow-sm ring-1 ring-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-foreground" data-testid="text-portal-title">
          {mode === "forgot" ? "Reset Password" : "Client Portal"}
        </h1>
        <p className="text-muted-foreground text-center mb-8 text-sm">
          {mode === "login" ? "Sign in to manage your cleaning services" : mode === "register" ? "Create your account to get started" : "Enter your email and we'll send you a reset link"}
        </p>

        {mode !== "forgot" && (
          <div className="flex rounded-xl bg-muted/60 p-1 gap-0.5 mb-6">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              data-testid="tab-login"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${mode === "register" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              data-testid="tab-register"
            >
              Create Account
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-500/15 text-red-400 text-sm p-3 rounded-xl mb-4 border border-red-500/30" data-testid="text-auth-error">
            {error}
          </div>
        )}

        {mode === "forgot" && forgotSent ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-green-500" />
            </div>
            <h3 className="font-bold text-foreground mb-2">Check your email</h3>
            <p className="text-sm text-muted-foreground mb-6">If an account exists for {email}, we've sent a password reset link. Check your inbox (and spam folder).</p>
            <button
              onClick={() => { setMode("login"); setForgotSent(false); setError(""); }}
              className="text-sm text-primary font-medium hover:underline"
              data-testid="link-back-to-login"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <Input placeholder="Full name" value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-xl border-border" data-testid="input-register-name" />
                <Input placeholder="Phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="h-12 rounded-xl border-border" data-testid="input-register-phone" />
              </>
            )}
            <Input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} className="h-12 rounded-xl border-border" required data-testid="input-auth-email" />
            {mode !== "forgot" && (
              <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="h-12 rounded-xl border-border" required minLength={6} data-testid="input-auth-password" />
            )}
            <Button type="submit" className="w-full h-12 text-base rounded-xl shadow-md font-semibold" disabled={loading} data-testid="button-auth-submit">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Please wait...</> : (
                mode === "forgot" ? <><Mail className="w-4 h-4 mr-2" /> Send Reset Link</> :
                <>{mode === "login" ? "Sign In" : "Create Account"} <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>

            {mode === "login" && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setMode("forgot"); setError(""); }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  data-testid="link-forgot-password"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {mode === "forgot" && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(""); }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  data-testid="link-back-to-login"
                >
                  Back to sign in
                </button>
              </div>
            )}
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-back-home">
            Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
