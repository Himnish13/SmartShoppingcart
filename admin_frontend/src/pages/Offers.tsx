import { useMemo, useState } from "react";
import { Pencil, Plus, Tag, Trash2, Loader } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts, useOffers, useOfferMutations } from "@/store/useStore";
import { Offer } from "@/data/mock";
import { toast } from "sonner";

const empty = (productId = ""): Offer => ({
  id: "",
  productId,
  title: "",
  discountPct: 10,
  startsAt: new Date().toISOString().slice(0, 10),
  endsAt: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  status: "active",
});

const statusBadge = (s: Offer["status"]) =>
  s === "active" ? (
    <Badge className="bg-success/15 text-success hover:bg-success/15">Active</Badge>
  ) : s === "scheduled" ? (
    <Badge className="bg-primary-soft text-primary hover:bg-primary-soft">Scheduled</Badge>
  ) : (
    <Badge variant="secondary">Expired</Badge>
  );

export default function OffersPage() {
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: offers = [], isLoading: offersLoading } = useOffers();
  const { addOffer, updateOffer, deleteOffer } = useOfferMutations();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Offer>(empty());

  const productMap = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);
  const withOffers = offers.map((o) => ({ ...o, product: productMap[o.productId] })).filter((x) => x.product);
  const productIdsWithOffer = new Set(offers.map((o) => o.productId));
  const withoutOffers = products.filter((p) => !productIdsWithOffer.has(p.id));

  const startNew = (productId = "") => {
    setDraft(empty(productId));
    setOpen(true);
  };
  const startEdit = (o: Offer) => {
    setDraft(o);
    setOpen(true);
  };
  const save = () => {
    if (!draft.productId || !draft.title) {
      toast.error("Pick a product and enter a title");
      return;
    }

    // Validate dates
    const startDate = new Date(draft.startsAt);
    const endDate = new Date(draft.endsAt);

    if (startDate >= endDate) {
      toast.error("Start date must be before end date");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (endDate < today) {
      toast.error("End date cannot be in the past");
      return;
    }

    if (draft.id) {
      updateOffer.mutate({ productId: draft.productId, offer: draft });
    } else {
      addOffer.mutate(draft);
    }
    setOpen(false);
  };
  const remove = (o: Offer) => {
    deleteOffer.mutate(o.productId);
  };

  return (
    <AdminLayout
      title="Offers"
      subtitle="Run discounts on products and turn slow movers into stars."
      actions={
        <Button onClick={() => startNew()} className="bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-95">
          <Plus className="mr-2 h-4 w-4" /> New offer
        </Button>
      }
    >
      <Tabs defaultValue="with" className="space-y-4">
        <TabsList className="bg-secondary/60">
          <TabsTrigger value="with">Products with offers ({withOffers.length})</TabsTrigger>
          <TabsTrigger value="without">Without offers ({withoutOffers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="with">
          <div className="rounded-2xl border border-border bg-card shadow-card">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Offer</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Final price</TableHead>
                    <TableHead>Window</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withOffers.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.product!.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tag className="h-3.5 w-3.5 text-primary" />
                          {o.title}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-primary font-semibold">-{o.discountPct}%</TableCell>
                      <TableCell className="text-right">
                        <span className="text-muted-foreground line-through mr-2">₹{Number(o.product!.price).toFixed(2)}</span>
                        <span className="font-semibold">₹{(Number(o.product!.price) * (1 - o.discountPct / 100)).toFixed(2)}</span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {o.startsAt} → {o.endsAt}
                      </TableCell>
                      <TableCell>{statusBadge(o.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => startEdit(o)} className="hover:text-primary">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => remove(o)} className="hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {withOffers.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">No offers yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="without">
          <div className="rounded-2xl border border-border bg-card shadow-card">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withoutOffers.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.category}</TableCell>
                      <TableCell className="text-right">₹{Number(p.price).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{p.stock}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => startNew(p.id)} className="border-primary/30 text-primary hover:bg-primary-soft">
                          <Plus className="mr-1 h-3.5 w-3.5" /> Add offer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {withoutOffers.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">All products have offers 🎉</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit offer" : "New offer"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Product</Label>
              <Select value={draft.productId} onValueChange={(v) => setDraft({ ...draft, productId: v })}>
                <SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Title</Label>
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Spring Sale" />
            </div>
            <div className="space-y-1.5">
              <Label>Discount %</Label>
              <Input type="number" value={draft.discountPct} onChange={(e) => setDraft({ ...draft, discountPct: Number(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={draft.status} onValueChange={(v: Offer["status"]) => setDraft({ ...draft, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Starts</Label>
              <Input type="date" value={draft.startsAt} onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Ends</Label>
              <Input type="date" value={draft.endsAt} onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={addOffer.isPending || updateOffer.isPending}>Cancel</Button>
            <Button
              onClick={save}
              disabled={addOffer.isPending || updateOffer.isPending}
              className="bg-gradient-primary text-primary-foreground"
            >
              {addOffer.isPending || updateOffer.isPending ? (
                <><Loader className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                "Save offer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}