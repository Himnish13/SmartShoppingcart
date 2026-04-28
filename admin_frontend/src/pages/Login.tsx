import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogIn, Lock, ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/services/api";
import cartSidebarLogo from "@/assets/cart-sidebar-logo.svg";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.login({ identifier, password });
      if (response.token) {
        localStorage.setItem("authToken", response.token);
        localStorage.setItem("userRole", response.role || "");
        toast.success("Login successful");
        navigate(from, { replace: true });
      } else {
        toast.error("Login failed. No token received.");
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-7xl gap-6 lg:grid-cols-[1.15fr_0.75fr]">
        <section className="relative overflow-hidden rounded-[2rem] border-[3px] border-primary/55 bg-secondary shadow-card">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_42%_42%,rgba(255,216,140,0.52),transparent_14rem)]" />
          <div className="absolute inset-x-0 bottom-0 h-28 rounded-t-[999px] border-t border-primary/15 bg-[#f8eed5]/95" />

          <div className="relative flex h-full flex-col p-6 md:p-10">
            <div className="flex items-center gap-3">
              <div className="warm-cream-panel flex h-14 w-14 items-center justify-center rounded-2xl border shadow-sm">
                <ShoppingCart className="h-7 w-7 text-slate-600" strokeWidth={1.9} />
              </div>
              <div>
                <h1 className="font-display text-2xl font-extrabold tracking-tight">Smart Cart</h1>
                <p className="text-sm text-muted-foreground">Admin workspace</p>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center py-10">
              <div className="relative flex h-[28rem] w-full max-w-[34rem] items-center justify-center">
                <div className="absolute h-72 w-72 rounded-full bg-[#ffd98d]/70 blur-[1px]" />
                <div className="absolute h-[24rem] w-[24rem] rounded-full border border-primary/10 bg-white/12" />
                <img
                  src={cartSidebarLogo}
                  alt="Smart Cart illustration"
                  className="relative z-10 h-[18rem] w-[18rem] object-contain drop-shadow-[0_16px_24px_rgba(71,65,180,0.22)]"
                />
              </div>
            </div>

            <div className="warm-cream-panel relative z-10 flex items-center justify-between gap-4 rounded-[1.75rem] border px-5 py-4 text-sm shadow-sm backdrop-blur-sm">
              <div>
                <p className="font-semibold text-foreground">Staff and admin control center</p>
                <p className="text-muted-foreground">Manage products, carts, bills, offers and day-to-day store operations in one place.</p>
              </div>
              <div className="warm-cream-soft hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm md:flex">
                <ShoppingCart className="h-5 w-5 text-slate-600" strokeWidth={2} />
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-elegant">
          <div className="bg-gradient-primary px-8 py-8 text-primary-foreground">
            <div className="mb-6 flex justify-end gap-3">
              <span className="h-2 w-8 rounded-full bg-[#f4d37f]/90" />
              <span className="h-2 w-8 rounded-full bg-[#f4d37f]/90" />
              <span className="h-2 w-8 rounded-full bg-[#f4d37f]/90" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-foreground/80">Secure Access</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight">Welcome back</h2>
            <p className="mt-2 text-base text-primary-foreground/85">Sign in to continue managing your store.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 p-8 md:p-10">
            <div className="space-y-2">
              <label className="text-sm font-semibold leading-none" htmlFor="identifier">
                Staff ID or Email
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="identifier"
                  placeholder="admin@example.com"
                  className="h-14 pl-11"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold leading-none" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="h-14 pl-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="h-14 w-full bg-gradient-primary text-lg text-primary-foreground shadow-elegant hover:opacity-95"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  Sign in
                </span>
              )}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
