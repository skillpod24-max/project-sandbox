import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatIndianNumber } from './formatters';

const getOrdinal = (n: number) =>
  ['th','st','nd','rd'][(n % 10 > 3 || Math.floor(n % 100 / 10) === 1) ? 0 : n % 10];


interface DealerInfo {
  dealer_name?: string | null;
  dealer_address?: string | null;
  dealer_phone?: string | null;
  dealer_email?: string | null;
  dealer_gst?: string | null;
}

interface VehicleInfo {
  brand: string;
  model: string;
  variant?: string | null;
  registration_number?: string | null;
  engine_number?: string | null;
  chassis_number?: string | null;
  manufacturing_year: number;
  color?: string | null;
  fuel_type: string;
  transmission: string;
}

interface CustomerInfo {
  full_name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  driving_license_number?: string | null;
}

interface SaleInfo {
  sale_number: string;
  sale_date: string;
  selling_price: number;
  discount?: number | null;
  tax_amount?: number | null;
  total_amount: number;
  down_payment?: number | null;
  amount_paid: number;
  balance_amount: number;
  payment_mode: string;
  is_emi?: boolean | null;

  emi_tenure?: number;
  emi_amount?: number;
  emi_interest_rate?: number;
  emi_start_date?: string;
  emi_due_day?: number; // 1–31
  emi_end_date?: string;
}

const formatRupees = (num: number): string => {
  return 'Rs. ' + formatIndianNumber(num);
};

export const generateSaleInvoicePDF = (
  dealer: DealerInfo,
  vehicle: VehicleInfo,
  customer: CustomerInfo,
  sale: SaleInfo
): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // ---------- CLEAN HEADER ----------
// ---------- HEADER ----------
doc.setFillColor(41, 128, 185);
const headerHeight = 40; // enough for name + contact + address
doc.rect(0, 0, pageWidth, headerHeight, 'F');  // 🔑 BLUE ONLY FOR NAME + CONTACT

// White text for header
doc.setTextColor(255, 255, 255);

// Dealer name
doc.setFont('helvetica', 'bold');
doc.setFontSize(18);
if (!dealer.dealer_name) {
  throw new Error('Dealer name is required for invoice');
}
doc.text(dealer.dealer_name, pageWidth / 2, 14, { align: 'center' });

// Phone + Email
doc.setFont('helvetica', 'normal');
doc.setFontSize(9);
doc.text(
  [dealer.dealer_phone, dealer.dealer_email].filter(Boolean).join(' | '),
  pageWidth / 2,
  20,
  { align: 'center' }
);

// -------- WHITE SECTION BELOW HEADER --------
doc.setTextColor(30, 30, 30);

// Divider
doc.setDrawColor(180, 180, 180);
doc.line(15, 26, pageWidth - 15, 26);




let afterHeaderY = 26;

if (dealer.dealer_address) {
  const addr = doc.splitTextToSize(dealer.dealer_address, pageWidth - 40);
  const lineHeight = 4;
  const boxHeight = addr.length * lineHeight + 4;
  const boxY = 28;

  doc.setFillColor(245, 247, 250);
  doc.roundedRect(15, boxY, pageWidth - 30, boxHeight, 2, 2, 'F');

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);
  doc.text(addr, pageWidth / 2, boxY + 6, { align: 'center' });

  afterHeaderY = boxY + boxHeight + 4;
}

if (dealer.dealer_gst) {
  doc.setFontSize(8);
  doc.text(`GSTIN: ${dealer.dealer_gst}`, pageWidth / 2, afterHeaderY, { align: 'center' });
}


  
  // Invoice title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', pageWidth / 2, 58, { align: 'center' });
  
  // Invoice details box
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, 65, pageWidth - 30, 20, 2, 2, 'S');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice No:', 20, 73);
  doc.setFont('helvetica', 'normal');
  doc.text(sale.sale_number, 48, 73);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', pageWidth - 60, 73);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(sale.sale_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), pageWidth - 48, 73);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Mode:', 20, 81);
  doc.setFont('helvetica', 'normal');
  doc.text(sale.payment_mode.replace('_', ' ').toUpperCase() + (sale.is_emi ? ' (EMI)' : ''), 52, 81);
  
  // Customer details section
doc.setFillColor(240, 248, 255);
doc.roundedRect(15, 90, (pageWidth - 35) / 2, 50, 3, 3, 'F');

doc.setFontSize(11);
doc.setFont('helvetica', 'bold');
doc.setTextColor(41, 128, 185);
doc.text('BILL TO', 20, 100);

doc.setTextColor(30, 30, 30);
doc.setFontSize(10);

let y = 108;

// Name
doc.setFont('helvetica', 'bold');
doc.text(customer.full_name, 20, y);
y += 5;

// Phone
doc.setFont('helvetica', 'bold');
doc.text('Phone:', 20, y);
doc.setFont('helvetica', 'normal');
doc.text(customer.phone, 35, y);
y += 5;

// Email
if (customer.email) {
  doc.setFont('helvetica', 'bold');
  doc.text('Email:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(customer.email, 35, y);
  y += 5;
}

// Address
if (customer.address) {
  const addressLines = doc.splitTextToSize(customer.address, 75);
  doc.text(addressLines, 20, y);
}

  
  // Vehicle details section - Right side
  doc.setFillColor(255, 250, 240); // Light orange background
  doc.roundedRect((pageWidth + 5) / 2, 90, (pageWidth - 35) / 2, 50, 3, 3, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(230, 126, 34);
  doc.text('VEHICLE DETAILS', (pageWidth + 10) / 2, 100);
  
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const vehicleName = `${vehicle.brand} ${vehicle.model}${vehicle.variant ? ' ' + vehicle.variant : ''}`;
  doc.setFont('helvetica', 'bold');
  doc.text(vehicleName, (pageWidth + 10) / 2, 109);
  doc.setFont('helvetica', 'normal');
  doc.text(`Year: ${vehicle.manufacturing_year} | Color: ${vehicle.color || 'N/A'}`, (pageWidth + 10) / 2, 117);
  doc.text(`Fuel: ${vehicle.fuel_type.toUpperCase()} | Trans: ${vehicle.transmission.toUpperCase()}`, (pageWidth + 10) / 2, 125);
  
  
  // Vehicle specifications table
  autoTable(doc, {
    startY: 147,
    head: [['Specification', 'Details']],
    body: [
      ['Engine Number', vehicle.engine_number || 'N/A'],
      ['Chassis Number', vehicle.chassis_number || 'N/A'],
      ['Registration Number', vehicle.registration_number || 'N/A'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 10, fontStyle: 'bold' },
    bodyStyles: { fontSize: 10, textColor: [30, 30, 30] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 'auto' },
    },
    margin: { left: 15, right: 15 },
  });
  
  // Pricing table
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  autoTable(doc, {
    startY: finalY,
    head: [['Description', 'Amount']],
    body: [
      ['Selling Price', formatRupees(sale.selling_price)],
      ['Discount', `- ${formatRupees(sale.discount || 0)}`],
      ['Tax Amount', formatRupees(sale.tax_amount || 0)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [46, 204, 113], textColor: 255, fontSize: 10, fontStyle: 'bold' },
    bodyStyles: { fontSize: 10, textColor: [30, 30, 30] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 80 },
      1: { halign: 'right', cellWidth: 'auto' },
    },
    margin: { left: 15, right: 15 },
  });
  
  // Total and Payment table
  const pricingY = (doc as any).lastAutoTable.finalY + 5;
  
  autoTable(doc, {
    startY: pricingY,
    body: [
      [{ content: 'TOTAL AMOUNT', styles: { fontStyle: 'bold', fontSize: 12 } }, { content: formatRupees(sale.total_amount), styles: { fontStyle: 'bold', fontSize: 12 } }],
      ['Down Payment', formatRupees(sale.down_payment || 0)],
      ['Amount Paid', formatRupees(sale.amount_paid)],
      [{ content: 'Balance Due', styles: { fontStyle: 'bold', textColor: sale.balance_amount > 0 ? [220, 53, 69] : [40, 167, 69] } }, 
       { content: formatRupees(sale.balance_amount), styles: { fontStyle: 'bold', textColor: sale.balance_amount > 0 ? [220, 53, 69] : [40, 167, 69] } }],
    ],
    
    theme: 'grid',
    bodyStyles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'right', cellWidth: 'auto' },
    },
    margin: { left: 15, right: 15 },
  });

  // ================= EMI DETAILS =================
if (sale.is_emi) {
  const emiStartY = (doc as any).lastAutoTable.finalY + 8;

  autoTable(doc, {
    startY: emiStartY,
    head: [['EMI DETAILS', '']],
    body: [
  ['Financed Amount', formatRupees(sale.balance_amount)],
  ['Monthly EMI', formatRupees(sale.emi_amount || 0)],
  ['EMI Due Date', sale.emi_due_day ? `Every ${sale.emi_due_day}${getOrdinal(sale.emi_due_day)} of the month` : '-'],
  ['EMI Start Date', sale.emi_start_date || '-'],
  ['EMI End Date', sale.emi_end_date || '-'],
  ['Tenure', `${sale.emi_tenure || '-'} Months`],
  ['Interest Rate', `${sale.emi_interest_rate || 0}%`],
],

    theme: 'grid',
    headStyles: {
      fillColor: [155, 89, 182],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 80 },
      1: { halign: 'right' },
    },
    margin: { left: 15, right: 15 },
  });
}

  
  // Footer
  const footerY = (doc as any).lastAutoTable.finalY + 25;
  
  // Signature lines
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.3);
  doc.line(20, footerY + 15, 70, footerY + 15);
  doc.line(pageWidth - 70, footerY + 15, pageWidth - 20, footerY + 15);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Customer Signature', 45, footerY + 22, { align: 'center' });
  doc.text('Authorized Signature', pageWidth - 45, footerY + 22, { align: 'center' });
  
  // Thank you note
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for your business!', pageWidth / 2, footerY + 35, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('This is a computer-generated invoice and does not require a physical signature.', pageWidth / 2, footerY + 42, { align: 'center' });
  if (sale.is_emi) {
  doc.text(
    'Note: This sale is governed by an EMI agreement. Ownership transfer is subject to full EMI clearance.',
    pageWidth / 2,
    footerY + 50,
    { align: 'center' }
  );
}

  // Save the PDF
  doc.save(`Invoice_${sale.sale_number}.pdf`);
};
