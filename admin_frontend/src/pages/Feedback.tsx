import { useState } from "react";
import { MessageSquare, Loader } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useFeedbackSummary, useProductFeedback } from "@/store/useStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

function FeedbackDetails({ productId, productName, onClose }: { productId: string; productName: string; onClose: () => void }) {
  const { data: feedbacks = [], isLoading } = useProductFeedback(productId);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Feedback for {productName}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : feedbacks.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">No feedback found for this product.</p>
        ) : (
          <div className="space-y-4 mt-4">
            {feedbacks.map((f: any) => (
              <div key={f.feedback_id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-sm">Cart ID: {f.cart_id || 'Anonymous'}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(f.created_at).toLocaleDateString()} {new Date(f.created_at).toLocaleTimeString()}
                  </div>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{f.message}</p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function FeedbackPage() {
  const { data: summary = [], isLoading, error } = useFeedbackSummary();
  const [selectedProduct, setSelectedProduct] = useState<{id: string, name: string} | null>(null);

  return (
    <AdminLayout
      title="Customer Feedback"
      subtitle="View what customers are saying about your products."
    >
      {error && (
        <div className="mb-4 rounded-lg bg-destructive/15 p-4 text-destructive">
          Failed to load feedback summary: {error.message}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : summary.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-card">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-display text-lg font-semibold">No feedback yet</h3>
          <p className="text-muted-foreground mt-2">When customers leave feedback, it will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {summary.map((item: any) => (
            <div 
              key={item.product_id}
              onClick={() => setSelectedProduct({ id: item.product_id.toString(), name: item.name })}
              className="group cursor-pointer rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant hover:border-primary/30"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary font-bold text-lg mb-4">
                  {item.name.charAt(0)}
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {item.feedback_count} {item.feedback_count === 1 ? 'review' : 'reviews'}
                </Badge>
              </div>
              <h3 className="font-display font-semibold text-lg line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                {item.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                Click to view detailed feedback messages from customers.
              </p>
            </div>
          ))}
        </div>
      )}

      {selectedProduct && (
        <FeedbackDetails 
          productId={selectedProduct.id} 
          productName={selectedProduct.name}
          onClose={() => setSelectedProduct(null)} 
        />
      )}
    </AdminLayout>
  );
}
