import { LayoutDashboard, LogOut, Package, ReceiptText, ShoppingCart, Sparkles, Tag } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Products", url: "/products", icon: Package },
  { title: "Offers", url: "/offers", icon: Tag },
  { title: "Carts", url: "/carts", icon: ShoppingCart },
  { title: "Bills", url: "/bills", icon: ReceiptText },
  { title: "Feedback", url: "/feedback", icon: Sparkles },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole") || "staff";
  const roleName = userRole.toLowerCase() === "admin" ? "Admin" : "Staff";
  const getInitials = (role: string) => role.slice(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  return (
    <Sidebar collapsible="offcanvas" variant="floating" className="border-r-0 bg-transparent">
      <SidebarContent className="px-2 py-5 sm:px-3">
        <SidebarHeader className="-ml-1 px-0 py-2 pb-5 sm:ml-0 sm:px-3">
          <div className="-ml-4 grid grid-cols-[40px_minmax(0,1fr)_30px] items-start gap-0.5 rounded-[1.8rem] bg-transparent px-0 py-2 sm:-ml-1 sm:grid-cols-[44px_minmax(0,1fr)_38px] sm:gap-1.5 sm:px-2">
            <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-[#fff3cf] text-slate-700 shadow-sm sm:h-11 sm:w-11">
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} />
            </div>

            {!collapsed && (
              <>
                <div className="-ml-1 min-w-0 leading-tight sm:ml-0">
                  <p className="whitespace-nowrap font-display text-[0.98rem] font-extrabold tracking-tight text-slate-800 sm:text-[1.05rem]">
                    Smart Cart
                  </p>
                  <p className="text-[0.78rem] text-slate-500 sm:text-[0.82rem]">{roleName} workspace</p>
                </div>
                <SidebarTrigger className="mt-1 ml-2 h-[30px] w-[30px] shrink-0 rounded-xl border border-border/70 bg-background p-0 text-muted-foreground shadow-sm hover:text-primary sm:ml-1 sm:h-9 sm:w-9" />
              </>
            )}
          </div>
        </SidebarHeader>

        <SidebarGroup className="bg-transparent px-0 py-0 shadow-none">
          {!collapsed && (
            <SidebarGroupLabel className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Navigation
            </SidebarGroupLabel>
          )}

          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 rounded-2xl px-3 py-3 text-base font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="!bg-primary-soft !text-primary shadow-sm"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarFooter className="mt-auto px-3 pt-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-start gap-3 rounded-2xl bg-transparent px-3 py-3 shadow-none hover:bg-accent/40"
              >
                <Avatar className="h-10 w-10 ring-2 ring-primary/15">
                  <AvatarFallback className="bg-gradient-primary font-semibold text-primary-foreground">
                    {getInitials(userRole)}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="min-w-0 text-left">
                    <p className="truncate text-sm font-semibold text-foreground">{roleName}</p>
                    <p className="truncate text-xs text-muted-foreground">Open profile actions</p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56" align="end" side="top">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{roleName} User</p>
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
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}
