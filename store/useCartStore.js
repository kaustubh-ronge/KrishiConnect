import { create } from 'zustand';
import { getCart, addToCart, removeFromCart, updateCartItemQuantity } from '@/actions/cart';
import { toast } from 'sonner';

export const useCartStore = create((set, get) => ({
  cartCount: 0,
  cartItems: [], 
  isLoading: false,

  // 1. Fetch Cart
  fetchCart: async () => {
    set({ isLoading: true });
    try {
        const res = await getCart();
        if (res?.success && res.data) {
          const totalQty = res.data.items.reduce((sum, it) => sum + (it.quantity || 0), 0);
          set({ 
            cartCount: totalQty,
            cartItems: res.data.items // Store full items (including productId inside them)
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

  // 2. Add Item
  addItem: async (productId, quantity) => {
    // Quick optimistic update for the count so UI feels fast
    set((state) => ({ cartCount: state.cartCount + quantity }));

    try {
      const res = await addToCart(productId, quantity);
      
      if (res.success) {
        toast.success("Added to Cart!");
        // Refresh full state in background, don't await it
        get().fetchCart(); 
        return true; 
      } else {
        // Rollback optimistic update on failure
        set((state) => ({ cartCount: Math.max(0, state.cartCount - quantity) }));
        toast.error(res.error || "Failed to add to cart");
        return false;
      }
    } catch (err) {
      set((state) => ({ cartCount: Math.max(0, state.cartCount - quantity) }));
      toast.error("An error occurred");
      return false;
    }
  },

  // 3. Remove Item
  removeItem: async (cartItemId) => {
     // Note: This takes the CartItem ID (unique row ID), not Product ID
     const res = await removeFromCart(cartItemId);
     if (res.success) {
        toast.success("Item removed");
        get().fetchCart();
     } else {
        toast.error("Failed to remove");
     }
  },

  // 4. Update Quantity
  updateQuantity: async (cartItemId, newQuantity) => {
    const res = await updateCartItemQuantity(cartItemId, newQuantity);
    if (res.success) {
        // We don't necessarily need a toast for every qty change, just refresh data
        get().fetchCart();
    } else {
        toast.error(res.error || "Failed to update quantity");
    }
  },

  // Helper: Check if a product ID is already in the cart
  isInCart: (productId) => {
    const items = get().cartItems || [];
    // items from getCart are objects like { id, productId, quantity, ... }
    return items.some(item => item.productId === productId);
  }
}));