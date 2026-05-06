import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const downloadInvoice = (order) => {
  const doc = new jsPDF();
  const themeColor = [22, 163, 74]; // KrishiConnect Green

  // --- Header & Logo Area ---
  // Background rectangle for header
  doc.setFillColor(248, 250, 252); // Very light slate
  doc.rect(0, 0, 210, 45, 'F');
  
  doc.setFontSize(28);
  doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("KrishiConnect", 14, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.setFont("helvetica", "normal");
  doc.text("Fresh from Farms to Your Business", 14, 32);

  doc.setFontSize(22);
  doc.setTextColor(51, 65, 85); // Slate-800
  doc.text("INVOICE", 196, 25, { align: "right" });
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`ID: #${order.id.slice(-8).toUpperCase()}`, 196, 32, { align: "right" });
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 196, 38, { align: "right" });

  // --- Party Details ---
  let currentY = 55;
  
  // Bill To (Buyer)
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO:", 14, currentY);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  const buyerName = order.buyerName || order.buyerUser?.farmerProfile?.name || order.buyerUser?.agentProfile?.name || "Valued Customer";
  doc.text(buyerName, 14, currentY + 6);
  
  const splitAddress = doc.splitTextToSize(order.shippingAddress || "Address not provided", 80);
  doc.text(splitAddress, 14, currentY + 12);
  doc.text(`Phone: ${order.buyerPhone || 'N/A'}`, 14, currentY + 12 + (splitAddress.length * 5));

  // Payment Info
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT DETAILS:", 120, currentY);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Method: ${order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}`, 120, currentY + 6);
  doc.text(`Status: ${order.paymentStatus === 'PAID' ? 'SUCCESS / PAID' : 'PENDING'}`, 120, currentY + 12);

  // --- Items Table ---
  const tableColumn = ["Product Description", "Seller", "Qty", "Price", "Amount"];
  const tableRows = [];

  order.items.forEach((item) => {
    const sellerName = item.sellerName || (item.product.sellerType === 'farmer' 
       ? (item.product.farmer?.name || "Farmer") 
       : (item.product.agent?.companyName || "Agent"));

    const itemData = [
      item.product.productName,
      sellerName,
      `${item.quantity} ${item.product.unit}`,
      `Rs. ${item.priceAtPurchase.toFixed(2)}`,
      `Rs. ${(item.quantity * item.priceAtPurchase).toFixed(2)}`,
    ];
    tableRows.push(itemData);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: currentY + 40,
    theme: 'striped',
    headStyles: { fillColor: themeColor, textColor: 255, fontSize: 10, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 5, textColor: [51, 65, 85] },
    columnStyles: {
      0: { cellWidth: 70 },
      4: { halign: 'right', fontStyle: 'bold' }
    },
    alternateRowStyles: { fillColor: [240, 253, 244] }
  });

  // --- Totals Section ---
  const finalY = doc.lastAutoTable.finalY + 15;
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  
  const subtotal = order.items.reduce((sum, item) => sum + (item.quantity * item.priceAtPurchase), 0);
  const deliveryTotal = order.items.reduce((sum, item) => sum + (item.deliveryChargeAtPurchase || 0), 0);
  
  const drawTotalLine = (label, value, y, isBold = false) => {
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    if (isBold) doc.setTextColor(22, 163, 74);
    doc.text(label, 150, y, { align: "right" });
    doc.text(`Rs. ${value.toFixed(2)}`, 196, y, { align: "right" });
    doc.setTextColor(100, 116, 139);
  };

  drawTotalLine("Items Subtotal:", subtotal, finalY);
  drawTotalLine("Delivery Charges:", deliveryTotal, finalY + 7);
  drawTotalLine("Platform Fee:", order.platformFee || 0, finalY + 14);
  
  // Grand Total Line
  doc.setDrawColor(226, 232, 240);
  doc.line(140, finalY + 18, 196, finalY + 18);
  
  drawTotalLine("GRAND TOTAL:", order.totalAmount, finalY + 28, true);

  // --- Terms & Footer ---
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "bold");
  doc.text("THANK YOU FOR YOUR BUSINESS!", 14, 260);
  
  doc.setFont("helvetica", "normal");
  doc.text("1. All items are sourced directly from verified farmers and agents.", 14, 266);
  doc.text("2. Please check produce quality at the time of delivery.", 14, 271);
  
  doc.setFontSize(8);
  doc.text("This is a computer generated document and does not require a physical signature.", 105, 285, { align: "center" });

  doc.save(`Invoice_KrishiConnect_${order.id.slice(-8)}.pdf`);
};