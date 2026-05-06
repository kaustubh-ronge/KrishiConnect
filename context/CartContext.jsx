"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { getCart } from "@/actions/cart";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0); // Preparing for wishlist

  // Fetch initial count on load
  const refreshCounts = async () => {
    const res = await getCart();
    if (res.success && res.data) {
        // Count distinct items (or you could sum quantities)
        setCartCount(res.data.items.length); 
    } else {
        setCartCount(0);
    }
  };

  useEffect(() => {
    refreshCounts();
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, wishlistCount, refreshCounts }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);