import { useSyncExternalStore } from "react";
import { Bill, Cart, Offer, Product, seedBills, seedCarts, seedOffers, seedProducts } from "@/data/mock";

type State = {
  products: Product[];
  offers: Offer[];
  carts: Cart[];
  bills: Bill[];
};

let state: State = {
  products: seedProducts,
  offers: seedOffers,
  carts: seedCarts,
  bills: seedBills,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => state;

export const useStore = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

const id = (p: string) => `${p}_${Math.random().toString(36).slice(2, 8)}`;

export const actions = {
  // products
  upsertProduct(p: Product) {
    const exists = state.products.some((x) => x.id === p.id);
    state = {
      ...state,
      products: exists
        ? state.products.map((x) => (x.id === p.id ? p : x))
        : [{ ...p, id: p.id || id("p") }, ...state.products],
    };
    emit();
  },
  deleteProduct(id: string) {
    state = {
      ...state,
      products: state.products.filter((x) => x.id !== id),
      offers: state.offers.filter((o) => o.productId !== id),
    };
    emit();
  },
  // offers
  upsertOffer(o: Offer) {
    const exists = state.offers.some((x) => x.id === o.id);
    state = {
      ...state,
      offers: exists
        ? state.offers.map((x) => (x.id === o.id ? o : x))
        : [{ ...o, id: o.id || id("o") }, ...state.offers],
    };
    emit();
  },
  deleteOffer(id: string) {
    state = { ...state, offers: state.offers.filter((x) => x.id !== id) };
    emit();
  },
  // bills
  upsertBill(b: Bill) {
    const exists = state.bills.some((x) => x.id === b.id);
    state = {
      ...state,
      bills: exists
        ? state.bills.map((x) => (x.id === b.id ? b : x))
        : [{ ...b, id: b.id || id("b") }, ...state.bills],
    };
    emit();
  },
  deleteBill(id: string) {
    state = { ...state, bills: state.bills.filter((x) => x.id !== id) };
    emit();
  },
  newId: id,
};