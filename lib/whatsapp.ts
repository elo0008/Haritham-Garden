/**
 * Builds a WhatsApp click-to-chat URL with a pre-filled message.
 *
 * @param phoneNumber - Phone number in international format without '+' or spaces (e.g. "919876543210")
 * @param message - The pre-filled message text
 * @returns A WhatsApp URL string
 */
export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phoneNumber}?text=${encoded}`;
}

/**
 * Builds an order enquiry message for WhatsApp.
 *
 * @param plantName - Name of the plant being enquired about
 * @param quantity - Quantity desired
 * @returns A formatted order enquiry string
 */
export function buildOrderEnquiryMessage(
  plantName: string,
  quantity: number = 1
): string {
  return `Hi! I'm interested in ordering ${quantity} x ${plantName} from Haritham Garden. Could you please share availability and pricing?`;
}
