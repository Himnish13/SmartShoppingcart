import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/AppSidebar";

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

function DesktopSidebarToggle() {
  const { state } = useSidebar();

  if (state !== "collapsed") {
    return null;
  }

  return (
    <div
      className="absolute top-7 z-30 hidden transition-[left] duration-200 ease-linear md:block"
      style={{ left: "1.25rem" }}
    >
      <SidebarTrigger className="h-12 w-12 rounded-2xl border border-border/70 bg-background text-muted-foreground shadow-sm hover:text-primary" />
    </div>
  );
}

export default function AdminLayout({ title, subtitle, actions, children }: Props) {
  return (
    <SidebarProvider>
      <div className="relative flex h-screen w-full overflow-hidden bg-gradient-soft p-4 md:p-5">
        <DesktopSidebarToggle />
        <AppSidebar />

        <div className="flex min-h-0 flex-1 flex-col md:pl-3">
          <main className="flex min-h-0 flex-1 flex-col px-1 pb-6 pt-0 md:px-2 md:pb-8">
            <div className="sticky top-0 z-20 mb-5 flex flex-wrap items-end justify-between gap-4 rounded-[1.8rem] border border-border/70 bg-card/95 px-5 py-5 shadow-card animate-fade-in md:px-7">
              <div className="md:hidden">
                <SidebarTrigger className="rounded-xl border border-border/70 bg-background text-muted-foreground shadow-sm hover:text-primary" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
                {subtitle && <p className="mt-1 text-base text-muted-foreground">{subtitle}</p>}
              </div>
              {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1 animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
