import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, Loader } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProducts, useProductMutations } from "@/store/useStore";
import { Product } from "@/data/mock";
import { toast } from "sonner";

const empty: Product = {
  id: "",
  name: "",
  sku: "",
  category: "Audio",
  price: 0,
  stock: 0,
  status: "active",
};

const statusBadge = (s: Product["status"]) =>
  s === "active" ? (
    <Badge className="bg-success/15 text-success hover:bg-success/15">Active</Badge>
  ) : s === "draft" ? (
    <Badge variant="secondary">Draft</Badge>
  ) : (
    <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/15">Out of stock</Badge>
  );

export default function ProductsPage() {
  const { data: products = [], isLoading, error } = useProducts();
  const { addProduct, updateProduct, deleteProduct } = useProductMutations();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Product>(empty);
  const isAdmin = localStorage.getItem("userRole")?.toUpperCase() === "ADMIN";

  const list = useMemo(
    () =>
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(q.toLowerCase()) ||
          p.sku.toLowerCase().includes(q.toLowerCase()) ||
          p.category.toLowerCase().includes(q.toLowerCase()),
      ),
    [products, q],
  );

  const startNew = () => {
    setDraft(empty);
    setOpen(true);
  };
  const startEdit = (p: Product) => {
    setDraft(p);
    setOpen(true);
  };
  const save = () => {
    if (!draft.name || !draft.sku) {
      toast.error("Name and SKU are required");
      return;
    }
    if (draft.id) {
      updateProduct.mutate({ id: draft.id, product: draft });
    } else {
      addProduct.mutate(draft);
    }
    setOpen(false);
  };
  const remove = (p: Product) => {
    deleteProduct.mutate(p.id);
  };

  return (
    <AdminLayout
      title="Products"
      subtitle={isAdmin ? "Manage your catalogue, stock and pricing." : "View-only — contact an admin to make changes."}
      actions={
        isAdmin ? (
          <Button onClick={startNew} className="bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-95">
            <Plus className="mr-2 h-4 w-4" /> Add product
          </Button>
        ) : undefined
      }
    >
      {error && (
        <div className="mb-4 rounded-lg bg-destructive/15 p-4 text-destructive">
          Failed to load products: {error.message}
        </div>
      )}
      <div className="sticky top-0 z-10 mb-4 rounded-2xl border border-border bg-card/95 shadow-card backdrop-blur">
        <div className="flex items-center gap-3 border-b border-border p-4">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or SKU…" className="pl-9" />
          </div>
          <p className="ml-auto text-sm text-muted-foreground">
            {isLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              `${list.length} items`
            )}
          </p>
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary font-semibold">
                        {p.name.charAt(0)}
                      </div>
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.sku}</TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell className="text-right font-medium">₹{Number(p.price).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{p.stock}</TableCell>
                  <TableCell>{statusBadge(p.status)}</TableCell>
                  <TableCell className="text-right">
                    {isAdmin ? (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(p)} className="hover:text-primary">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(p)}
                          disabled={deleteProduct.isPending}
                          className="hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">View only</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {list.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {isAdmin && <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger className="hidden" />
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit product" : "New product"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Name</Label>
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>SKU</Label>
              <Input value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Price (₹)</Label>
              <Input type="number" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label>Stock</Label>
              <Input type="number" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Status</Label>
              <Select value={draft.status} onValueChange={(v: Product["status"]) => setDraft({ ...draft, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="out_of_stock">Out of stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={addProduct.isPending || updateProduct.isPending}>
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={addProduct.isPending || updateProduct.isPending}
              className="bg-gradient-primary text-primary-foreground"
            >
              {addProduct.isPending || updateProduct.isPending ? (
                <><Loader className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>}
    </AdminLayout>
  );
}
