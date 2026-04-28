import { ReactNode } from "react";
import { Bell, LogOut, Search } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/AppSidebar";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function AdminLayout({ title, subtitle, actions, children }: Props) {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole") || "staff";
  const roleName = userRole.toLowerCase() === "admin" ? "Admin" : "Staff";
  const roleBrand = `Smart Cart ${roleName}`;

  const getInitials = (role: string) => role.slice(0, 2).toUpperCase();
  const getRoleDisplay = (role: string) => role.charAt(0).toUpperCase() + role.slice(1);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-soft p-4 md:p-5">
        <AppSidebar />

        <div className="flex flex-1 flex-col md:pl-5">
          <header className="sticky top-4 z-30 mb-5 flex min-h-[5.25rem] items-center gap-3 rounded-[1.8rem] border border-border/80 bg-card/92 px-4 shadow-card backdrop-blur md:px-6">
            <SidebarTrigger className="rounded-xl border border-border/70 bg-background text-muted-foreground shadow-sm hover:text-primary" />

            <div className="hidden min-w-[10rem] rounded-2xl bg-primary-soft/90 px-4 py-3 text-sm font-semibold text-primary md:block">
              {roleBrand}
            </div>

            <div className="relative hidden max-w-md flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products, customers, orders..."
                className="h-14 rounded-2xl border-border/70 bg-accent/70 pl-10 text-base shadow-sm focus-visible:ring-primary"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-2xl border border-border/70 bg-background shadow-sm">
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-11 w-11 rounded-2xl border border-border/70 bg-background p-0 shadow-sm">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/15">
                      <AvatarFallback className="bg-gradient-primary font-semibold text-primary-foreground">
                        {getInitials(userRole)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{getRoleDisplay(userRole)} User</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {userRole.toLowerCase() === "admin" ? "admin@example.com" : "staff@example.com"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 px-1 pb-6 md:px-2 md:pb-8">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4 rounded-[1.8rem] border border-border/70 bg-card/88 px-5 py-5 shadow-card animate-fade-in md:px-7">
              <div>
                <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
                {subtitle && <p className="mt-1 text-base text-muted-foreground">{subtitle}</p>}
              </div>
              {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </div>

            <div className="animate-fade-in">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
