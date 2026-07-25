"use client";

import { useState, useEffect, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/utils";
import { createCustomerOrder } from "@/app/actions/orders";
import {
  buildCartOrderMessage,
  buildWhatsAppUrl,
  DEFAULT_WHATSAPP_NUMBER,
} from "@/lib/whatsapp";
import { ShoppingBag, X, Trash2, MessageCircle } from "lucide-react";

interface CartDrawerProps {
  whatsappNumber?: string;
}

function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  if (!digits) return "";
  if (digits.startsWith("91") && digits.length === 12) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return `+${digits}`;
}

export function CartDrawer({ whatsappNumber }: CartDrawerProps) {
  const { items, isOpen, closeCart, updateQuantity, removeItem, clearCart, subtotal, totalItems } =
    useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [orderSentRef, setOrderSentRef] = useState<string | null>(null);
  const [lastOrderMessage, setLastOrderMessage] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Synchronous ref guard to prevent double-tap race conditions
  const submittingRef = useRef(false);

  const targetNumber = whatsappNumber || DEFAULT_WHATSAPP_NUMBER;

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
      submittingRef.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendOrder = async () => {
    // Double-check synchronous guard to stop rapid double-taps immediately
    if (items.length === 0 || submittingRef.current || isSubmitting) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Create order record in Supabase
      const result = await createCustomerOrder(items, subtotal);

      if (!result.success || !result.orderRef) {
        setErrorMsg(result.error || "Failed to create order. Please try again.");
        submittingRef.current = false;
        setIsSubmitting(false);
        return; // Do NOT open WhatsApp if order creation failed
      }

      // 2. Build WhatsApp deep link message using number from settings
      const message = buildCartOrderMessage(items, subtotal, result.orderRef);
      const whatsappUrl = buildWhatsAppUrl(targetNumber, message);

      // 3. Clear cart and set confirmation state
      const orderRef = result.orderRef;
      setLastOrderMessage(message);
      clearCart();
      setOrderSentRef(orderRef);

      // 4. Open WhatsApp
      window.open(whatsappUrl, "_blank");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleCopyMessage = () => {
    if (!lastOrderMessage) return;
    navigator.clipboard.writeText(lastOrderMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => {
          setOrderSentRef(null);
          setLastOrderMessage("");
          closeCart();
        }}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        className="relative z-10 w-full sm:w-[440px] h-full bg-white dark:bg-stone-900 shadow-2xl flex flex-col transition-transform animate-in slide-in-from-right duration-300 border-l border-transparent dark:border-stone-800 text-stone-900 dark:text-stone-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-3">
            <h2 id="cart-drawer-title" className="font-heading font-bold text-xl text-stone-900 dark:text-stone-100">
              Your Bag
            </h2>
            <span className="bg-botanical-100 dark:bg-stone-800 text-botanical-800 dark:text-botanical-100 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </span>
          </div>

          <button
            onClick={() => {
              setOrderSentRef(null);
              setLastOrderMessage("");
              closeCart();
            }}
            type="button"
            className="p-2 rounded-full text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close bag"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="mx-6 mt-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 p-3.5 text-xs text-red-700 dark:text-red-300">
            <div className="font-semibold mb-0.5">Order Error</div>
            {errorMsg}
          </div>
        )}

        {/* Drawer Body */}
        <div className="flex-grow p-6 overflow-y-auto space-y-4">
          {orderSentRef ? (
            /* Confirmation State */
            <div className="flex flex-col items-center text-center py-4 space-y-4">
              <div className="flex flex-col items-center">
                <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-2xl font-bold">
                  ✓
                </div>
                <span className="rounded-full bg-stone-200/80 dark:bg-stone-800 px-3 py-1 text-xs font-bold text-stone-800 dark:text-stone-200 mb-1">
                  Order Ref: {orderSentRef}
                </span>
                <h3 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100 mb-1">
                  Order Recorded!
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs leading-relaxed">
                  Your order has been saved in our system.
                </p>
              </div>

              {/* Fallback Safety Container */}
              <div className="w-full rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 p-4 text-left space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300 mb-0.5">
                    <span>💬</span> Didn&apos;t open in WhatsApp?
                  </div>
                  <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-normal">
                    If WhatsApp didn&apos;t open automatically, tap below to copy your order message and send it manually.
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-white/90 dark:bg-stone-800 px-3 py-2 border border-stone-200/60 dark:border-stone-700 text-xs">
                  <span className="text-stone-500 dark:text-stone-400 font-medium">Send to:</span>
                  <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                    {formatPhoneDisplay(targetNumber)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="w-full rounded-xl bg-terracotta hover:bg-[#b04a25] text-white py-2.5 px-3 text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copied ? (
                    <>
                      <span>✓</span>
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <span>📋</span>
                      <span>Copy Order Message</span>
                    </>
                  )}
                </button>

                <a
                  href={buildWhatsAppUrl(targetNumber, lastOrderMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-[11px] font-semibold text-amber-800 dark:text-amber-400 hover:underline transition-all"
                >
                  Tap here to retry opening WhatsApp →
                </a>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOrderSentRef(null);
                  setLastOrderMessage("");
                  closeCart();
                }}
                className="w-full rounded-xl bg-botanical-800 dark:bg-botanical-600 hover:bg-botanical-900 dark:hover:bg-botanical-800 py-3 text-xs font-semibold text-white transition-colors min-h-[44px]"
              >
                Continue Browsing
              </button>
            </div>
          ) : items.length === 0 ? (
            /* Empty Cart State matching mockup */
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-20 h-20 rounded-full bg-botanical-50 dark:bg-stone-800 border border-botanical-100 dark:border-stone-700 flex items-center justify-center text-botanical-800 dark:text-botanical-100 mb-4 shadow-2xs">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100 mb-1">
                Your bag is currently empty
              </h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm max-w-[260px] mb-6 font-normal">
                Explore our collection of fresh nursery plants and add some warmth to your space!
              </p>
              <button
                type="button"
                onClick={closeCart}
                className="bg-botanical-800 dark:bg-botanical-600 hover:bg-botanical-900 dark:hover:bg-botanical-800 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all shadow-md min-h-[44px]"
              >
                Explore Plants
              </button>
            </div>
          ) : (
            /* Cart Item Rows matching mockup */
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.plant_id}
                  className="flex items-center justify-between p-3.5 bg-white dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 rounded-2xl shadow-2xs hover:border-stone-300 dark:hover:border-stone-600 transition-all"
                >
                  <div className="flex items-center gap-3.5 overflow-hidden">
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-stone-100 dark:bg-stone-800 border border-stone-100 dark:border-stone-700">
                      {item.photo ? (
                        <img
                          src={item.photo}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-stone-400">
                          🌿
                        </div>
                      )}
                    </div>

                    <div className="overflow-hidden">
                      <h4 className="font-heading font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                        {item.name}
                      </h4>
                      <span className="text-xs text-botanical-800 dark:text-botanical-100 font-semibold mt-0.5 block">
                        {formatINR(item.price)}
                      </span>
                      <div className="flex items-center gap-2 mt-2 border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 rounded-lg px-1.5 py-0.5 w-max">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.plant_id, item.qty - 1)}
                          className="w-5 h-5 flex items-center justify-center text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 font-bold text-xs"
                          aria-label="Decrease quantity"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-stone-800 dark:text-stone-100 w-4 text-center">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.plant_id, item.qty + 1)}
                          className="w-5 h-5 flex items-center justify-center text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 font-bold text-xs"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between h-16 pl-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => removeItem(item.plant_id)}
                      className="text-stone-300 dark:text-stone-600 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className="font-heading font-bold text-sm text-stone-900 dark:text-stone-100">
                      {formatINR(item.price * item.qty)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer matching mockup */}
        {!orderSentRef && items.length > 0 && (
          <div className="p-6 border-t border-stone-100 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/80">
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500 dark:text-stone-400 font-medium">Subtotal</span>
                <span className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100">
                  {formatINR(subtotal)}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 dark:text-stone-500 font-normal leading-tight">
                Delivery calculated separately — final price confirmed on WhatsApp.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSendOrder}
              disabled={isSubmitting}
              className="w-full bg-terracotta hover:bg-[#b04a25] text-white font-semibold py-3.5 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Sending Order...</span>
                </span>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5 fill-current" />
                  <span>Send Order via WhatsApp</span>
                </>
              )}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
