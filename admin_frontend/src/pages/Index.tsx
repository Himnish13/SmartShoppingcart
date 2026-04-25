import { ArrowDownRight, ArrowUpRight, DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { analyticsTrend, categoryShare } from "@/data/mock";
import { useStore } from "@/store/useStore";
import { useNavigate } from "react-router-dom";

const COLORS = ["hsl(245 44% 59%)", "hsl(258 60% 68%)", "hsl(245 70% 78%)", "hsl(232 50% 65%)", "hsl(270 50% 70%)"];

const KPI = ({ icon: Icon, label, value, delta, positive = true }: any) => (
  <div className="rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elegant">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-2 font-display text-2xl font-bold">{value}</p>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant">
        <Icon className="h-5 w-5" />
      </div>
    </div>
    <p className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${positive ? "text-success" : "text-destructive"}`}>
      {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
      {delta} <span className="text-muted-foreground font-normal">vs last month</span>
    </p>
  </div>
);

const Dashboard = () => {
  const { products, bills, carts } = useStore();
  const nav = useNavigate();
  const revenue = bills.reduce((s, b) => s + b.total, 0);
  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 15);
  const outOfStock = products.filter((p) => p.stock === 0);

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="Welcome back — here's how your store is performing today."
      actions={
        <Button onClick={() => nav("/bills")} className="bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-95">
          New invoice
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPI icon={DollarSign} label="Revenue" value={`$${revenue.toLocaleString()}`} delta="+18.2%" />
        <KPI icon={ShoppingCart} label="Active carts" value={carts.length} delta="+6.4%" />
        <KPI icon={Package} label="Products" value={products.length} delta="+2 new" />
        <KPI icon={Users} label="Customers" value="1,284" delta="-1.1%" positive={false} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Revenue trend</h3>
              <p className="text-xs text-muted-foreground">Last 6 months</p>
            </div>
            <Badge className="bg-primary-soft text-primary hover:bg-primary-soft">+24.6%</Badge>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={analyticsTrend}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(245 44% 59%)" stopOpacity={0.55} />
                  <stop offset="95%" stopColor="hsl(245 44% 59%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(245 20% 92%)" />
              <XAxis dataKey="month" stroke="hsl(245 12% 48%)" fontSize={12} />
              <YAxis stroke="hsl(245 12% 48%)" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(245 20% 90%)" }} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(245 44% 59%)" strokeWidth={2.5} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="font-display text-lg font-semibold">Category share</h3>
          <p className="mb-2 text-xs text-muted-foreground">Revenue by category</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categoryShare} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                {categoryShare.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(245 20% 90%)" }} />
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card lg:col-span-2">
          <h3 className="font-display text-lg font-semibold">Orders & customers</h3>
          <p className="mb-3 text-xs text-muted-foreground">Monthly comparison</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={analyticsTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(245 20% 92%)" />
              <XAxis dataKey="month" stroke="hsl(245 12% 48%)" fontSize={12} />
              <YAxis stroke="hsl(245 12% 48%)" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(245 20% 90%)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="orders" fill="hsl(245 44% 59%)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="customers" fill="hsl(258 60% 78%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="font-display text-lg font-semibold">Inventory alerts</h3>
          <p className="mb-3 text-xs text-muted-foreground">Items needing attention</p>
          <div className="space-y-2">
            {[...outOfStock, ...lowStock].slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-soft text-primary text-xs font-bold">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium line-clamp-1">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.sku}</p>
                  </div>
                </div>
                <Badge className={p.stock === 0 ? "bg-destructive/15 text-destructive hover:bg-destructive/15" : "bg-warning/15 text-warning hover:bg-warning/15"}>
                  {p.stock === 0 ? "Out" : `${p.stock} left`}
                </Badge>
              </div>
            ))}
            {outOfStock.length + lowStock.length === 0 && (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">All stocked up.</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
