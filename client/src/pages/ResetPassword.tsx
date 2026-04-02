import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";

export default function ResetPassword() {
  useSEO({ title: "Reset Password", description: "Set a new password for your Maine Cleaning Co. client portal account." });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [, navigate] = useLocation();

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong");
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(220 20% 8%) 0%, hsl(220 18% 12%) 50%, hsl(220 16% 10%) 100%)' }}>
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, hsl(190 70% 50%) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="max-w-md w-full bg-card/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-border shadow-[0_8px_40px_rgba(0,0,0,0.3),0_1px_3px_rgba(0,0,0,0.15)] relative z-10 text-center">
          <div className="w-14 h-14 rounded-full bg-red-950/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="font-bold text-lg text-foreground mb-2">Invalid Reset Link</h2>
          <p className="text-sm text-muted-foreground mb-6">This reset link is missing or invalid. Please request a new one from the login page.</p>
          <Link href="/portal/login">
            <Button className="rounded-full" data-testid="button-go-login">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(220 20% 8%) 0%, hsl(220 18% 12%) 50%, hsl(220 16% 10%) 100%)' }}>
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, hsl(190 70% 50%) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/[0.04] blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-primary/[0.03] blur-3xl translate-y-1/3 -translate-x-1/4" />
      <div className="max-w-md w-full bg-card/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-border shadow-[0_8px_40px_rgba(0,0,0,0.3),0_1px_3px_rgba(0,0,0,0.15)] relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shadow-sm ring-1 ring-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-foreground" data-testid="text-reset-title">
          Set New Password
        </h1>
        <p className="text-muted-foreground text-center mb-8 text-sm">
          Choose a new password for your account
        </p>

        {success ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-green-500" />
            </div>
            <h3 className="font-bold text-foreground mb-2">Password updated!</h3>
            <p className="text-sm text-muted-foreground mb-6">Your password has been changed. You can now sign in with your new password.</p>
            <Link href="/portal/login">
              <Button className="rounded-full" data-testid="button-go-login">Sign In</Button>
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-950/30 text-red-400 text-sm p-3 rounded-xl mb-4 border border-red-500/30" data-testid="text-reset-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="New password (min 6 characters)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-12 rounded-xl border-border"
                required
                minLength={6}
                data-testid="input-new-password"
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="h-12 rounded-xl border-border"
                required
                minLength={6}
                data-testid="input-confirm-password"
              />
              <Button type="submit" className="w-full h-12 text-base rounded-xl shadow-md font-semibold" disabled={loading} data-testid="button-reset-submit">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Updating...</> : "Update Password"}
              </Button>
            </form>
          </>
        )}

        <div className="mt-6 text-center">
          <Link href="/portal/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
