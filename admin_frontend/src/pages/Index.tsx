import { ArrowDownRight, ArrowUpRight, DollarSign, Package, ShoppingCart, Users, Loader } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBills, useCarts, useProducts, useRevenueTrend, useCategoryShare, useOrdersCustomers } from "@/store/useStore";
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
  const { data: bills = [], isLoading: billsLoading } = useBills();
  const { data: carts = [], isLoading: cartsLoading } = useCarts();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: revenueTrend = [], isLoading: revenueTrendLoading } = useRevenueTrend();
  const { data: categoryShare = [], isLoading: categoryShareLoading } = useCategoryShare();
  const { data: ordersCustomers = [], isLoading: ordersCustomersLoading } = useOrdersCustomers();
  const nav = useNavigate();

  const isLoading = billsLoading || cartsLoading || productsLoading || revenueTrendLoading || categoryShareLoading || ordersCustomersLoading;

  // Calculate KPIs from backend data
  const revenue = Array.isArray(bills) ? bills.reduce((s, b) => s + (b.total || 0), 0) : 0;
  const activeCarts = Array.isArray(carts) ? carts.length : 0;
  const productCount = Array.isArray(products) ? products.length : 0;
  const lowStock = Array.isArray(products) ? products.filter((p) => p.stock && p.stock > 0 && p.stock < 15) : [];
  const outOfStock = Array.isArray(products) ? products.filter((p) => p.stock === 0) : [];

  // Fallback to mock data if empty
  const chartRevenueTrend = revenueTrend && revenueTrend.length > 0 ? revenueTrend : [
    { month: "Nov", revenue: 12400, orders: 142, customers: 96 },
    { month: "Dec", revenue: 18950, orders: 211, customers: 148 },
    { month: "Jan", revenue: 15200, orders: 178, customers: 121 },
    { month: "Feb", revenue: 17840, orders: 196, customers: 139 },
    { month: "Mar", revenue: 21300, orders: 234, customers: 167 },
    { month: "Apr", revenue: 24680, orders: 271, customers: 192 },
  ];

  const chartCategory = categoryShare && categoryShare.length > 0 ? categoryShare : [
    { name: "Audio", value: 32 },
    { name: "Computing", value: 28 },
    { name: "Wearables", value: 18 },
    { name: "Home", value: 12 },
    { name: "Accessories", value: 10 },
  ];

  const chartOrdersCustomers = ordersCustomers && ordersCustomers.length > 0 ? ordersCustomers : [
    { month: "Nov", orders: 142, customers: 96 },
    { month: "Dec", orders: 211, customers: 148 },
    { month: "Jan", orders: 178, customers: 121 },
    { month: "Feb", orders: 196, customers: 139 },
    { month: "Mar", orders: 234, customers: 167 },
    { month: "Apr", orders: 271, customers: 192 },
  ];

  if (isLoading) {
    return (
      <AdminLayout
        title="Dashboard"
        subtitle="Loading dashboard data..."
      >
        <div className="flex items-center justify-center py-20">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

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
        <KPI
          icon={DollarSign}
          label="Revenue"
          value={`$${revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          delta="+18.2%"
        />
        <KPI
          icon={ShoppingCart}
          label="Active carts"
          value={activeCarts}
          delta="+6.4%"
        />
        <KPI
          icon={Package}
          label="Products"
          value={productCount}
          delta="+2 new"
        />
        <KPI
          icon={Users}
          label="Invoices"
          value={Array.isArray(bills) ? bills.length : 0}
          delta="+8.3%"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Revenue trend</h3>
              <p className="text-xs text-muted-foreground">Last 6 months</p>
              {revenueTrend.length === 0 && (
                <p className="text-xs text-warning mt-1">Showing sample data (database is empty)</p>
              )}
            </div>
            <Badge className="bg-primary-soft text-primary hover:bg-primary-soft">+24.6%</Badge>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartRevenueTrend}>
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
              <Pie data={chartCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                {chartCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
            <BarChart data={chartOrdersCustomers}>
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
                    <p className="text-xs text-muted-foreground">{p.sku || "N/A"}</p>
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
