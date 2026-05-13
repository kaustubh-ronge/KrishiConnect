import { create } from 'zustand';
import { getCart, addToCart, removeFromCart, updateCartItemQuantity } from '@/actions/cart';
import { toast } from 'sonner';

export const useCartStore = create((set, get) => ({
  cartCount: 0,
  cartItems: [], 
  isLoading: false,

  // 1. Fetch Cart
  fetchCart: async () => {
    // Only set loading if it's the initial fetch or we really need it
    if (get().cartItems.length === 0) set({ isLoading: true });
    
    try {
        const res = await getCart();
        if (res?.success && res.data) {
          const totalQty = res.data.items.reduce((sum, it) => sum + (it.quantity || 0), 0);
          set({ 
            cartCount: totalQty,
            cartItems: res.data.items 
          });
        } else {
            set({ cartCount: 0, cartItems: [] });
        }
    } catch (err) {
        console.error("Cart fetch error:", err);
    } finally {
        set({ isLoading: false });
    }
  },

  // 2. Add Item (Optimistic)
  addItem: async (productId, quantity, productDetails) => {
    const previousItems = [...get().cartItems];
    const previousCount = get().cartCount;

    // Optimistic Update
    set((state) => {
        const existingItem = state.cartItems.find(it => it.productId === productId);
        let newItems;
        if (existingItem) {
            newItems = state.cartItems.map(it => 
                it.productId === productId ? { ...it, quantity: it.quantity + quantity } : it
            );
        } else {
            // We might not have full cartItem details (like row ID) yet, 
            // but we can mock enough for the UI to render.
            newItems = [...state.cartItems, { 
                id: `temp-${Date.now()}`, 
                productId, 
                quantity, 
                product: productDetails || {} 
            }];
        }
        return {
            cartCount: state.cartCount + quantity,
            cartItems: newItems
        };
    });

    try {
      const res = await addToCart(productId, quantity);
      if (res.success) {
        toast.success("Added to Cart!");
        get().fetchCart(); // Sync with server for real IDs
        return true; 
      } else {
        set({ cartItems: previousItems, cartCount: previousCount });
        toast.error(res.error || "Failed to add to cart");
        return false;
      }
    } catch (err) {
      set({ cartItems: previousItems, cartCount: previousCount });
      toast.error(err.message || "An error occurred. Please try again.");
      return false;
    }
  },

  // 3. Remove Item (Optimistic)
  removeItem: async (cartItemId) => {
     const previousItems = [...get().cartItems];
     const itemToRemove = previousItems.find(it => it.id === cartItemId);
     if (!itemToRemove) return;

     const previousCount = get().cartCount;

     // Optimistic Update
     set({
         cartItems: previousItems.filter(it => it.id !== cartItemId),
         cartCount: Math.max(0, previousCount - itemToRemove.quantity)
     });

     try {
         const res = await removeFromCart(cartItemId);
         if (!res.success) {
            set({ cartItems: previousItems, cartCount: previousCount });
            toast.error("Failed to remove");
         }
         // Optional: get().fetchCart() to ensure sync
     } catch (err) {
         set({ cartItems: previousItems, cartCount: previousCount });
         toast.error(err.message || "An error occurred while removing the item.");
     }
  },

  // 4. Update Quantity (Optimistic & Faster)
  updateQuantity: async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return get().removeItem(cartItemId);

    const previousItems = [...get().cartItems];
    const itemToUpdate = previousItems.find(it => it.id === cartItemId);
    if (!itemToUpdate) return;

    const previousCount = get().cartCount;
    const diff = newQuantity - itemToUpdate.quantity;

    // Optimistic Update
    set({
        cartItems: previousItems.map(it => 
            it.id === cartItemId ? { ...it, quantity: newQuantity } : it
        ),
        cartCount: previousCount + diff
    });

    try {
        const res = await updateCartItemQuantity(cartItemId, newQuantity);
        if (!res.success) {
            set({ cartItems: previousItems, cartCount: previousCount });
            toast.error(res.error || "Failed to update quantity");
        }
        // Don't call fetchCart() immediately to avoid extra re-renders 
        // unless there's a reason to believe the optimistic state is wrong.
    } catch (err) {
        set({ cartItems: previousItems, cartCount: previousCount });
        toast.error(err.message || "An error occurred while updating quantity.");
    }
  },

  clearCart: () => set({ cartItems: [], cartCount: 0 }),

  isInCart: (productId) => {
    return (get().cartItems || []).some(item => item.productId === productId);
  }
}));