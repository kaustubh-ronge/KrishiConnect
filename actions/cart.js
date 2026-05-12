"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";
import { cache } from "react";

// 1. GET CART
export const getCart = cache(async () => {
  const user = await currentUser();
  if (!user) return { success: false, data: null };

  try {
    const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { role: true } });
    if (dbUser?.role === 'admin' || dbUser?.role === 'super_admin') {
        return { success: false, data: { items: [] }, error: "Admins cannot have a cart." };
    }

    const cart = await db.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                productName: true,
                pricePerUnit: true,
                deliveryCharge: true,
                deliveryChargeType: true,
                unit: true,
                images: true,
                availableStock: true,
                minOrderQuantity: true,
                sellerType: true,
                farmerId: true,
                agentId: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!cart) return { success: true, data: { items: [] } };
    return { success: true, data: cart };
  } catch (error) {
    console.error("Get Cart Error:", error);
    return { success: false, error: "Failed to fetch cart" };
  }
});

/**
 * 2. ADD TO CART
 */
export async function addToCart(productId, quantity) {
  const user = await currentUser();
  if (!user) return { success: false, error: "Please log in." };
  try {
    const product = await db.productListing.findUnique({
      where: { id: productId },
      select: { availableStock: true, unit: true, farmerId: true, agentId: true, minOrderQuantity: true, productName: true }
    });

    if (!product) return { success: false, error: "Product not found." };

    // ─── ADMIN CHECK ───
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: { farmerProfile: true, agentProfile: true }
    });

    if (dbUser?.role === 'admin' || dbUser?.role === 'super_admin') {
        return { success: false, error: "Admins are not permitted to purchase products." };
    }

    if (dbUser) {
      if (product.farmerId && dbUser.farmerProfile?.id === product.farmerId) {
        return { success: false, error: "You cannot purchase your own product." };
      }
      if (product.agentId && dbUser.agentProfile?.id === product.agentId) {
        return { success: false, error: "You cannot purchase your own product." };
      }
    }

    // 0. Input Validation
    if (isNaN(quantity) || quantity <= 0) {
        return { success: false, error: "Invalid quantity. Please enter a positive number." };
    }

    // Min Quantity Check
    if (quantity < (product.minOrderQuantity || 1)) {
      return { success: false, error: `${product.productName} requires a minimum order of ${product.minOrderQuantity || 1} ${product.unit}.` };
    }

    // 1. Atomic Cart Retrieval/Creation
    const cart = await db.cart.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id }
    });

    // 2. Check if item already exists to calculate cumulative quantity
    const existingItem = await db.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: productId
        }
      }
    });

    const currentQtyInCart = existingItem ? existingItem.quantity : 0;
    const totalPotentialQty = currentQtyInCart + quantity;

    if (product.availableStock < totalPotentialQty) {
      return { 
        success: false, 
        error: `Cannot add more. You already have ${currentQtyInCart} in cart. Max available is ${product.availableStock}.` 
      };
    }

    // 3. Atomic Item Mutation
    await db.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: productId
        }
      },
      update: {
        quantity: { increment: quantity }
      },
      create: {
        cartId: cart.id,
        productId: productId,
        quantity: quantity
      }
    });

    revalidatePath('/cart');
    return { success: true };
  } catch (error) {
    console.error("Add Cart Error:", error);
    return { success: false, error: "Failed to add to cart" };
  }
}

/**
 * 3. REMOVE FROM CART
 */
export async function removeFromCart(cartItemId) {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    const item = await db.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: { select: { userId: true } } }
    });

    const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { role: true } });
    if (dbUser?.role === 'admin' || dbUser?.role === 'super_admin') {
        return { success: false, error: "Unauthorized: Admins cannot have a cart." };
    }

    if (!item || item.cart.userId !== user.id) {
      return { success: false, error: "Item not found or unauthorized" };
    }

    await db.cartItem.delete({
      where: { id: cartItemId }
    });
    revalidatePath('/cart');
    return { success: true };
  } catch (error) {
    console.error("Remove Cart Error:", error);
    return { success: false, error: "Failed to remove item." };
  }
}

/**
 * 4. UPDATE CART ITEM QUANTITY
 */
export async function updateCartItemQuantity(cartItemId, newQuantity) {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    if (isNaN(newQuantity) || newQuantity <= 0) {
      return { success: false, error: "Quantity must be a positive number." };
    }
    const item = await db.cartItem.findUnique({
      where: { id: cartItemId },
      include: { 
        cart: { select: { userId: true } },
        product: true 
      }
    });

    const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { role: true } });
    if (dbUser?.role === 'admin' || dbUser?.role === 'super_admin') {
        return { success: false, error: "Unauthorized: Admins cannot have a cart." };
    }

    if (!item || item.cart.userId !== user.id) {
      return { success: false, error: "Item not found or unauthorized" };
    }

    // Check availability before updating
    if (item.product.availableStock < newQuantity) {
      return { success: false, error: `Only ${item.product.availableStock} available.` };
    }

    // Min Quantity Check
    if (newQuantity < (item.product.minOrderQuantity || 1)) {
        return { success: false, error: `Minimum order is ${item.product.minOrderQuantity || 1} ${item.product.unit}.` };
    }

    await db.cartItem.update({
      where: { id: cartItemId },
      data: { quantity: newQuantity }
    });

    revalidatePath('/cart');
    return { success: true };
  } catch (error) {
    console.error(`Update Qty Error:`, error);
    return { success: false, error: "Failed to update quantity" };
  }
}

/**
 * 5. CLEAR CART
 * Removes all items from the current user's cart without restoring stock (used after successful purchase)
 */
export async function clearCart() {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { role: true } });
    if (dbUser?.role === 'admin' || dbUser?.role === 'super_admin') {
        return { success: false, error: "Unauthorized" };
    }

    const cart = await db.cart.findUnique({ where: { userId: user.id } });
    if (!cart) return { success: true };

    await db.cartItem.deleteMany({ where: { cartId: cart.id } });
    return { success: true };
  } catch (err) {
    console.error("Clear Cart Error:", err);
    return { success: false, error: "Failed to clear cart" };
  }
}