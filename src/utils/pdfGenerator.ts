import { jsPDF } from 'jspdf';
import { Order } from '../types';

/**
 * Format currency to Argentine Pesos style
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Generates a thermal ticket PDF (80mm format) for a given order or a batch comanda
 */
export const generateOrderTicketPDF = (order: Order, businessConfig: { businessName: string; whatsappPhone: string }) => {
  // Calculate dynamic height based on item counts and notes to fit perfectly
  const headerHeight = 55;
  const clientHeight = 35 + (order.orderType === 'delivery' ? 12 : 0) + (order.customerContact ? 6 : 0);
  const itemsHeight = order.items.length * 9 + 8;
  const notesHeight = order.notes ? (Math.ceil(order.notes.length / 32) * 5 + 10) : 0;
  const summaryHeight = 32 + (order.deliveryCost ? 6 : 0);
  const footerHeight = 15;

  const totalHeight = headerHeight + clientHeight + itemsHeight + notesHeight + summaryHeight + footerHeight;
  const docHeight = Math.max(totalHeight, 130);

  // create a PDF with 80mm width (typical thermal printer size)
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, docHeight],
    orientation: 'portrait',
  });

  // Margins & widths
  const margin = 5;
  const width = 80;
  const contentWidth = width - (margin * 2);

  let y = 10;

  // Helpers for text printing
  const printCentered = (text: string, fontSize: number, style: 'normal' | 'bold' | 'italic' = 'normal') => {
    doc.setFont('helvetica', style);
    doc.setFontSize(fontSize);
    doc.text(text, width / 2, y, { align: 'center' });
    y += fontSize * 0.4 + 1.5;
  };

  const printLeft = (text: string, fontSize: number, style: 'normal' | 'bold' | 'italic' = 'normal', xOffset = margin) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(fontSize);
    doc.text(text, xOffset, y);
  };

  const printRight = (text: string, fontSize: number, style: 'normal' | 'bold' | 'italic' = 'normal', xOffset = width - margin) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(fontSize);
    doc.text(text, xOffset, y, { align: 'right' });
  };

  const printDivider = (char = '-') => {
    doc.setFont('courier', 'normal');
    doc.setFontSize(9);
    const text = char.repeat(38);
    doc.text(text, width / 2, y, { align: 'center' });
    y += 4;
  };

  // --- HEADER SECTION ---
  printCentered(businessConfig.businessName.toUpperCase(), 16, 'bold');
  printCentered('SABOR Y TRADICIÓN', 8, 'italic');
  
  if (businessConfig.whatsappPhone) {
    printCentered(`Cel: ${businessConfig.whatsappPhone}`, 8, 'normal');
  }
  
  y += 2;
  printDivider('=');
  
  printCentered('COMANDA DE COCINA', 11, 'bold');
  printCentered(`PEDIDO #${order.id.slice(0, 8).toUpperCase()}`, 11, 'bold');
  
  y += 1;
  const dateObj = new Date(order.createdAt);
  const dateStr = dateObj.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  
  printLeft(`Fecha: ${dateStr}`, 8, 'normal');
  printRight(`Hora: ${timeStr} hs`, 8, 'normal');
  y += 4;
  
  printDivider('-');

  // --- CLIENT INFO SECTION ---
  printLeft('CLIENTE:', 8, 'bold');
  y += 4;
  printLeft(order.customerName, 10, 'bold', margin + 2);
  y += 5;

  const modalityStr = order.orderType === 'delivery' 
    ? '🛵 Delivery a Domicilio' 
    : order.orderType === 'local' 
    ? '🍽️ Consumo en Mesa' 
    : '🛍️ Takeaway / Para retirar';
    
  printLeft(`Modalidad: ${modalityStr}`, 8, 'normal');
  y += 4.5;

  if (order.customerContact) {
    printLeft(`WhatsApp: ${order.customerContact}`, 8, 'normal');
    y += 4.5;
  }

  if (order.orderType === 'delivery') {
    printLeft('Dirección de Entrega:', 8, 'bold');
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const splitAddress = doc.splitTextToSize(order.deliveryAddress || 'No especificada', contentWidth - 4);
    for (let i = 0; i < splitAddress.length; i++) {
      doc.text(splitAddress[i], margin + 2, y);
      y += 3.8;
    }
  }
  
  y += 1;
  printDivider('-');

  // --- ITEMS SECTION ---
  printLeft('DETALLE DE PRODUCTOS', 8, 'bold');
  y += 4;

  // Header columns
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CANT', margin, y);
  doc.text('DESCRIPCIÓN', margin + 11, y);
  doc.text('TOTAL', width - margin, y, { align: 'right' });
  y += 4.5;

  printDivider('.');

  doc.setFont('helvetica', 'normal');
  order.items.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    
    // Print quantity in bold
    printLeft(`${item.quantity}x`, 9, 'bold');
    
    // Print product name (wrapped if too long)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const maxNameWidth = width - margin * 2 - 11 - 18; // space in mm for name
    const splitName = doc.splitTextToSize(item.productName, maxNameWidth);
    
    const initialY = y;
    for (let i = 0; i < splitName.length; i++) {
      doc.text(splitName[i], margin + 11, y);
      if (i < splitName.length - 1) {
        y += 3.5;
      }
    }
    
    // Print total on the right aligned with the top of item line
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(formatCurrency(itemTotal), width - margin, initialY, { align: 'right' });
    y += 5.5;
  });

  printDivider('-');

  // --- NOTES SECTION (IF APPLICABLE) ---
  if (order.notes) {
    printLeft('ACLARACIONES DEL CLIENTE:', 8, 'bold');
    y += 4;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    const splitNotes = doc.splitTextToSize(`"${order.notes}"`, contentWidth - 2);
    for (let i = 0; i < splitNotes.length; i++) {
      doc.text(splitNotes[i], margin + 1, y);
      y += 3.8;
    }
    y += 2;
    printDivider('-');
  }

  // --- FINANCIAL SUMMARY SECTION ---
  const subtotal = order.totalPrice - (order.deliveryCost || 0);
  
  printLeft('Subtotal comp.:', 8, 'normal');
  printRight(formatCurrency(subtotal), 8, 'normal');
  y += 4;

  if (order.deliveryCost) {
    printLeft('Costo de Envío:', 8, 'normal');
    printRight(formatCurrency(order.deliveryCost), 8, 'normal');
    y += 4;
  }

  printLeft('Medio de Pago:', 8, 'normal');
  printRight(order.paymentMethod || 'No especificado', 8, 'bold');
  y += 4.5;

  y += 1;
  doc.setLineWidth(0.3);
  doc.line(margin, y, width - margin, y);
  y += 4.5;

  printLeft('TOTAL A COBRAR:', 10, 'bold');
  printRight(formatCurrency(order.totalPrice), 11, 'bold');
  y += 6;

  printDivider('=');

  // --- FOOTER SECTION ---
  printCentered('¡Muchas gracias por su compra!', 8, 'bold');
  printCentered('El Carretero - Comanda de Pedidos', 7, 'normal');

  // Save the PDF
  const filename = `comanda-${order.id.slice(0, 8)}-${order.customerName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
};

/**
 * Generates a consolidated PDF ticket (80mm format) for a list of orders (e.g., active orders consolidated report)
 */
export const generateConsolidatedTicketsPDF = (orders: Order[], title = 'PENDIENTES DE COCINA') => {
  if (orders.length === 0) return;

  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4', // print on general A4 sheet for admin convenience
    orientation: 'portrait',
  });

  let y = 15;
  const margin = 15;
  const width = 210;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('EL CARRETERO - REPORTE DE COMANDAS', width / 2, y, { align: 'center' });
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Lista consolidada de comandas: ${title}`, width / 2, y, { align: 'center' });
  y += 4;

  const now = new Date();
  doc.setFontSize(9);
  doc.text(`Generado el: ${now.toLocaleDateString('es-AR')} a las ${now.toLocaleTimeString('es-AR')} hs`, width / 2, y, { align: 'center' });
  y += 10;

  doc.setLineWidth(0.3);
  doc.line(margin, y, width - margin, y);
  y += 8;

  // List of orders
  orders.forEach((order, index) => {
    // Check page overflow
    if (y > 260) {
      doc.addPage();
      y = 15;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`${index + 1}. Pedido #${order.id.slice(0, 8).toUpperCase()} - ${order.customerName}`, margin, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const dateObj = new Date(order.createdAt);
    const timeStr = dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    doc.text(`Ingreso: ${timeStr} | Tipo: ${order.orderType === 'delivery' ? 'Delivery' : order.orderType === 'local' ? 'En Mesa' : 'Takeaway'} | Pago: ${order.paymentMethod || 'No esp.'}`, 120, y);
    y += 4.5;

    // Items list
    doc.setFont('courier', 'normal');
    doc.setFontSize(8.5);
    order.items.forEach((item) => {
      doc.text(`  • ${item.quantity}x ${item.productName.padEnd(35)} - Unit: ${formatCurrency(item.price)}`, margin + 4, y);
      y += 4;
    });

    if (order.notes) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.text(`  Comentarios: "${order.notes}"`, margin + 4, y);
      y += 4;
    }

    // Border line between entries
    y += 1.5;
    doc.setLineWidth(0.1);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, width - margin, y);
    y += 6;
  });

  doc.save(`consolidado-comandas-${now.toISOString().split('T')[0]}.pdf`);
};
