import { FormEvent, useMemo, useState } from "react";
import { Loader, Users } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useCrowd, useCrowdMutations, useMapNodes } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CrowdPage() {
  const [nodeId, setNodeId] = useState("");
  const [cartCount, setCartCount] = useState("0");
  const { data: crowd = [], isLoading: crowdLoading } = useCrowd();
  const { data: nodes = [], isLoading: nodesLoading } = useMapNodes();
  const { updateCrowd } = useCrowdMutations();

  const nodeOptions = useMemo(
    () => (Array.isArray(nodes) ? nodes.map((node: any) => String(node.node_id)) : []),
    [nodes]
  );

  const crowdRows = useMemo(() => {
    if (!Array.isArray(crowd)) return [];
    return [...crowd]
      .map((entry: any) => ({
        nodeId: String(entry.node_id),
        crowdLevel: Number(entry.crowd_level ?? 0),
      }))
      .sort((a, b) => a.nodeId.localeCompare(b.nodeId, undefined, { numeric: true, sensitivity: "base" }));
  }, [crowd]);

  const handleCrowdSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedNodeId = nodeId.trim();
    const parsedCrowdLevel = Number(cartCount);

    if (!trimmedNodeId) {
      return;
    }

    if (!Number.isInteger(parsedCrowdLevel) || parsedCrowdLevel < 0) {
      return;
    }

    updateCrowd.mutate(
      { nodeId: trimmedNodeId, crowdLevel: parsedCrowdLevel },
      {
        onSuccess: () => {
          setCartCount(String(parsedCrowdLevel));
        },
      }
    );
  };

  if (crowdLoading || nodesLoading) {
    return (
      <AdminLayout
        title="Crowd Control"
        subtitle="Loading node crowd data..."
      >
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Crowd Control"
      subtitle="Update node values and cart counts for the demo from one dedicated admin page."
    >
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Manual Update</p>
              <h2 className="mt-2 text-xl font-semibold">Set crowd for a node</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter the node value and the number of carts currently present there.
              </p>
            </div>
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </div>

          <form className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={handleCrowdSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium" htmlFor="node-id">
                Node value
              </label>
              <Input
                id="node-id"
                list="crowd-node-options"
                placeholder="Ex: N12"
                value={nodeId}
                onChange={(event) => setNodeId(event.target.value)}
              />
              <datalist id="crowd-node-options">
                {nodeOptions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium" htmlFor="cart-count">
                Number of carts
              </label>
              <Input
                id="cart-count"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={cartCount}
                onChange={(event) => setCartCount(event.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button className="w-full md:w-auto" type="submit" disabled={updateCrowd.isPending || !nodeId.trim()}>
                {updateCrowd.isPending ? "Saving..." : "Save crowd"}
              </Button>
            </div>
          </form>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Current Crowd Data</p>
          <div className="mt-4 space-y-3">
            {crowdRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No crowd data added yet.</p>
            ) : (
              crowdRows.map((entry) => (
                <button
                  key={entry.nodeId}
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl border border-border px-3 py-2 text-left transition-colors hover:bg-secondary/40"
                  onClick={() => {
                    setNodeId(entry.nodeId);
                    setCartCount(String(entry.crowdLevel));
                  }}
                >
                  <span>
                    <span className="block text-sm font-semibold">{entry.nodeId}</span>
                    <span className="block text-xs text-muted-foreground">Tap to load into form</span>
                  </span>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                    {entry.crowdLevel} carts
                  </span>
                </button>
              ))
            )}
          </div>
        </article>
      </section>
    </AdminLayout>
  );
}
