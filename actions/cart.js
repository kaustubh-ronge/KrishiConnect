"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";

// 1. GET CART
export async function getCart() {
  const user = await currentUser();
  if (!user) return { success: false, data: null };

  try {
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
                unit: true,
                images: true,
                availableStock: true, // Needed for stock validation
                sellerType: true,
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
}

/**
 * 2. ADD TO CART
 */
export async function addToCart(productId, quantity) {
  const user = await currentUser();
  if (!user) return { success: false, error: "Please log in." };

  try {
    return await db.$transaction(async (tx) => {
      // Check Stock
      const product = await tx.productListing.findUnique({
        where: { id: productId },
        select: { availableStock: true, unit: true }
      });

      if (!product) throw new Error("Product not found.");
      if (product.availableStock < quantity) {
        throw new Error(`Only ${product.availableStock} ${product.unit} available.`);
      }

      // Get/Create Cart
      let cart = await tx.cart.findUnique({ where: { userId: user.id } });
      if (!cart) {
        cart = await tx.cart.create({ data: { userId: user.id } });
      }

      // Upsert Item
      const existingItem = await tx.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: productId
          }
        }
      });

      if (existingItem) {
        if ((existingItem.quantity + quantity) > product.availableStock) {
             throw new Error("Cannot add more than available stock.");
        }
        await tx.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity }
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: cart.id,
            productId: productId,
            quantity: quantity
          }
        });
      }

      // Deduct Stock
      await tx.productListing.update({
        where: { id: productId },
        data: { availableStock: product.availableStock - quantity }
      });

      return { success: true };
    });
  } catch (error) {
    console.error("Add Cart Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * 3. REMOVE FROM CART
 */
export async function removeFromCart(cartItemId) {
  const user = await currentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    return await db.$transaction(async (tx) => {
      const item = await tx.cartItem.findUnique({
        where: { id: cartItemId },
        include: { product: true }
      });

      if (!item) throw new Error("Item not found");

      // Restore Stock
      await tx.productListing.update({
        where: { id: item.productId },
        data: { availableStock: { increment: item.quantity } }
      });

      // Delete Item
      await tx.cartItem.delete({
        where: { id: cartItemId }
      });

      return { success: true };
    });
  } catch (error) {
    console.error("Remove Cart Error:", error);
    return { success: false, error: "Failed to remove item." };
  }
}

/**
 * 4. UPDATE CART ITEM QUANTITY (The Missing Function)
 */
export async function updateCartItemQuantity(cartItemId, newQuantity) {
    const user = await currentUser();
    if (!user) return { success: false, error: "Not logged in" };

    try {
        return await db.$transaction(async (tx) => {
            const item = await tx.cartItem.findUnique({
                where: { id: cartItemId },
                include: { product: true }
            });

            if (!item) throw new Error("Item not found");

            const difference = newQuantity - item.quantity;

            // If increasing quantity, check if we have enough extra stock
            if (difference > 0) {
                 // Note: availableStock in DB is what is remaining *after* the item was added to cart.
                 // So we check against that remaining stock.
                 const currentProduct = await tx.productListing.findUnique({
                     where: { id: item.productId },
                     select: { availableStock: true }
                 });

                 if (currentProduct.availableStock < difference) {
                     throw new Error(`Not enough stock available.`);
                 }
            }

            // Update Stock (Decrement if buying more, Increment if buying less)
            await tx.productListing.update({
                where: { id: item.productId },
                data: { availableStock: { decrement: difference } } 
            });

            // Update Cart Item
            await tx.cartItem.update({
                where: { id: cartItemId },
                data: { quantity: newQuantity }
            });

            return { success: true };
        });
    } catch (error) {
        console.error("Update Qty Error:", error);
        return { success: false, error: error.message || "Failed to update quantity" };
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
    const cart = await db.cart.findUnique({ where: { userId: user.id } });
    if (!cart) return { success: true };

    await db.cartItem.deleteMany({ where: { cartId: cart.id } });
    return { success: true };
  } catch (err) {
    console.error("Clear Cart Error:", err);
    return { success: false, error: "Failed to clear cart" };
  }
}