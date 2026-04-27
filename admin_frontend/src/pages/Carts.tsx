import { useMemo, useState } from "react";
import { MapPin, Loader, Play, Square } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useCartDevices, useCartMutations, useCarts, useProducts } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const positions = [
  "md:col-start-1 md:row-start-1",
  "md:col-start-2 md:row-start-1 md:translate-y-6",
  "md:col-start-3 md:row-start-1",
  "md:col-start-1 md:row-start-2 md:-translate-y-2",
  "md:col-start-3 md:row-start-2 md:translate-y-4",
];

export default function CartsPage() {
  const [selectedCartId, setSelectedCartId] = useState("");
  const [userId, setUserId] = useState("");
  const { data: carts = [], isLoading: cartsLoading } = useCarts();
  const { data: devices = [], isLoading: devicesLoading } = useCartDevices();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { startCart, stopCart } = useCartMutations();
  const map = useMemo(() => {
    if (!products || !Array.isArray(products)) return {};
    return Object.fromEntries(products.map((p) => [p.id, p]));
  }, [products]);

  const availableDevices = useMemo(
    () => devices.filter((device: any) => String(device.status || "").toUpperCase() !== "ACTIVE" || !device.session_id),
    [devices]
  );

  const activateCart = () => {
    if (!selectedCartId) return;
    startCart.mutate({ cartId: selectedCartId, userId });
  };

  if (cartsLoading || productsLoading || devicesLoading) {
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
      <section className="mb-6 rounded-lg border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_auto]">
          <Select value={selectedCartId} onValueChange={setSelectedCartId}>
            <SelectTrigger>
              <SelectValue placeholder="Select cart device" />
            </SelectTrigger>
            <SelectContent>
              {availableDevices.map((device: any) => (
                <SelectItem key={device.cart_id} value={device.cart_id}>
                  {device.cart_id} - {device.status || "UNKNOWN"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            inputMode="numeric"
            placeholder="User ID optional"
          />
          <Button
            onClick={activateCart}
            disabled={!selectedCartId || startCart.isPending}
          >
            <Play />
            Activate
          </Button>
        </div>
      </section>

      {!Array.isArray(carts) || carts.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">No active cart sessions</p>
        </div>
      ) : (
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
