"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/prisma";

// --- 1. GET CART ---
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
                availableStock: true,
                sellerType: true, // Useful to know if it's Farmer/Agent
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return { success: true, data: cart };
  } catch (error) {
    console.error("Get Cart Error:", error);
    return { success: false, error: "Failed to fetch cart" };
  }
}

// --- 2. ADD TO CART ---
export async function addToCart(productId, quantity) {
  const user = await currentUser();
  if (!user) return { success: false, error: "Please log in to add items." };

  try {
    // 1. Check Product Validity & Stock
    const product = await db.productListing.findUnique({
      where: { id: productId },
      select: { availableStock: true, id: true }
    });

    if (!product) return { success: false, error: "Product not found." };
    if (product.availableStock < quantity) {
      return { success: false, error: `Only ${product.availableStock} available.` };
    }

    // 2. Get or Create Cart
    let cart = await db.cart.findUnique({ where: { userId: user.id } });
    if (!cart) {
      cart = await db.cart.create({ data: { userId: user.id } });
    }

    // 3. Upsert Cart Item (Update if exists, Create if not)
    // We check if item exists to increment quantity or set new
    const existingItem = await db.cartItem.findFirst({
        where: { cartId: cart.id, productId: productId }
    });

    if (existingItem) {
        // Check if new total exceeds stock
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.availableStock) {
            return { success: false, error: "Cannot add more than available stock." };
        }

        await db.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: newQuantity }
        });
    } else {
        await db.cartItem.create({
            data: {
                cartId: cart.id,
                productId: productId,
                quantity: quantity
            }
        });
    }

    revalidatePath('/cart'); 
    return { success: true, message: "Added to cart" };

  } catch (error) {
    console.error("Add to Cart Error:", error);
    return { success: false, error: "Failed to add item." };
  }
}

// --- 3. REMOVE FROM CART ---
export async function removeFromCart(cartItemId) {
  try {
    await db.cartItem.delete({ where: { id: cartItemId } });
    revalidatePath('/cart');
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to remove item." };
  }
}

// --- 4. UPDATE QUANTITY (In Cart Page) ---
export async function updateCartItemQuantity(cartItemId, newQuantity) {
    try {
        if (newQuantity <= 0) {
            return await removeFromCart(cartItemId);
        }

        // Check stock before updating
        const item = await db.cartItem.findUnique({
            where: { id: cartItemId },
            include: { product: { select: { availableStock: true } } }
        });

        if (!item) return { success: false, error: "Item not found" };

        if (newQuantity > item.product.availableStock) {
            return { success: false, error: `Max stock is ${item.product.availableStock}` };
        }

        await db.cartItem.update({
            where: { id: cartItemId },
            data: { quantity: newQuantity }
        });

        revalidatePath('/cart');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Update failed" };
    }
}