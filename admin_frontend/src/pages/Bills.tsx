import { useMemo, useState } from "react";
import { Download, Pencil, Plus, Printer, Trash2, X } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { actions, useStore } from "@/store/useStore";
import { Bill } from "@/data/mock";
import { toast } from "sonner";

const TAX = 0.1;

const empty = (): Bill => ({
  id: "",
  number: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
  customer: "",
  email: "",
  items: [],
  subtotal: 0,
  tax: 0,
  total: 0,
  status: "unpaid",
  issuedAt: new Date().toISOString().slice(0, 10),
  dueAt: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
});

const statusBadge = (s: Bill["status"]) =>
  s === "paid" ? (
    <Badge className="bg-success/15 text-success hover:bg-success/15">Paid</Badge>
  ) : s === "unpaid" ? (
    <Badge className="bg-primary-soft text-primary hover:bg-primary-soft">Unpaid</Badge>
  ) : (
    <Badge className="bg-destructive/15 text-destructive hover:bg-destructive/15">Overdue</Badge>
  );

const computeTotals = (b: Bill): Bill => {
  const subtotal = b.items.reduce((s, i) => s + i.qty * i.price, 0);
  const tax = +(subtotal * TAX).toFixed(2);
  return { ...b, subtotal: +subtotal.toFixed(2), tax, total: +(subtotal + tax).toFixed(2) };
};

export default function BillsPage() {
  const { bills, products } = useStore();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Bill | null>(null);
  const [draft, setDraft] = useState<Bill>(empty());

  const startNew = () => { setDraft(empty()); setOpen(true); };
  const startEdit = (b: Bill) => { setDraft(b); setOpen(true); };
  const save = () => {
    if (!draft.customer || draft.items.length === 0) {
      toast.error("Customer and at least one item are required");
      return;
    }
    const final = computeTotals(draft);
    actions.upsertBill({ ...final, id: final.id || actions.newId("b") });
    toast.success(draft.id ? "Bill updated" : "Bill created");
    setOpen(false);
  };

  const summary = useMemo(() => {
    const total = bills.reduce((s, b) => s + b.total, 0);
    const paid = bills.filter((b) => b.status === "paid").reduce((s, b) => s + b.total, 0);
    const overdue = bills.filter((b) => b.status === "overdue").reduce((s, b) => s + b.total, 0);
    return { total, paid, overdue };
  }, [bills]);

  return (
    <AdminLayout
      title="Bills & Invoices"
      subtitle="Generate, track and recover invoices."
      actions={
        <Button onClick={startNew} className="bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-95">
          <Plus className="mr-2 h-4 w-4" /> New bill
        </Button>
      }
    >
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: "Billed", value: summary.total, accent: "text-primary" },
          { label: "Collected", value: summary.paid, accent: "text-success" },
          { label: "Overdue", value: summary.overdue, accent: "text-destructive" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className={`mt-2 font-display text-2xl font-bold ${s.accent}`}>${s.value.toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-sm">{b.number}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{b.customer}</p>
                      <p className="text-xs text-muted-foreground">{b.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{b.issuedAt}</TableCell>
                  <TableCell className="text-muted-foreground">{b.dueAt}</TableCell>
                  <TableCell className="text-right font-semibold">${b.total.toFixed(2)}</TableCell>
                  <TableCell>{statusBadge(b.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setPreview(b)} className="hover:text-primary"><Printer className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => startEdit(b)} className="hover:text-primary"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { actions.deleteBill(b.id); toast.success("Bill deleted"); }} className="hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit / create */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit bill" : "Generate new bill"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Invoice #</Label>
              <Input value={draft.number} onChange={(e) => setDraft({ ...draft, number: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={draft.status} onValueChange={(v: Bill["status"]) => setDraft({ ...draft, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <Input value={draft.customer} onChange={(e) => setDraft({ ...draft, customer: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Issued</Label>
              <Input type="date" value={draft.issuedAt} onChange={(e) => setDraft({ ...draft, issuedAt: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Due</Label>
              <Input type="date" value={draft.dueAt} onChange={(e) => setDraft({ ...draft, dueAt: e.target.value })} />
            </div>

            <div className="col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <Label>Items</Label>
                <Select
                  value=""
                  onValueChange={(pid) => {
                    const p = products.find((x) => x.id === pid);
                    if (!p) return;
                    setDraft({ ...draft, items: [...draft.items, { name: p.name, qty: 1, price: p.price }] });
                  }}
                >
                  <SelectTrigger className="w-56"><SelectValue placeholder="+ Add product" /></SelectTrigger>
                  <SelectContent>
                    {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                {draft.items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 items-center gap-2 rounded-lg border border-border bg-secondary/40 p-2">
                    <Input className="col-span-6 bg-background" value={it.name} onChange={(e) => {
                      const items = [...draft.items]; items[idx] = { ...it, name: e.target.value }; setDraft({ ...draft, items });
                    }} />
                    <Input className="col-span-2 bg-background" type="number" value={it.qty} onChange={(e) => {
                      const items = [...draft.items]; items[idx] = { ...it, qty: Number(e.target.value) }; setDraft({ ...draft, items });
                    }} />
                    <Input className="col-span-3 bg-background" type="number" value={it.price} onChange={(e) => {
                      const items = [...draft.items]; items[idx] = { ...it, price: Number(e.target.value) }; setDraft({ ...draft, items });
                    }} />
                    <Button variant="ghost" size="icon" className="col-span-1 hover:text-destructive" onClick={() => {
                      setDraft({ ...draft, items: draft.items.filter((_, i) => i !== idx) });
                    }}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                {draft.items.length === 0 && <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No items yet — add a product above.</p>}
              </div>
              <div className="mt-3 flex justify-end gap-6 text-sm">
                <span className="text-muted-foreground">Subtotal: <strong className="text-foreground">${draft.items.reduce((s, i) => s + i.qty * i.price, 0).toFixed(2)}</strong></span>
                <span className="text-muted-foreground">Tax (10%): <strong className="text-foreground">${(draft.items.reduce((s, i) => s + i.qty * i.price, 0) * TAX).toFixed(2)}</strong></span>
                <span className="font-display text-base font-bold text-primary">Total: ${(draft.items.reduce((s, i) => s + i.qty * i.price, 0) * (1 + TAX)).toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} className="bg-gradient-primary text-primary-foreground">Save bill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview */}
      <Dialog open={!!preview} onOpenChange={(v) => !v && setPreview(null)}>
        <DialogContent className="max-w-2xl">
          {preview && (
            <div className="space-y-6">
              <div className="flex items-start justify-between border-b border-border pb-4">
                <div>
                  <p className="font-display text-2xl font-bold text-primary">Violet Admin</p>
                  <p className="text-xs text-muted-foreground">123 Commerce Way · contact@violet.io</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm">{preview.number}</p>
                  <p className="text-xs text-muted-foreground">Issued {preview.issuedAt}</p>
                  <p className="text-xs text-muted-foreground">Due {preview.dueAt}</p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Bill to</p>
                <p className="font-semibold">{preview.customer}</p>
                <p className="text-sm text-muted-foreground">{preview.email}</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Line</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.items.map((it, i) => (
                    <TableRow key={i}>
                      <TableCell>{it.name}</TableCell>
                      <TableCell className="text-right">{it.qty}</TableCell>
                      <TableCell className="text-right">${it.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">${(it.qty * it.price).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="ml-auto w-72 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${preview.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>${preview.tax.toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-border pt-2 font-display text-base font-bold text-primary"><span>Total</span><span>${preview.total.toFixed(2)}</span></div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button>
                <Button className="bg-gradient-primary text-primary-foreground" onClick={() => toast.success("Download started")}>
                  <Download className="mr-2 h-4 w-4" />Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}