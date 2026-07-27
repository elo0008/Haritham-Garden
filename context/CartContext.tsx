"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { Plant, CartItem } from "@/lib/types";
import { getEffectivePrice } from "@/lib/types";
import { CartToast, type ToastInfo } from "@/components/CartToast";

interface CartContextType {
  items: CartItem[];
  addItem: (plant: Plant, qty: number) => void;
  updateQuantity: (plant_id: string, qty: number) => void;
  removeItem: (plant_id: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  toast: ToastInfo | null;
  dismissToast: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "haritham_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [toast, setToast] = useState<ToastInfo | null>(null);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  // Load cart from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load cart from storage", e);
    }
    setIsHydrated(true);
  }, []);

  // Save cart to localStorage when items change
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save cart to storage", e);
    }
  }, [items, isHydrated]);

  const addItem = (plant: Plant, qty: number) => {
    if (qty <= 0) return;

    const effectivePrice = getEffectivePrice(plant);
    const hasSale =
      plant.sale_price !== null &&
      plant.sale_price !== undefined &&
      plant.sale_price < plant.price;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.plant_id === plant.id);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          price: effectivePrice, // refresh in case sale status changed
          original_price: hasSale ? plant.price : undefined,
          qty: updated[existingIndex].qty + qty,
        };
        return updated;
      }
      return [
        ...prevItems,
        {
          plant_id: plant.id,
          name: plant.name,
          price: effectivePrice,
          original_price: hasSale ? plant.price : undefined,
          qty,
          photo: plant.photos && plant.photos.length > 0 ? plant.photos[0] : undefined,
          slug: plant.slug,
        },
      ];
    });

    // Fire or update Toast notification
    setToast((prev) => {
      if (prev && prev.plantId === plant.id) {
        return {
          id: Date.now().toString(),
          plantId: plant.id,
          plantName: plant.name,
          qty: prev.qty + qty,
        };
      }
      return {
        id: Date.now().toString(),
        plantId: plant.id,
        plantName: plant.name,
        qty: qty,
      };
    });
  };

  const updateQuantity = (plant_id: string, qty: number) => {
    if (qty <= 0) {
      removeItem(plant_id);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) => (item.plant_id === plant_id ? { ...item, qty } : item))
    );
  };

  const removeItem = (plant_id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.plant_id !== plant_id));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen((prev) => !prev);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        totalItems,
        subtotal,
        isOpen,
        openCart,
        closeCart,
        toggleCart,
        toast,
        dismissToast,
      }}
    >
      {children}
      <CartToast toast={toast} onDismiss={dismissToast} />
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
