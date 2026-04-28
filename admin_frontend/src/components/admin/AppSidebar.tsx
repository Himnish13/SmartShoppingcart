import { LayoutDashboard, Package, ReceiptText, ShoppingCart, Sparkles, Tag } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

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
  const userRole = localStorage.getItem("userRole") || "staff";
  const roleName = userRole.toLowerCase() === "admin" ? "Admin" : "Staff";

  return (
    <Sidebar collapsible="offcanvas" variant="floating" className="border-r-0 bg-transparent">
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-center gap-3 rounded-[1.8rem] border border-border/60 bg-white/95 px-4 py-3 shadow-[0_12px_28px_rgba(25,35,72,0.12)]">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff3cf] text-slate-700 shadow-sm">
            <ShoppingCart className="h-5 w-5" strokeWidth={2} />
          </div>

          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="whitespace-nowrap font-display text-[1.1rem] font-extrabold tracking-tight text-slate-800">Smart Cart</p>
                <p className="text-[0.82rem] text-slate-500">{roleName} workspace</p>
              </div>
            </>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 pb-4">
        <SidebarGroup className="rounded-[1.8rem] border border-border/70 bg-card px-2 py-3 shadow-card">
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
      </SidebarContent>
    </Sidebar>
  );
}
