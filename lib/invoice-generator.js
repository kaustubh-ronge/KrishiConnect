// Generate unique invoice number
export function generateInvoiceNumber(orderId) {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const shortId = orderId.slice(-6).toUpperCase();
  return `INV-${year}${month}-${shortId}`;
}

// Generate PDF invoice (client-side only)
export async function generateInvoicePDF(order, buyerDetails, sellerDetails) {
  // Dynamic import for client-side only - must be done together
  const jsPDF = (await import('jspdf')).default;
  
  // Import autoTable as side effect - it extends jsPDF prototype
  await import('jspdf-autotable');
  
  // Small delay to ensure plugin is loaded
  await new Promise(resolve => setTimeout(resolve, 10));
  
  const doc = new jsPDF();
  
  // Verify autoTable is available
  if (typeof doc.autoTable !== 'function') {
    console.error('autoTable not found on jsPDF instance');
    throw new Error('Invoice generation failed: PDF library not ready');
  }
  
  // Company/Platform Details
  const companyName = "KrishiConnect";
  const companyAddress = "B2B Agricultural Marketplace\nIndia";
  const companyEmail = "support@krishiconnect.com";
  
  // Colors
  const primaryColor = [34, 197, 94]; // Green
  const darkGray = [55, 65, 81];
  const lightGray = [229, 231, 235];
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont(undefined, 'bold');
  doc.text(companyName, 20, 20);
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(companyAddress, 20, 28);
  
  // Invoice Title
  doc.setTextColor(...darkGray);
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text('INVOICE', 150, 20);
  
  // Invoice Number
  const invoiceNumber = order.invoiceNumber || generateInvoiceNumber(order.id);
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`#${invoiceNumber}`, 150, 28);
  
  // Date
  doc.setFontSize(10);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 150, 34);
  
  // Buyer & Seller Details
  let yPos = 55;
  
  // Buyer Section
  doc.setFillColor(...lightGray);
  doc.rect(20, yPos, 80, 8, 'F');
  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.text('BILL TO:', 22, yPos + 5);
  
  yPos += 12;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.text(buyerDetails.name || 'N/A', 22, yPos);
  yPos += 5;
  if (buyerDetails.email) {
    doc.text(buyerDetails.email, 22, yPos);
    yPos += 5;
  }
  if (buyerDetails.phone) {
    doc.text(`Phone: ${buyerDetails.phone}`, 22, yPos);
    yPos += 5;
  }
  if (buyerDetails.address) {
    const addressLines = doc.splitTextToSize(buyerDetails.address, 75);
    doc.text(addressLines, 22, yPos);
  }
  
  // Seller Section
  yPos = 55;
  doc.setFillColor(...lightGray);
  doc.rect(110, yPos, 80, 8, 'F');
  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.text('SELLER:', 112, yPos + 5);
  
  yPos += 12;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.text(sellerDetails.name || 'Multiple Sellers', 112, yPos);
  yPos += 5;
  if (sellerDetails.phone) {
    doc.text(`Phone: ${sellerDetails.phone}`, 112, yPos);
    yPos += 5;
  }
  if (sellerDetails.address) {
    const addressLines = doc.splitTextToSize(sellerDetails.address, 75);
    doc.text(addressLines, 112, yPos);
  }
  
  // Items Table
  yPos = 110;
  
  // Try using autoTable if available, otherwise use manual table
  if (typeof doc.autoTable === 'function') {
    const tableData = order.items.map(item => {
      const productPrice = item.priceAtPurchase * item.quantity;
      const deliveryCharge = item.deliveryChargeTypeAtPurchase === 'per_unit' 
        ? (item.deliveryChargeAtPurchase || 0) * item.quantity 
        : (item.deliveryChargeAtPurchase || 0);
      const lineTotal = productPrice + deliveryCharge;
      
      return [
        item.product.productName,
        `${item.quantity} ${item.product.unit}`,
        `₹${item.priceAtPurchase.toFixed(2)}`,
        `₹${deliveryCharge.toFixed(2)}`,
        `₹${lineTotal.toFixed(2)}`
      ];
    });
    
    doc.autoTable({
      startY: yPos,
      head: [['Product', 'Quantity', 'Rate', 'Delivery', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
      }
    });
    
    yPos = doc.lastAutoTable.finalY + 15;
  } else {
    // Fallback: Manual table drawing
    console.warn('autoTable not available, using manual table');
    
    // Table header
    doc.setFillColor(...primaryColor);
    doc.rect(20, yPos, 170, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text('Product', 22, yPos + 5);
    doc.text('Quantity', 90, yPos + 5);
    doc.text('Rate', 120, yPos + 5);
    doc.text('Delivery', 145, yPos + 5);
    doc.text('Total', 170, yPos + 5);
    
    yPos += 10;
    doc.setTextColor(...darkGray);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    
    // Table rows
    order.items.forEach((item, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      const productPrice = item.priceAtPurchase * item.quantity;
      const deliveryCharge = item.deliveryChargeTypeAtPurchase === 'per_unit' 
        ? (item.deliveryChargeAtPurchase || 0) * item.quantity 
        : (item.deliveryChargeAtPurchase || 0);
      const lineTotal = productPrice + deliveryCharge;
      
      // Alternate row background
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(20, yPos - 3, 170, 8, 'F');
      }
      
      doc.text(item.product.productName.substring(0, 30), 22, yPos + 2);
      doc.text(`${item.quantity} ${item.product.unit}`, 90, yPos + 2);
      doc.text(`₹${item.priceAtPurchase.toFixed(2)}`, 120, yPos + 2);
      doc.text(`₹${deliveryCharge.toFixed(2)}`, 145, yPos + 2);
      doc.text(`₹${lineTotal.toFixed(2)}`, 170, yPos + 2);
      
      yPos += 8;
    });
    
    yPos += 10;
  }
  
  // Summary Section
  
  const subtotal = order.items.reduce((sum, item) => {
    const productPrice = item.priceAtPurchase * item.quantity;
    const deliveryCharge = item.deliveryChargeTypeAtPurchase === 'per_unit' 
      ? (item.deliveryChargeAtPurchase || 0) * item.quantity 
      : (item.deliveryChargeAtPurchase || 0);
    return sum + productPrice + deliveryCharge;
  }, 0);
  
  const platformFee = order.platformFee;
  const total = order.totalAmount;
  
  doc.setDrawColor(...lightGray);
  doc.line(130, yPos - 5, 190, yPos - 5);
  
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.text('Subtotal:', 135, yPos);
  doc.text(`₹${subtotal.toFixed(2)}`, 190, yPos, { align: 'right' });
  
  yPos += 7;
  doc.text('Platform Fee:', 135, yPos);
  doc.text(`₹${platformFee.toFixed(2)}`, 190, yPos, { align: 'right' });
  
  yPos += 10;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(12);
  doc.setFillColor(...primaryColor);
  doc.rect(130, yPos - 5, 60, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text('GRAND TOTAL:', 135, yPos + 2);
  doc.text(`₹${total.toFixed(2)}`, 185, yPos + 2, { align: 'right' });
  
  // Footer
  yPos = 270;
  doc.setTextColor(...darkGray);
  doc.setFont(undefined, 'italic');
  doc.setFontSize(9);
  doc.text('Thank you for your business!', 105, yPos, { align: 'center' });
  yPos += 5;
  doc.text(`For support, contact: ${companyEmail}`, 105, yPos, { align: 'center' });
  
  // Order Status
  yPos += 8;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(8);
  doc.text(`Order ID: ${order.id} | Status: ${order.orderStatus} | Payment: ${order.paymentStatus}`, 105, yPos, { align: 'center' });
  
  return doc;
}

// Save invoice to database
export async function saveInvoiceNumber(orderId, invoiceNumber) {
  const { db } = await import('@/lib/prisma');
  
  try {
    await db.order.update({
      where: { id: orderId },
      data: { invoiceNumber }
    });
    return { success: true };
  } catch (error) {
    console.error("Save Invoice Number Error:", error);
    return { success: false, error: "Failed to save invoice number" };
  }
}

