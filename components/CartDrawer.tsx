"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/utils";
import { createCustomerOrder } from "@/app/actions/orders";
import {
  buildCartOrderMessage,
  buildWhatsAppUrl,
  DEFAULT_WHATSAPP_NUMBER,
} from "@/lib/whatsapp";

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, clearCart, subtotal, totalItems } =
    useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [orderSentRef, setOrderSentRef] = useState<string | null>(null);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeCart();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeCart]);

  // Reset error/success states when drawer is closed/opened
  useEffect(() => {
    if (!isOpen) {
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendOrder = async () => {
    if (items.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    // 1. Create order record in Supabase
    const result = await createCustomerOrder(items, subtotal);

    if (!result.success || !result.orderRef) {
      setErrorMsg(result.error || "Failed to create order. Please try again.");
      setIsSubmitting(false);
      return; // Do NOT open WhatsApp if order creation failed
    }

    // 2. Build WhatsApp deep link message
    const message = buildCartOrderMessage(items, subtotal, result.orderRef);
    const whatsappUrl = buildWhatsAppUrl(DEFAULT_WHATSAPP_NUMBER, message);

    // 3. Clear cart and set confirmation state
    const orderRef = result.orderRef;
    clearCart();
    setOrderSentRef(orderRef);
    setIsSubmitting(false);

    // 4. Open WhatsApp
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => {
          setOrderSentRef(null);
          closeCart();
        }}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div
        className="relative z-10 flex h-full w-full max-w-md flex-col bg-[#FAF8F5] text-[#24211E] shadow-2xl transition-transform animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-stone-200/80 px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 id="cart-drawer-title" className="text-lg font-bold text-stone-900">
              Your Cart
            </h2>
            {totalItems > 0 && (
              <span className="rounded-full bg-[#C1662F] px-2.5 py-0.5 text-xs font-semibold text-white">
                {totalItems} {totalItems === 1 ? "item" : "items"}
              </span>
            )}
          </div>

          <button
            onClick={() => {
              setOrderSentRef(null);
              closeCart();
            }}
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200/60 text-stone-600 hover:bg-stone-200 hover:text-stone-900 transition-colors"
            aria-label="Close cart"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="mx-5 mt-4 rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-700">
            <div className="font-semibold mb-0.5">Order Error</div>
            {errorMsg}
          </div>
        )}

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {orderSentRef ? (
            /* Confirmation State */
            <div className="flex h-full flex-col items-center justify-center text-center py-10">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-3xl">
                ✓
              </div>
              <span className="rounded-full bg-stone-200/80 px-3 py-1 text-xs font-bold text-stone-800 mb-2">
                Ref: {orderSentRef}
              </span>
              <h3 className="text-lg font-bold text-stone-900 mb-2">
                Order Request Sent!
              </h3>
              <p className="text-xs text-stone-600 max-w-xs leading-relaxed mb-6">
                Your order request has been sent! We&apos;ll confirm details with you on WhatsApp.
              </p>
              <button
                type="button"
                onClick={() => {
                  setOrderSentRef(null);
                  closeCart();
                }}
                className="rounded-xl bg-stone-900 px-6 py-2.5 text-xs font-semibold text-white hover:bg-stone-800 transition-colors"
              >
                Continue Browsing
              </button>
            </div>
          ) : items.length === 0 ? (
            /* Empty State */
            <div className="flex h-full flex-col items-center justify-center text-center py-12">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-200/50 text-3xl">
                🛒
              </div>
              <h3 className="text-base font-semibold text-stone-800">
                Your cart is empty
              </h3>
              <p className="mt-1.5 text-xs text-stone-500 max-w-xs leading-relaxed">
                Explore our collection of plants and add some green to your space!
              </p>
              <button
                type="button"
                onClick={closeCart}
                className="mt-6 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-stone-800 transition-colors shadow-xs"
              >
                Browse Plants
              </button>
            </div>
          ) : (
            /* Item List */
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.plant_id}
                  className="flex gap-3.5 rounded-2xl bg-white p-3 border border-stone-200/60 shadow-2xs"
                >
                  {/* Thumbnail */}
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100 border border-stone-100">
                    {item.photo ? (
                      <img
                        src={item.photo}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-stone-300">
                        🌿
                      </div>
                    )}
                  </div>

                  {/* Info & Controls */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-stone-900 line-clamp-1">
                        {item.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeItem(item.plant_id)}
                        className="text-stone-400 hover:text-red-600 transition-colors p-0.5"
                        aria-label={`Remove ${item.name}`}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.8}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2">
                      {/* Quantity Stepper */}
                      <div className="flex items-center rounded-lg bg-stone-100 p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.plant_id, item.qty - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded bg-white text-stone-700 hover:bg-stone-200 text-xs font-bold transition-colors"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-stone-900">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.plant_id, item.qty + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded bg-white text-stone-700 hover:bg-stone-200 text-xs font-bold transition-colors"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      {/* Total price for item */}
                      <span className="text-sm font-bold text-stone-900">
                        {formatINR(item.price * item.qty)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {!orderSentRef && items.length > 0 && (
          <div className="border-t border-stone-200/80 bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-stone-600">Subtotal</span>
              <span className="text-lg font-bold text-stone-900">
                {formatINR(subtotal)}
              </span>
            </div>

            <p className="mb-4 text-[11px] text-stone-500 leading-normal">
              Delivery calculated separately — final price confirmed on WhatsApp
            </p>

            <button
              type="button"
              onClick={handleSendOrder}
              disabled={isSubmitting}
              className="w-full rounded-xl bg-[#C1662F] py-3.5 px-4 text-center text-sm font-semibold text-white shadow-xs hover:bg-[#a85524] active:bg-[#92481e] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span>Creating order...</span>
              ) : (
                <>
                  <span>Send Order via WhatsApp</span>
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
