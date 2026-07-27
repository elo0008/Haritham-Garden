"use client";

import { useState, useEffect, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { formatINR } from "@/lib/utils";
import { createCustomerOrder, type CustomerDetailsInput } from "@/app/actions/orders";
import { saveLocalOrderUuid } from "@/lib/myOrdersStorage";
import {
  buildCartOrderMessage,
  buildWhatsAppUrl,
  DEFAULT_WHATSAPP_NUMBER,
} from "@/lib/whatsapp";
import { ShoppingBag, X, Trash2, MessageCircle, Truck, ArrowLeft, ChevronRight, RefreshCw, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  const [checkoutStep, setCheckoutStep] = useState<"cart" | "interstitial" | "form">("cart");

  // Form states
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custPincode, setCustPincode] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [orderSentRef, setOrderSentRef] = useState<string | null>(null);
  const [lastOrderMessage, setLastOrderMessage] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Synchronous ref guard to prevent double-tap race conditions
  const submittingRef = useRef(false);

  const targetNumber = whatsappNumber || DEFAULT_WHATSAPP_NUMBER;

  // Load customer details from localStorage on client mount/open
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("haritham_customer_details");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.name) setCustName(parsed.name);
        if (parsed.phone) setCustPhone(parsed.phone);
        if (parsed.address) setCustAddress(parsed.address);
        if (parsed.pincode) setCustPincode(parsed.pincode);
      } catch {
        // Ignore json parse error
      }
    } else {
      const sName = localStorage.getItem("haritham_cust_name") || sessionStorage.getItem("haritham_cust_name") || "";
      const sPhone = localStorage.getItem("haritham_cust_phone") || sessionStorage.getItem("haritham_cust_phone") || "";
      const sAddress = localStorage.getItem("haritham_cust_address") || sessionStorage.getItem("haritham_cust_address") || "";
      const sPincode = localStorage.getItem("haritham_cust_pincode") || sessionStorage.getItem("haritham_cust_pincode") || "";

      if (sName) setCustName(sName);
      if (sPhone) setCustPhone(sPhone);
      if (sAddress) setCustAddress(sAddress);
      if (sPincode) setCustPincode(sPincode);
    }
  }, [isOpen]);

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
      setCheckoutStep("cart");
    }
  }, [isOpen]);

  const hasSavedDetails = Boolean(
    custName.trim() || custPhone.trim() || custAddress.trim() || custPincode.trim()
  );

  // Clear saved details from localStorage
  const handleForgetDetails = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("haritham_customer_details");
      localStorage.removeItem("haritham_cust_name");
      localStorage.removeItem("haritham_cust_phone");
      localStorage.removeItem("haritham_cust_address");
      localStorage.removeItem("haritham_cust_pincode");
      sessionStorage.removeItem("haritham_cust_details_decided");
      sessionStorage.removeItem("haritham_cust_name");
      sessionStorage.removeItem("haritham_cust_phone");
      sessionStorage.removeItem("haritham_cust_address");
      sessionStorage.removeItem("haritham_cust_pincode");
    }
    setCustName("");
    setCustPhone("");
    setCustAddress("");
    setCustPincode("");
    setCheckoutStep("interstitial");
  };

  // Helper to execute order creation and open WhatsApp
  const executeOrder = async (details?: CustomerDetailsInput | null) => {
    if (items.length === 0 || submittingRef.current || isSubmitting) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Create order record in Supabase
      const result = await createCustomerOrder(items, subtotal, details || undefined);

      if (!result.success || !result.orderRef) {
        setErrorMsg(result.error || "Failed to create order. Please try again.");
        submittingRef.current = false;
        setIsSubmitting(false);
        setCheckoutStep("cart");
        return;
      }

      // 2. Build WhatsApp deep link message using number from settings
      const message = buildCartOrderMessage(items, subtotal, result.orderRef, details || undefined);
      const whatsappUrl = buildWhatsAppUrl(targetNumber, message);

      // 3. Save local order UUID for My Orders tracking, clear cart and set confirmation state
      const orderRef = result.orderRef;
      if (result.orderId) {
        saveLocalOrderUuid(result.orderId);
      }
      setLastOrderMessage(message);
      clearCart();
      setOrderSentRef(orderRef);
      setCheckoutStep("cart");

      // 4. Open WhatsApp
      window.open(whatsappUrl, "_blank");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
      setCheckoutStep("cart");
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  // Triggered when user clicks "Send Order via WhatsApp" in Cart step
  const handleInitiateOrder = () => {
    if (items.length === 0 || submittingRef.current || isSubmitting) return;

    // Show interstitial step for details view/edit or decision
    setCheckoutStep("interstitial");
  };

  // Handler for skipping details ("Send Without Details")
  const handleSkipDetails = () => {
    executeOrder(null);
  };

  // Handler for submitting details form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    const details: CustomerDetailsInput = {
      name: custName.trim() || null,
      phone: custPhone.trim() || null,
      address: custAddress.trim() || null,
      pincode: custPincode.trim() || null,
    };

    // Save to localStorage for persistence across visits
    const savedObj = {
      name: details.name || "",
      phone: details.phone || "",
      address: details.address || "",
      pincode: details.pincode || "",
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("haritham_customer_details", JSON.stringify(savedObj));
      if (details.name) localStorage.setItem("haritham_cust_name", details.name);
      if (details.phone) localStorage.setItem("haritham_cust_phone", details.phone);
      if (details.address) localStorage.setItem("haritham_cust_address", details.address);
      if (details.pincode) localStorage.setItem("haritham_cust_pincode", details.pincode);
    }

    executeOrder(details);
  };

  const handleCopyMessage = () => {
    if (!lastOrderMessage) return;
    navigator.clipboard.writeText(lastOrderMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs"
            onClick={() => {
              setOrderSentRef(null);
              setLastOrderMessage("");
              closeCart();
            }}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative z-10 w-full sm:w-[440px] h-full bg-white dark:bg-stone-900 shadow-2xl flex flex-col border-l border-transparent dark:border-stone-800 text-stone-900 dark:text-stone-100"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-drawer-title"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50">
              <div className="flex items-center gap-3">
                {checkoutStep !== "cart" && !orderSentRef && (
                  <button
                    type="button"
                    onClick={() => setCheckoutStep("cart")}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors mr-1"
                    title="Back to cart"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <h2 id="cart-drawer-title" className="font-heading font-bold text-xl text-stone-900 dark:text-stone-100">
                  {checkoutStep === "interstitial"
                    ? "Delivery Details"
                    : checkoutStep === "form"
                    ? "Delivery Info"
                    : "Your Bag"}
                </h2>
                {checkoutStep === "cart" && !orderSentRef && (
                  <span className="bg-botanical-100 dark:bg-stone-800 text-botanical-800 dark:text-botanical-100 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {totalItems} {totalItems === 1 ? "item" : "items"}
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  setOrderSentRef(null);
                  setLastOrderMessage("");
                  closeCart();
                }}
                type="button"
                className="p-2 rounded-full text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-90"
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
                      className="w-full rounded-xl bg-terracotta hover:bg-[#b04a25] active:scale-[0.98] text-white py-2.5 px-3 text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all"
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
                    className="w-full rounded-xl bg-botanical-800 dark:bg-botanical-600 hover:bg-botanical-900 dark:hover:bg-botanical-800 py-3 text-xs font-semibold text-white transition-colors min-h-[44px] active:scale-[0.98]"
                  >
                    Continue Browsing
                  </button>
                </div>
              ) : checkoutStep === "interstitial" ? (
                /* Interstitial Step: Has saved details preview OR initial choice screen */
                hasSavedDetails ? (
                  <div className="py-4 space-y-5 animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-center space-y-2">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300 mx-auto shadow-2xs">
                        <UserCheck className="w-7 h-7" />
                      </div>
                      <h3 className="font-heading font-bold text-lg text-stone-900 dark:text-stone-100">
                        Saved Delivery Details
                      </h3>
                      <p className="text-stone-500 dark:text-stone-400 text-xs max-w-xs mx-auto">
                        Your shipping details from your previous visit are pre-filled below.
                      </p>
                    </div>

                    {/* Saved details preview card */}
                    <div className="rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700 p-4 text-xs space-y-2.5 text-stone-800 dark:text-stone-200">
                      {custName && (
                        <div>
                          <span className="text-stone-400 font-medium block">Name:</span>
                          <span className="font-bold text-stone-900 dark:text-stone-100">{custName}</span>
                        </div>
                      )}
                      {custPhone && (
                        <div>
                          <span className="text-stone-400 font-medium block">Phone:</span>
                          <span className="font-semibold text-stone-900 dark:text-stone-100">{custPhone}</span>
                        </div>
                      )}
                      {custAddress && (
                        <div>
                          <span className="text-stone-400 font-medium block">Address:</span>
                          <span className="font-medium text-stone-900 dark:text-stone-100 whitespace-pre-wrap">{custAddress}</span>
                        </div>
                      )}
                      {custPincode && (
                        <div>
                          <span className="text-stone-400 font-medium block">Pincode:</span>
                          <span className="font-mono font-semibold text-stone-900 dark:text-stone-100">{custPincode}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          executeOrder({
                            name: custName.trim() || null,
                            phone: custPhone.trim() || null,
                            address: custAddress.trim() || null,
                            pincode: custPincode.trim() || null,
                          });
                        }}
                        disabled={isSubmitting}
                        className="w-full bg-terracotta hover:bg-[#b04a25] text-white font-semibold py-3.5 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.98] disabled:opacity-50"
                      >
                        <MessageCircle className="w-5 h-5 fill-current" />
                        <span>{isSubmitting ? "Sending..." : "Send Order via WhatsApp"}</span>
                      </button>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setCheckoutStep("form")}
                          className="flex-1 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-semibold py-2.5 px-4 rounded-xl text-xs transition-all min-h-[40px]"
                        >
                          Edit Details
                        </button>
                        <button
                          type="button"
                          onClick={handleForgetDetails}
                          className="flex-1 bg-stone-100 dark:bg-stone-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-semibold py-2.5 px-4 rounded-xl text-xs transition-all min-h-[40px]"
                        >
                          Forget My Details
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-botanical-50 dark:bg-stone-800 border border-botanical-100 dark:border-stone-700 flex items-center justify-center text-botanical-800 dark:text-botanical-100 mx-auto shadow-sm">
                        <Truck className="w-8 h-8" />
                      </div>
                      <h3 className="font-heading font-bold text-xl text-stone-900 dark:text-stone-100">
                        Add Delivery Details?
                      </h3>
                      <p className="text-stone-600 dark:text-stone-300 text-xs sm:text-sm max-w-xs mx-auto leading-relaxed">
                        Adding your delivery details helps us package and process your plant order faster.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-800 p-4 text-xs text-stone-600 dark:text-stone-400 space-y-1.5">
                      <div className="font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                        <span>⚡</span> Fast & Optional
                      </div>
                      <p className="leading-relaxed text-[11px]">
                        Payment is completed 100% on WhatsApp as usual. You can add your shipping address now or skip and send directly.
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setCheckoutStep("form")}
                        className="w-full bg-terracotta hover:bg-[#b04a25] text-white font-semibold py-3.5 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.98]"
                      >
                        <span>Add Details</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={handleSkipDetails}
                        disabled={isSubmitting}
                        className="w-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-semibold py-3.5 px-6 rounded-2xl transition-all min-h-[48px] active:scale-[0.98]"
                      >
                        {isSubmitting ? "Sending..." : "Send Without Details →"}
                      </button>
                    </div>
                  </div>
                )
              ) : checkoutStep === "form" ? (
                /* Customer Details Form */
                <form onSubmit={handleSubmitForm} className="space-y-4 animate-in fade-in duration-200">
                  <div className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-1">
                    Please provide your contact and shipping information. Saved details persist for your future visits.
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Full Name <span className="font-normal text-stone-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={custName}
                      onChange={(e) => setCustName(e.target.value)}
                      placeholder="e.g. Anish Kumar"
                      className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:border-botanical-600 focus:outline-none"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Phone Number <span className="font-normal text-stone-400">(optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:border-botanical-600 focus:outline-none"
                    />
                  </div>

                  {/* Delivery Address Textarea */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Delivery Address <span className="font-normal text-stone-400">(optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={custAddress}
                      onChange={(e) => setCustAddress(e.target.value)}
                      placeholder="e.g. House No. 42, Green Valley, MG Road, Thrissur, Kerala"
                      className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:border-botanical-600 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Pincode */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                      Pincode <span className="font-normal text-stone-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={custPincode}
                      onChange={(e) => setCustPincode(e.target.value)}
                      placeholder="e.g. 680001"
                      className="w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:border-botanical-600 focus:outline-none"
                    />
                  </div>

                  {/* Submit and Skip Buttons */}
                  <div className="pt-3 space-y-2.5">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-terracotta hover:bg-[#b04a25] text-white font-semibold py-3.5 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.98] disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span>Sending Order...</span>
                      ) : (
                        <>
                          <MessageCircle className="w-5 h-5 fill-current" />
                          <span>Save & Continue to WhatsApp</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleSkipDetails}
                      disabled={isSubmitting}
                      className="w-full py-2 text-xs font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors text-center"
                    >
                      Skip & Send Without Details
                    </button>

                    {hasSavedDetails && (
                      <button
                        type="button"
                        onClick={handleForgetDetails}
                        className="w-full py-1.5 text-xs font-semibold text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors text-center block"
                      >
                        Forget my saved details
                      </button>
                    )}
                  </div>
                </form>
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
                    className="bg-botanical-800 dark:bg-botanical-600 hover:bg-botanical-900 dark:hover:bg-botanical-800 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all shadow-md min-h-[44px] active:scale-95"
                  >
                    Explore Plants
                  </button>
                </div>
              ) : (
                /* Cart Item Rows with Framer Motion deletion animation */
                <div className="space-y-4">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.div
                        key={item.plant_id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-center justify-between p-3.5 bg-white dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 rounded-2xl shadow-2xs hover:border-stone-300 dark:hover:border-stone-600 transition-all">
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
                              <div className="flex items-baseline gap-1.5 mt-0.5">
                                {item.original_price && item.original_price > item.price && (
                                  <span className="text-[11px] text-stone-400 dark:text-stone-500 line-through">
                                    {formatINR(item.original_price)}
                                  </span>
                                )}
                                <span className="text-xs text-terracotta dark:text-terracotta font-semibold">
                                  {formatINR(item.price)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-2 border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 rounded-lg px-1.5 py-0.5 w-max">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.plant_id, item.qty - 1)}
                                  className="w-5 h-5 flex items-center justify-center text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 font-bold text-xs active:scale-90 transition-all"
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
                                  className="w-5 h-5 flex items-center justify-center text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 font-bold text-xs active:scale-90 transition-all"
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
                              className="text-stone-300 dark:text-stone-600 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 active:scale-90"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <span className="font-heading font-bold text-sm text-stone-900 dark:text-stone-100">
                              {formatINR(item.price * item.qty)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Drawer Footer matching mockup */}
            {!orderSentRef && checkoutStep === "cart" && items.length > 0 && (
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
                  onClick={handleInitiateOrder}
                  disabled={isSubmitting}
                  className="w-full bg-terracotta hover:bg-[#b04a25] active:scale-[0.98] text-white font-semibold py-3.5 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
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
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
