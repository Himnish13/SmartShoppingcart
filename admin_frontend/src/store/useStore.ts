import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Product, Offer, Cart, Bill, CategoryOption } from "@/data/mock";
import { toast } from "sonner";

// Query keys
export const queryKeys = {
  products: ["products"],
  categories: ["categories"],
  offers: ["offers"],
  carts: ["carts"],
  cartDevices: ["cart-devices"],
  crowd: ["crowd"],
  mapNodes: ["map-nodes"],
  bills: ["bills"],
  feedbackSummary: ["feedback", "summary"],
  productFeedback: (productId: string) => ["feedback", "product", productId],
};

// Hooks for Products
export const useProducts = () => {
  return useQuery({
    queryKey: queryKeys.products,
    queryFn: () => api.getAllProducts(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    gcTime: 1000 * 60 * 10, // 10 minutes cache
  });
};

export const useCategories = () => {
  return useQuery<CategoryOption[]>({
    queryKey: queryKeys.categories,
    queryFn: () => api.getCategories(),
    staleTime: 1000 * 60 * 10,
    retry: 2,
    gcTime: 1000 * 60 * 10,
  });
};

// Hooks for Offers
export const useOffers = () => {
  return useQuery({
    queryKey: queryKeys.offers,
    queryFn: () => api.getOffers(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    gcTime: 1000 * 60 * 10,
  });
};

// Hooks for Carts
export const useCarts = () => {
  return useQuery({
    queryKey: queryKeys.carts,
    queryFn: () => api.getCarts(),
    staleTime: 1000 * 60 * 1, // 1 minute
    retry: 2,
    gcTime: 1000 * 60 * 5,
  });
};

export const useCartDevices = () => {
  return useQuery({
    queryKey: queryKeys.cartDevices,
    queryFn: () => api.getCartDevices(),
    staleTime: 1000 * 30,
    retry: 2,
    gcTime: 1000 * 60 * 5,
  });
};

export const useCrowd = () => {
  return useQuery({
    queryKey: queryKeys.crowd,
    queryFn: () => api.getCrowd(),
    staleTime: 1000 * 15,
    retry: 2,
    gcTime: 1000 * 60 * 5,
  });
};

export const useMapNodes = () => {
  return useQuery({
    queryKey: queryKeys.mapNodes,
    queryFn: () => api.getMapNodes(),
    staleTime: 1000 * 60 * 5,
    retry: 2,
    gcTime: 1000 * 60 * 10,
  });
};

export const useCartMutations = () => {
  const queryClient = useQueryClient();

  const startCartMutation = useMutation({
    mutationFn: ({ cartId, userId }: { cartId: string; userId?: string }) =>
      api.startCartSession(cartId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.carts });
      queryClient.invalidateQueries({ queryKey: queryKeys.cartDevices });
      toast.success("Cart device activated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to activate cart");
    },
  });

  const stopCartMutation = useMutation({
    mutationFn: (cartId: string) => api.stopCartSession(cartId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.carts });
      queryClient.invalidateQueries({ queryKey: queryKeys.cartDevices });
      toast.success("Cart device released");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to release cart");
    },
  });

  return {
    startCart: startCartMutation,
    stopCart: stopCartMutation,
  };
};

export const useCrowdMutations = () => {
  const queryClient = useQueryClient();

  const updateCrowdMutation = useMutation({
    mutationFn: ({ nodeId, crowdLevel }: { nodeId: string; crowdLevel: number }) =>
      api.updateCrowd(nodeId, crowdLevel),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.crowd });
      toast.success(`Updated crowd for node ${variables.nodeId}`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update crowd data");
    },
  });

  return {
    updateCrowd: updateCrowdMutation,
  };
};

// Hooks for Bills
export const useBills = () => {
  return useQuery({
    queryKey: queryKeys.bills,
    queryFn: () => api.getBills(),
    staleTime: 1000 * 60 * 1, // 1 minute
    retry: 2,
    gcTime: 1000 * 60 * 5,
  });
};

// Hooks for Analytics
export const useRevenueTrend = () => {
  return useQuery({
    queryKey: ["analytics", "revenue-trend"],
    queryFn: () => api.getRevenueTrend(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    gcTime: 1000 * 60 * 10,
  });
};

export const useCategoryShare = () => {
  return useQuery({
    queryKey: ["analytics", "category-share"],
    queryFn: () => api.getCategoryShare(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    gcTime: 1000 * 60 * 10,
  });
};

export const useOrdersCustomers = () => {
  return useQuery({
    queryKey: ["analytics", "orders-customers"],
    queryFn: () => api.getOrdersCustomers(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    gcTime: 1000 * 60 * 10,
  });
};

// Hooks for Feedback
export const useFeedbackSummary = () => {
  return useQuery({
    queryKey: queryKeys.feedbackSummary,
    queryFn: () => api.getFeedbackSummary(),
    staleTime: 0,
    retry: 2,
    gcTime: 1000 * 60 * 5,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
};

export const useProductFeedback = (productId: string) => {
  return useQuery({
    queryKey: queryKeys.productFeedback(productId),
    queryFn: () => api.getProductFeedback(productId),
    enabled: !!productId,
    staleTime: 0,
    retry: 2,
    gcTime: 1000 * 60 * 5,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
};

// Hooks for Bill Mutations
export const useBillMutations = () => {
  const queryClient = useQueryClient();

  const addBillMutation = useMutation({
    mutationFn: (bill: Omit<Bill, "id">) => api.createBill(bill),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bills });
      toast.success("Bill created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create bill");
    },
  });

  const updateBillMutation = useMutation({
    mutationFn: ({ id, bill }: { id: string; bill: Partial<Bill> }) =>
      api.updateBill(id, bill),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bills });
      toast.success("Bill updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update bill");
    },
  });

  const deleteBillMutation = useMutation({
    mutationFn: (id: string) => api.deleteBill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bills });
      toast.success("Bill deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete bill");
    },
  });

  return {
    addBill: addBillMutation,
    updateBill: updateBillMutation,
    deleteBill: deleteBillMutation,
  };
};

// Hooks for Products
export const useProductMutations = () => {
  const queryClient = useQueryClient();

  const addProductMutation = useMutation({
    mutationFn: (product: Omit<Product, "id">) => api.addProduct(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      toast.success("Product added successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add product");
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, product }: { id: string; product: Partial<Product> }) =>
      api.updateProduct(id, product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      toast.success("Product updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update product");
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => api.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      toast.success("Product deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete product");
    },
  });

  return {
    addProduct: addProductMutation,
    updateProduct: updateProductMutation,
    deleteProduct: deleteProductMutation,
  };
};

// Hooks for Offers
export const useOfferMutations = () => {
  const queryClient = useQueryClient();

  const addOfferMutation = useMutation({
    mutationFn: (offer: Omit<Offer, "id">) => api.addOffer(offer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.offers });
      toast.success("Offer added successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add offer");
    },
  });

  const updateOfferMutation = useMutation({
    mutationFn: ({ productId, offer }: { productId: string; offer: Partial<Offer> }) =>
      api.updateOffer(productId, offer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.offers });
      toast.success("Offer updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update offer");
    },
  });

  const deleteOfferMutation = useMutation({
    mutationFn: (productId: string) => api.deleteOffer(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.offers });
      toast.success("Offer deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete offer");
    },
  });

  return {
    addOffer: addOfferMutation,
    updateOffer: updateOfferMutation,
    deleteOffer: deleteOfferMutation,
  };
};

// For backward compatibility, export old-style store interface
import { useSyncExternalStore } from "react";
import { seedProducts, seedOffers, seedCarts, seedBills } from "@/data/mock";

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
