import { useMemo, useState } from "react";
import { Download, Pencil, Plus, Trash2, X, Loader } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBills, useBillMutations, useProducts } from "@/store/useStore";
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

const downloadPDF = (bill: Bill) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${bill.number}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
        .company { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .company-info { font-size: 12px; color: #666; }
        .invoice-details { float: right; text-align: right; margin-top: -60px; }
        .invoice-number { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
        .invoice-dates { font-size: 12px; color: #666; margin-bottom: 3px; }
        .bill-to { margin: 30px 0; }
        .bill-to-label { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #999; margin-bottom: 8px; }
        .bill-to-name { font-size: 14px; font-weight: bold; margin-bottom: 3px; }
        .bill-to-email { font-size: 12px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 30px 0; }
        thead { background-color: #f5f5f5; }
        th { text-align: left; padding: 12px; font-weight: bold; border-bottom: 2px solid #ddd; font-size: 12px; }
        td { padding: 12px; border-bottom: 1px solid #eee; font-size: 12px; }
        .total-section { width: 100%; margin-top: 30px; }
        .totals { float: right; width: 300px; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .total-final { display: flex; justify-content: space-between; padding: 12px 0; border-top: 2px solid #000; border-bottom: 2px solid #000; font-weight: bold; font-size: 14px; margin-top: 10px; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
        .text-right { text-align: right; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company">Smart Shopping Cart</div>
        <div class="company-info">Invoice Management System</div>
        <div class="invoice-details">
          <div class="invoice-number">${bill.number}</div>
          <div class="invoice-dates">Issued: ${bill.issuedAt}</div>
          <div class="invoice-dates">Due: ${bill.dueAt}</div>
        </div>
      </div>

      <div class="bill-to">
        <div class="bill-to-label">Bill To</div>
        <div class="bill-to-name">${bill.customer}</div>
        <div class="bill-to-email">${bill.email}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Price</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${bill.items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td class="text-right">${item.qty}</td>
              <td class="text-right">$${item.price.toFixed(2)}</td>
              <td class="text-right">$${(item.qty * item.price).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total-section">
        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>$${bill.subtotal.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Tax (10%):</span>
            <span>$${bill.tax.toFixed(2)}</span>
          </div>
          <div class="total-final">
            <span>Total:</span>
            <span>$${bill.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Thank you for your business!</p>
        <p>Status: <strong>${bill.status.toUpperCase()}</strong></p>
      </div>
    </body>
    </html>
  `;

  const element = document.createElement('a');
  const file = new Blob([htmlContent], { type: 'text/html' });
  element.href = URL.createObjectURL(file);
  element.download = `${bill.number}.html`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  toast.success('Invoice downloaded');
};

export default function BillsPage() {
  const { data: bills = [], isLoading: billsLoading } = useBills();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { addBill, updateBill, deleteBill } = useBillMutations();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Bill>(empty());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startNew = () => { setDraft(empty()); setOpen(true); };
  const startEdit = (b: Bill) => { setDraft(b); setOpen(true); };
  const save = async () => {
    if (!draft.customer || draft.items.length === 0) {
      toast.error("Customer and at least one item are required");
      return;
    }
    const final = computeTotals(draft);
    setIsSubmitting(true);
    try {
      if (draft.id) {
        await updateBill.mutateAsync({ id: draft.id, bill: final });
      } else {
        await addBill.mutateAsync({ ...final, id: "" });
      }
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (billsLoading || productsLoading) {
    return (
      <AdminLayout title="Bills & Invoices" subtitle="Manage bills and invoices.">
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Bills & Invoices"
      subtitle="Manage bills and invoices."
      actions={
        <Button onClick={startNew} className="bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-95">
          <Plus className="mr-2 h-4 w-4" /> New bill
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {bills.map((bill) => (
          <article
            key={bill.id}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant"
          >
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-primary opacity-10 blur-2xl" />

            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Invoice</p>
                <p className="font-mono text-sm font-bold mt-1">{bill.number}</p>
              </div>
              {statusBadge(bill.status)}
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Customer</p>
                <p className="font-medium text-sm mt-1">{bill.customer}</p>
                <p className="text-xs text-muted-foreground">{bill.email}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Items</p>
                <div className="space-y-1 mt-1">
                  {bill.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="line-clamp-1">{item.name}</span>
                      <span className="text-muted-foreground">×{item.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4 mb-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="font-display text-2xl font-bold text-primary mt-1">${bill.total.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => downloadPDF(bill)}
                className="flex-1 hover:text-primary"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startEdit(bill)}
                className="hover:text-primary"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteBill.mutate(bill.id)}
                disabled={deleteBill.isPending}
                className="hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </article>
        ))}
      </div>

      {bills.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">No bills available. Create one to get started.</p>
        </div>
      )}

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
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={save} disabled={isSubmitting} className="bg-gradient-primary text-primary-foreground">
              {isSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
