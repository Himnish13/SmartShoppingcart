import { useMemo } from "react";
import { Clock, MapPin, ShoppingBag } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/store/useStore";

const statusStyle = {
  active: "bg-success/15 text-success",
  checkout: "bg-primary-soft text-primary",
  abandoned: "bg-destructive/15 text-destructive",
} as const;

const positions = [
  "md:col-start-1 md:row-start-1",
  "md:col-start-2 md:row-start-1 md:translate-y-6",
  "md:col-start-3 md:row-start-1",
  "md:col-start-1 md:row-start-2 md:-translate-y-2",
  "md:col-start-3 md:row-start-2 md:translate-y-4",
];

export default function CartsPage() {
  const { carts, products } = useStore();
  const map = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);

  return (
    <AdminLayout
      title="Live Carts"
      subtitle="Snapshot of customer carts in motion across positions on your storefront."
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {carts.map((c, i) => {
          const items = c.items.map((it) => ({ ...it, product: map[it.productId] })).filter((x) => x.product);
          const total = items.reduce((s, it) => s + it.product!.price * it.qty, 0);
          return (
            <article
              key={c.id}
              className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant ${positions[i % positions.length]}`}
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-primary opacity-10 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{c.customer}</p>
                  <p className="text-xs text-muted-foreground">{c.email}</p>
                </div>
                <Badge className={`${statusStyle[c.status]} hover:${statusStyle[c.status]} capitalize`}>{c.status}</Badge>
              </div>

              <div className="mt-4 space-y-2">
                {items.map((it) => (
                  <div key={it.productId} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-soft text-primary text-xs font-bold">
                        {it.product!.name.charAt(0)}
                      </div>
                      <span className="line-clamp-1">{it.product!.name}</span>
                    </div>
                    <span className="text-muted-foreground">×{it.qty}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{c.location}</p>
                  <p className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{new Date(c.updatedAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground flex items-center justify-end gap-1"><ShoppingBag className="h-3 w-3" />Total</p>
                  <p className="font-display text-lg font-bold text-primary">${total.toFixed(2)}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </AdminLayout>
  );
}