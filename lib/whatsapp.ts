import type { CartItem, CustomerDetails } from "@/lib/types";

/**
 * Default WhatsApp number for Haritham Garden (can be overridden by NEXT_PUBLIC_WHATSAPP_NUMBER).
 */
export const DEFAULT_WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919876543210";

/**
 * Builds a WhatsApp click-to-chat URL with a pre-filled message.
 *
 * @param phoneNumber - Phone number in international format without '+' or spaces (e.g. "919876543210")
 * @param message - The pre-filled message text
 * @returns A WhatsApp URL string
 */
export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

/**
 * Builds a formatted cart order message for WhatsApp.
 *
 * @param items - Cart items snapshot
 * @param subtotal - Calculated order subtotal
 * @param orderRef - Generated order reference (e.g. HG-014)
 * @param customerDetails - Optional customer delivery details
 * @returns A formatted WhatsApp message string
 */
export function buildCartOrderMessage(
  items: CartItem[],
  subtotal: number,
  orderRef: string,
  customerDetails?: CustomerDetails
): string {
  const itemLines = items
    .map((item, idx) => ` ${idx + 1}. ${item.name} x${item.qty} - Rs.${item.price * item.qty}`)
    .join("\n");

  let message =
    `Hello Haritham Garden, I'd like to order:\n\n` +
    `${itemLines}\n\n` +
    `Subtotal: Rs.${subtotal}\n` +
    `(Delivery to be confirmed)\n\n` +
    `Order ref: ${orderRef}`;

  const name = customerDetails?.name?.trim();
  const phone = customerDetails?.phone?.trim();
  const address = customerDetails?.address?.trim();
  const pincode = customerDetails?.pincode?.trim();

  if (name || phone || address || pincode) {
    message += `\n\n📋 *Delivery Details:*`;
    if (name) message += `\n• Name: ${name}`;
    if (phone) message += `\n• Phone: ${phone}`;
    if (address) message += `\n• Address: ${address}`;
    if (pincode) message += `\n• Pincode: ${pincode}`;
  }

  return message;
}

/**
 * Builds a simple order enquiry message for WhatsApp.
 */
export function buildOrderEnquiryMessage(
  plantName: string,
  quantity: number = 1
): string {
  return `Hi! I'm interested in ordering ${quantity} x ${plantName} from Haritham Garden. Could you please share availability and pricing?`;
}
