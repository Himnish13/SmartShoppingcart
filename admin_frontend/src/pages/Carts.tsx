import { useMemo } from "react";
import { MapPin, Loader } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useCarts, useProducts } from "@/store/useStore";

const positions = [
  "md:col-start-1 md:row-start-1",
  "md:col-start-2 md:row-start-1 md:translate-y-6",
  "md:col-start-3 md:row-start-1",
  "md:col-start-1 md:row-start-2 md:-translate-y-2",
  "md:col-start-3 md:row-start-2 md:translate-y-4",
];

export default function CartsPage() {
  const { data: carts = [], isLoading: cartsLoading } = useCarts();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const map = useMemo(() => {
    if (!products || !Array.isArray(products)) return {};
    return Object.fromEntries(products.map((p) => [p.id, p]));
  }, [products]);

  if (cartsLoading || productsLoading) {
    return (
      <AdminLayout
        title="Live Carts"
        subtitle="View active shopping carts with items."
      >
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!Array.isArray(carts) || carts.length === 0) {
    return (
      <AdminLayout
        title="Live Carts"
        subtitle="View active shopping carts with items."
      >
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">No carts available</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Live Carts"
      subtitle="View active shopping carts with items."
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {carts.map((cart, i) => {
          const items = cart.items
            .map((it) => ({ ...it, product: map[it.productId] }))
            .filter((x) => x.product);

          return (
            <article
              key={cart.id}
              className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant ${positions[i % positions.length]}`}
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-primary opacity-10 blur-2xl" />

              <div>
                <p className="font-semibold text-sm">Cart ID</p>
                <p className="font-mono text-xs text-primary mt-1">{cart.id}</p>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Items</p>
                {items.map((it) => (
                  <div key={it.productId} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                    <span className="line-clamp-1">{it.product!.name}</span>
                    <span className="text-muted-foreground text-xs">×{it.qty}</span>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No items</p>
                )}
              </div>

              <div className="mt-5 border-t border-border pt-4">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {cart.location}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </AdminLayout>
  );
}
