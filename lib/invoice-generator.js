/**
 * Simple invoice number generator for KrishiConnect
 */
export function generateInvoiceNumber(orderId) {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const shortId = orderId.slice(-6).toUpperCase();
  
  return `KC-${year}${month}-${shortId}`;
}
