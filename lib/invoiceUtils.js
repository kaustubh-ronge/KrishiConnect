import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // Import default export

export const downloadInvoice = (order) => {
  const doc = new jsPDF();

  // --- Header ---
  doc.setFontSize(22);
  doc.setTextColor(22, 163, 74); // Green color
  doc.text("KrishiConnect", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Agricultural B2B Marketplace", 14, 26);

  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("INVOICE", 196, 20, { align: "right" });
  
  doc.setFontSize(10);
  doc.text(`Invoice #: ${order.id.slice(-8).toUpperCase()}`, 196, 26, { align: "right" });
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 196, 31, { align: "right" });

  // --- Line ---
  doc.setLineWidth(0.5);
  doc.setDrawColor(200);
  doc.line(14, 36, 196, 36);

  // --- Info Section ---
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text("Bill To:", 14, 46);
  
  doc.setFontSize(10);
  doc.setTextColor(80);
  const buyerName = order.buyerUser?.farmerProfile?.name || order.buyerUser?.agentProfile?.name || "Valued Customer";
  doc.text(buyerName, 14, 52);
  doc.text(`Order ID: ${order.id}`, 14, 57);

  // --- Items Table ---
  const tableColumn = ["Product", "Seller", "Qty", "Unit Price", "Total"];
  const tableRows = [];

  order.items.forEach((item) => {
    const sellerName = item.product.sellerType === 'farmer' 
       ? (item.product.farmer?.name || "Farmer") 
       : (item.product.agent?.companyName || "Agent");

    const itemData = [
      item.product.productName,
      sellerName,
      `${item.quantity} ${item.product.unit}`,
      `Rs. ${item.priceAtPurchase}`,
      `Rs. ${(item.quantity * item.priceAtPurchase).toFixed(2)}`,
    ];
    tableRows.push(itemData);
  });

  // FIX: Use autoTable as a function, passing 'doc' as the first argument
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 65,
    theme: 'grid',
    headStyles: { fillColor: [22, 163, 74], textColor: 255, fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 3 },
    alternateRowStyles: { fillColor: [240, 253, 244] }
  });

  // --- Totals ---
  const finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.setTextColor(0);
  
  const subtotal = order.items.reduce((sum, item) => sum + (item.quantity * item.priceAtPurchase), 0);
  
  doc.text(`Subtotal:`, 160, finalY, { align: "right" });
  doc.text(`Rs. ${subtotal.toFixed(2)}`, 196, finalY, { align: "right" });
  
  doc.text(`Platform Fee:`, 160, finalY + 6, { align: "right" });
  doc.text(`Rs. ${order.platformFee.toFixed(2)}`, 196, finalY + 6, { align: "right" });
  
  doc.setDrawColor(200);
  doc.line(140, finalY + 10, 196, finalY + 10);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Grand Total:`, 160, finalY + 18, { align: "right" });
  doc.text(`Rs. ${order.totalAmount.toFixed(2)}`, 196, finalY + 18, { align: "right" });

  // --- Footer ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text("This is a computer generated invoice.", 105, 280, { align: "center" });

  doc.save(`Invoice_${order.id.slice(-8)}.pdf`);
};