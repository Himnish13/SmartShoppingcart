import { useMemo, useState } from "react";
import { Loader, MapPin, Search, Square } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useCartMutations, useCarts, useProducts } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const positions = [
  "md:col-start-1 md:row-start-1",
  "md:col-start-2 md:row-start-1 md:translate-y-6",
  "md:col-start-3 md:row-start-1",
  "md:col-start-1 md:row-start-2 md:-translate-y-2",
  "md:col-start-3 md:row-start-2 md:translate-y-4",
];

export default function CartsPage() {
  const [q, setQ] = useState("");
  const { data: carts = [], isLoading: cartsLoading } = useCarts();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { stopCart } = useCartMutations();
  const map = useMemo(() => {
    if (!products || !Array.isArray(products)) return {};
    return Object.fromEntries(products.map((p) => [p.id, p]));
  }, [products]);

  const filteredCarts = useMemo(
    () =>
      carts.filter((cart: any) => {
        const haystack = `${cart.cartId || cart.id} ${cart.location || ""}`.toLowerCase();
        return haystack.includes(q.toLowerCase());
      }),
    [carts, q]
  );

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

  return (
    <AdminLayout
      title="Live Carts"
      subtitle="Assign cart devices and monitor active shopping sessions."
    >
      <section className="sticky top-0 z-10 mb-6 rounded-lg border border-border bg-card/95 p-4 shadow-card backdrop-blur">
        <div className="mb-3">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cart by ID or location..." className="pl-9" />
          </div>
        </div>
      </section>

      {!Array.isArray(filteredCarts) || filteredCarts.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">No active cart sessions</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {filteredCarts.map((cart, i) => {
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
                <p className="font-mono text-xs text-primary mt-1">{cart.cartId || cart.id}</p>
                <p className="font-mono text-[11px] text-muted-foreground mt-1">{cart.id}</p>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Items</p>
                {items.map((it) => (
                  <div key={it.productId} className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                    <span className="line-clamp-1">{it.product!.name}</span>
                    <span className="text-muted-foreground text-xs">x{it.qty}</span>
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
                <Button
                  className="mt-3 w-full"
                  variant="outline"
                  size="sm"
                  onClick={() => stopCart.mutate(cart.cartId || cart.id)}
                  disabled={stopCart.isPending}
                >
                  <Square />
                  Release
                </Button>
              </div>
            </article>
          );
        })}
      </div>
      )}
    </AdminLayout>
  );
}
